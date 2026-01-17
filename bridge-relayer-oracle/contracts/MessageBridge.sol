// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./libraries/MerkleProof.sol";
import "./BridgeOracle.sol";

/**
 * @title MessageBridge
 * @dev Generic cross-chain message passing contract
 * Handles message sending, receiving, and verification
 */
contract MessageBridge is Ownable, ReentrancyGuard, Pausable {
    using MerkleProof for bytes32[];

    // ============ Structs ============

    struct Message {
        uint256 nonce;
        uint256 sourceChainId;
        uint256 destChainId;
        address sender;
        address target;
        bytes data;
        uint256 gasLimit;
        uint256 timestamp;
    }

    struct MessageStatus {
        bool sent;
        bool executed;
        bool failed;
        uint256 executedAt;
        bytes32 resultHash;
    }

    // ============ State Variables ============

    BridgeOracle public oracle;

    // Chain configuration
    uint256 public immutable chainId;

    // Message tracking
    uint256 public outboundNonce;
    uint256 public inboundNonce;

    // Nonce => Message hash
    mapping(uint256 => bytes32) public outboundMessages;
    // Source chain => Nonce => executed
    mapping(uint256 => mapping(uint256 => MessageStatus)) public inboundMessages;

    // Message queue for batch processing
    bytes32[] public messageQueue;
    mapping(bytes32 => bool) public isQueued;

    // Gas configuration
    uint256 public defaultGasLimit;
    uint256 public maxGasLimit;
    uint256 public minGasLimit;

    // Fee configuration
    uint256 public baseFee;
    mapping(uint256 => uint256) public chainFeeMultiplier; // In basis points

    // Relayer whitelist (optional)
    mapping(address => bool) public authorizedRelayers;
    bool public relayerWhitelistEnabled;

    // ============ Events ============

    event MessageSent(
        bytes32 indexed messageHash,
        uint256 indexed nonce,
        uint256 indexed destChainId,
        address sender,
        address target,
        bytes data,
        uint256 gasLimit,
        uint256 fee
    );

    event MessageExecuted(
        bytes32 indexed messageHash,
        uint256 indexed sourceChainId,
        uint256 indexed nonce,
        bool success,
        bytes returnData
    );

    event MessageFailed(
        bytes32 indexed messageHash,
        uint256 indexed sourceChainId,
        uint256 indexed nonce,
        string reason
    );

    event MessageQueued(bytes32 indexed messageHash);
    event MessageDequeued(bytes32 indexed messageHash);
    event RelayerAuthorized(address indexed relayer);
    event RelayerRevoked(address indexed relayer);
    event FeeUpdated(uint256 baseFee, uint256 chainId, uint256 multiplier);

    // ============ Errors ============

    error InvalidDestination();
    error InsufficientFee();
    error InvalidGasLimit();
    error MessageAlreadyExecuted();
    error MessageNotFound();
    error InvalidProof();
    error ExecutionFailed();
    error UnauthorizedRelayer();
    error InvalidSourceChain();
    error InvalidNonce();
    error TargetCallFailed();
    error MessageNotQueued();

    // ============ Modifiers ============

    modifier onlyAuthorizedRelayer() {
        if (relayerWhitelistEnabled && !authorizedRelayers[msg.sender]) {
            revert UnauthorizedRelayer();
        }
        _;
    }

    // ============ Constructor ============

    constructor(
        address _oracle,
        uint256 _chainId,
        uint256 _baseFee,
        uint256 _defaultGasLimit
    ) Ownable(msg.sender) {
        oracle = BridgeOracle(_oracle);
        chainId = _chainId;
        baseFee = _baseFee;
        defaultGasLimit = _defaultGasLimit;
        minGasLimit = 21000;
        maxGasLimit = 10000000; // 10M gas
    }

    // ============ External Functions ============

    /**
     * @dev Send a message to another chain
     * @param destChainId Destination chain ID
     * @param target Target contract address
     * @param data Call data
     * @param gasLimit Gas limit for execution
     */
    function sendMessage(
        uint256 destChainId,
        address target,
        bytes calldata data,
        uint256 gasLimit
    ) external payable whenNotPaused nonReentrant returns (bytes32) {
        if (destChainId == chainId || destChainId == 0) {
            revert InvalidDestination();
        }

        uint256 effectiveGasLimit = gasLimit == 0 ? defaultGasLimit : gasLimit;
        if (effectiveGasLimit < minGasLimit || effectiveGasLimit > maxGasLimit) {
            revert InvalidGasLimit();
        }

        uint256 fee = estimateFee(destChainId, effectiveGasLimit);
        if (msg.value < fee) {
            revert InsufficientFee();
        }

        uint256 nonce = outboundNonce++;

        Message memory message = Message({
            nonce: nonce,
            sourceChainId: chainId,
            destChainId: destChainId,
            sender: msg.sender,
            target: target,
            data: data,
            gasLimit: effectiveGasLimit,
            timestamp: block.timestamp
        });

        bytes32 messageHash = _hashMessage(message);
        outboundMessages[nonce] = messageHash;

        // Refund excess fee
        if (msg.value > fee) {
            (bool success, ) = payable(msg.sender).call{value: msg.value - fee}("");
            require(success, "Refund failed");
        }

        emit MessageSent(
            messageHash,
            nonce,
            destChainId,
            msg.sender,
            target,
            data,
            effectiveGasLimit,
            fee
        );

        return messageHash;
    }

    /**
     * @dev Execute a message from another chain
     * @param message The message to execute
     * @param proof Merkle proof for the message
     * @param blockNumber The block number where message is included
     */
    function executeMessage(
        Message calldata message,
        bytes32[] calldata proof,
        uint256 blockNumber
    ) external whenNotPaused nonReentrant onlyAuthorizedRelayer {
        if (message.destChainId != chainId) {
            revert InvalidDestination();
        }

        bytes32 messageHash = _hashMessage(message);

        // Check if already executed
        MessageStatus storage status = inboundMessages[message.sourceChainId][message.nonce];
        if (status.executed || status.failed) {
            revert MessageAlreadyExecuted();
        }

        // Verify proof against oracle
        bytes32 leaf = keccak256(abi.encodePacked(messageHash));
        bool isValid = oracle.verifyProof(
            message.sourceChainId,
            blockNumber,
            proof,
            leaf
        );

        if (!isValid) {
            revert InvalidProof();
        }

        // Execute the message
        status.executed = true;
        status.executedAt = block.timestamp;

        (bool success, bytes memory returnData) = message.target.call{
            gas: message.gasLimit
        }(
            abi.encodePacked(message.data, message.sender)
        );

        if (success) {
            status.resultHash = keccak256(returnData);
            emit MessageExecuted(
                messageHash,
                message.sourceChainId,
                message.nonce,
                true,
                returnData
            );
        } else {
            status.failed = true;
            emit MessageFailed(
                messageHash,
                message.sourceChainId,
                message.nonce,
                _getRevertReason(returnData)
            );
        }
    }

    /**
     * @dev Execute a message without proof (for testing/trusted relayers)
     * Only works when relayer whitelist is enabled
     */
    function executeMessageTrusted(
        Message calldata message
    ) external whenNotPaused nonReentrant onlyAuthorizedRelayer {
        require(relayerWhitelistEnabled, "Trusted execution disabled");

        if (message.destChainId != chainId) {
            revert InvalidDestination();
        }

        bytes32 messageHash = _hashMessage(message);

        MessageStatus storage status = inboundMessages[message.sourceChainId][message.nonce];
        if (status.executed || status.failed) {
            revert MessageAlreadyExecuted();
        }

        status.executed = true;
        status.executedAt = block.timestamp;

        (bool success, bytes memory returnData) = message.target.call{
            gas: message.gasLimit
        }(
            abi.encodePacked(message.data, message.sender)
        );

        if (success) {
            status.resultHash = keccak256(returnData);
            emit MessageExecuted(
                messageHash,
                message.sourceChainId,
                message.nonce,
                true,
                returnData
            );
        } else {
            status.failed = true;
            emit MessageFailed(
                messageHash,
                message.sourceChainId,
                message.nonce,
                _getRevertReason(returnData)
            );
        }
    }

    /**
     * @dev Queue a message for batch processing
     * @param messageHash The message hash to queue
     */
    function queueMessage(bytes32 messageHash) external onlyAuthorizedRelayer {
        if (isQueued[messageHash]) {
            return;
        }
        isQueued[messageHash] = true;
        messageQueue.push(messageHash);
        emit MessageQueued(messageHash);
    }

    /**
     * @dev Remove a message from the queue
     * @param messageHash The message hash to remove
     */
    function dequeueMessage(bytes32 messageHash) external onlyAuthorizedRelayer {
        if (!isQueued[messageHash]) {
            revert MessageNotQueued();
        }
        isQueued[messageHash] = false;

        // Find and remove from array
        for (uint256 i = 0; i < messageQueue.length; i++) {
            if (messageQueue[i] == messageHash) {
                messageQueue[i] = messageQueue[messageQueue.length - 1];
                messageQueue.pop();
                break;
            }
        }
        emit MessageDequeued(messageHash);
    }

    /**
     * @dev Retry a failed message
     * @param message The message to retry
     */
    function retryMessage(
        Message calldata message
    ) external whenNotPaused nonReentrant onlyAuthorizedRelayer {
        bytes32 messageHash = _hashMessage(message);
        MessageStatus storage status = inboundMessages[message.sourceChainId][message.nonce];

        if (!status.failed) {
            revert MessageNotFound();
        }

        // Reset status for retry
        status.failed = false;
        status.executed = true;
        status.executedAt = block.timestamp;

        (bool success, bytes memory returnData) = message.target.call{
            gas: message.gasLimit
        }(
            abi.encodePacked(message.data, message.sender)
        );

        if (success) {
            status.resultHash = keccak256(returnData);
            emit MessageExecuted(
                messageHash,
                message.sourceChainId,
                message.nonce,
                true,
                returnData
            );
        } else {
            status.failed = true;
            emit MessageFailed(
                messageHash,
                message.sourceChainId,
                message.nonce,
                _getRevertReason(returnData)
            );
        }
    }

    // ============ View Functions ============

    /**
     * @dev Estimate fee for sending a message
     * @param destChainId Destination chain ID
     * @param gasLimit Gas limit
     */
    function estimateFee(
        uint256 destChainId,
        uint256 gasLimit
    ) public view returns (uint256) {
        uint256 multiplier = chainFeeMultiplier[destChainId];
        if (multiplier == 0) {
            multiplier = 10000; // 100% = 1x
        }

        uint256 gasCost = gasLimit * tx.gasprice;
        uint256 totalFee = baseFee + (gasCost * multiplier) / 10000;

        return totalFee;
    }

    /**
     * @dev Get message status
     */
    function getMessageStatus(
        uint256 sourceChainId,
        uint256 nonce
    ) external view returns (MessageStatus memory) {
        return inboundMessages[sourceChainId][nonce];
    }

    /**
     * @dev Get outbound message hash
     */
    function getOutboundMessageHash(uint256 nonce) external view returns (bytes32) {
        return outboundMessages[nonce];
    }

    /**
     * @dev Get message queue
     */
    function getMessageQueue() external view returns (bytes32[] memory) {
        return messageQueue;
    }

    /**
     * @dev Get queue length
     */
    function getQueueLength() external view returns (uint256) {
        return messageQueue.length;
    }

    /**
     * @dev Hash a message
     */
    function hashMessage(Message calldata message) external pure returns (bytes32) {
        return _hashMessage(message);
    }

    /**
     * @dev Estimate gas for message execution (helper for relayers)
     * @param target Target contract
     * @param data Call data
     */
    function estimateGas(
        address target,
        bytes calldata data
    ) external view returns (uint256) {
        // This is a simplified estimation
        // In production, relayers should use eth_estimateGas
        uint256 baseGas = 21000;
        uint256 dataGas = data.length * 16; // 16 gas per byte
        uint256 targetGas = target.code.length > 0 ? 50000 : 0;

        return baseGas + dataGas + targetGas;
    }

    // ============ Admin Functions ============

    /**
     * @dev Set oracle address
     */
    function setOracle(address _oracle) external onlyOwner {
        oracle = BridgeOracle(_oracle);
    }

    /**
     * @dev Set gas limits
     */
    function setGasLimits(
        uint256 _defaultGasLimit,
        uint256 _minGasLimit,
        uint256 _maxGasLimit
    ) external onlyOwner {
        defaultGasLimit = _defaultGasLimit;
        minGasLimit = _minGasLimit;
        maxGasLimit = _maxGasLimit;
    }

    /**
     * @dev Set base fee
     */
    function setBaseFee(uint256 _baseFee) external onlyOwner {
        baseFee = _baseFee;
        emit FeeUpdated(_baseFee, 0, 0);
    }

    /**
     * @dev Set chain fee multiplier
     */
    function setChainFeeMultiplier(
        uint256 destChainId,
        uint256 multiplier
    ) external onlyOwner {
        chainFeeMultiplier[destChainId] = multiplier;
        emit FeeUpdated(baseFee, destChainId, multiplier);
    }

    /**
     * @dev Authorize a relayer
     */
    function authorizeRelayer(address relayer) external onlyOwner {
        authorizedRelayers[relayer] = true;
        emit RelayerAuthorized(relayer);
    }

    /**
     * @dev Revoke relayer authorization
     */
    function revokeRelayer(address relayer) external onlyOwner {
        authorizedRelayers[relayer] = false;
        emit RelayerRevoked(relayer);
    }

    /**
     * @dev Enable/disable relayer whitelist
     */
    function setRelayerWhitelistEnabled(bool enabled) external onlyOwner {
        relayerWhitelistEnabled = enabled;
    }

    /**
     * @dev Pause the bridge
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause the bridge
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Withdraw accumulated fees
     */
    function withdrawFees(address to) external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = payable(to).call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    // ============ Internal Functions ============

    /**
     * @dev Hash a message
     */
    function _hashMessage(Message memory message) internal pure returns (bytes32) {
        return keccak256(
            abi.encode(
                message.nonce,
                message.sourceChainId,
                message.destChainId,
                message.sender,
                message.target,
                keccak256(message.data),
                message.gasLimit,
                message.timestamp
            )
        );
    }

    /**
     * @dev Extract revert reason from return data
     */
    function _getRevertReason(
        bytes memory returnData
    ) internal pure returns (string memory) {
        if (returnData.length < 68) {
            return "Execution reverted";
        }

        assembly {
            returnData := add(returnData, 0x04)
        }

        return abi.decode(returnData, (string));
    }

    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {}
}
