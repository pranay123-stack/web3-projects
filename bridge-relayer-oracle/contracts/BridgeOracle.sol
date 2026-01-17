// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "./libraries/MerkleProof.sol";
import "./ValidatorRegistry.sol";

/**
 * @title BridgeOracle
 * @dev Oracle contract for cross-chain state verification
 * Stores state roots, verifies merkle proofs, and implements validator consensus
 */
contract BridgeOracle is Ownable, ReentrancyGuard {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;
    using MerkleProof for bytes32[];

    // ============ Structs ============

    struct StateRoot {
        bytes32 root;
        uint256 chainId;
        uint256 blockNumber;
        uint256 timestamp;
        uint256 confirmations;
        bool finalized;
    }

    struct PendingUpdate {
        bytes32 root;
        uint256 chainId;
        uint256 blockNumber;
        uint256 proposedAt;
        address[] signers;
        mapping(address => bool) hasSigned;
        bool executed;
    }

    // ============ State Variables ============

    ValidatorRegistry public validatorRegistry;

    // Chain ID => Block Number => State Root
    mapping(uint256 => mapping(uint256 => StateRoot)) public stateRoots;

    // Chain ID => Latest finalized block number
    mapping(uint256 => uint256) public latestFinalizedBlock;

    // Chain ID => Latest state root
    mapping(uint256 => bytes32) public latestStateRoot;

    // Pending update ID => PendingUpdate
    mapping(bytes32 => PendingUpdate) public pendingUpdates;

    // Supported chain IDs
    uint256[] public supportedChains;
    mapping(uint256 => bool) public isChainSupported;

    // Configuration
    uint256 public confirmationBlocks;
    uint256 public updateTimeout;
    uint256 public requiredSignaturePercentage; // In basis points (e.g., 6600 = 66%)

    // ============ Events ============

    event StateRootProposed(
        bytes32 indexed updateId,
        uint256 indexed chainId,
        uint256 blockNumber,
        bytes32 root,
        address proposer
    );
    event StateRootSigned(
        bytes32 indexed updateId,
        address indexed signer,
        uint256 totalSignatures
    );
    event StateRootFinalized(
        uint256 indexed chainId,
        uint256 blockNumber,
        bytes32 root
    );
    event ChainAdded(uint256 indexed chainId);
    event ChainRemoved(uint256 indexed chainId);
    event ProofVerified(
        uint256 indexed chainId,
        bytes32 indexed root,
        bytes32 leaf
    );

    // ============ Errors ============

    error ChainNotSupported();
    error InvalidSignature();
    error AlreadySigned();
    error UpdateNotFound();
    error UpdateAlreadyExecuted();
    error InsufficientSignatures();
    error UpdateExpired();
    error InvalidBlockNumber();
    error InvalidProof();
    error NotValidator();
    error StateRootNotFinalized();

    // ============ Modifiers ============

    modifier onlyValidator() {
        if (!validatorRegistry.isActiveValidator(msg.sender)) {
            revert NotValidator();
        }
        _;
    }

    modifier onlySupportedChain(uint256 chainId) {
        if (!isChainSupported[chainId]) {
            revert ChainNotSupported();
        }
        _;
    }

    // ============ Constructor ============

    constructor(
        address _validatorRegistry,
        uint256 _confirmationBlocks,
        uint256 _updateTimeout,
        uint256 _requiredSignaturePercentage
    ) Ownable(msg.sender) {
        validatorRegistry = ValidatorRegistry(_validatorRegistry);
        confirmationBlocks = _confirmationBlocks;
        updateTimeout = _updateTimeout;
        requiredSignaturePercentage = _requiredSignaturePercentage;
    }

    // ============ External Functions ============

    /**
     * @dev Propose a new state root for a chain
     * @param chainId The chain ID
     * @param blockNumber The block number
     * @param root The state root
     * @param signature The validator's signature
     */
    function proposeStateRoot(
        uint256 chainId,
        uint256 blockNumber,
        bytes32 root,
        bytes calldata signature
    ) external onlyValidator onlySupportedChain(chainId) {
        if (blockNumber <= latestFinalizedBlock[chainId]) {
            revert InvalidBlockNumber();
        }

        bytes32 updateId = _computeUpdateId(chainId, blockNumber, root);
        PendingUpdate storage update = pendingUpdates[updateId];

        // Verify signature
        bytes32 messageHash = keccak256(
            abi.encodePacked(chainId, blockNumber, root)
        );
        bytes32 ethSignedHash = messageHash.toEthSignedMessageHash();
        address signer = ethSignedHash.recover(signature);

        if (signer != msg.sender) {
            revert InvalidSignature();
        }

        // Initialize or update
        if (update.proposedAt == 0) {
            update.root = root;
            update.chainId = chainId;
            update.blockNumber = blockNumber;
            update.proposedAt = block.timestamp;

            emit StateRootProposed(updateId, chainId, blockNumber, root, msg.sender);
        }

        if (update.hasSigned[msg.sender]) {
            revert AlreadySigned();
        }

        update.hasSigned[msg.sender] = true;
        update.signers.push(msg.sender);

        // Record validator activity
        validatorRegistry.recordActivity(msg.sender);

        emit StateRootSigned(updateId, msg.sender, update.signers.length);

        // Check if we have enough signatures to finalize
        _tryFinalize(updateId);
    }

    /**
     * @dev Sign an existing state root proposal
     * @param updateId The update ID
     * @param signature The validator's signature
     */
    function signStateRoot(
        bytes32 updateId,
        bytes calldata signature
    ) external onlyValidator {
        PendingUpdate storage update = pendingUpdates[updateId];

        if (update.proposedAt == 0) {
            revert UpdateNotFound();
        }
        if (update.executed) {
            revert UpdateAlreadyExecuted();
        }
        if (block.timestamp > update.proposedAt + updateTimeout) {
            revert UpdateExpired();
        }
        if (update.hasSigned[msg.sender]) {
            revert AlreadySigned();
        }

        // Verify signature
        bytes32 messageHash = keccak256(
            abi.encodePacked(update.chainId, update.blockNumber, update.root)
        );
        bytes32 ethSignedHash = messageHash.toEthSignedMessageHash();
        address signer = ethSignedHash.recover(signature);

        if (signer != msg.sender) {
            revert InvalidSignature();
        }

        update.hasSigned[msg.sender] = true;
        update.signers.push(msg.sender);

        // Record validator activity
        validatorRegistry.recordActivity(msg.sender);

        emit StateRootSigned(updateId, msg.sender, update.signers.length);

        // Check if we have enough signatures to finalize
        _tryFinalize(updateId);
    }

    /**
     * @dev Verify a merkle proof against a finalized state root
     * @param chainId The chain ID
     * @param blockNumber The block number
     * @param proof The merkle proof
     * @param leaf The leaf to verify
     * @return True if the proof is valid
     */
    function verifyProof(
        uint256 chainId,
        uint256 blockNumber,
        bytes32[] calldata proof,
        bytes32 leaf
    ) external view onlySupportedChain(chainId) returns (bool) {
        StateRoot storage stateRoot = stateRoots[chainId][blockNumber];

        if (!stateRoot.finalized) {
            revert StateRootNotFinalized();
        }

        return proof.verify(stateRoot.root, leaf);
    }

    /**
     * @dev Verify a merkle proof with index against a finalized state root
     * @param chainId The chain ID
     * @param blockNumber The block number
     * @param proof The merkle proof
     * @param leaf The leaf to verify
     * @param index The leaf index
     * @return True if the proof is valid
     */
    function verifyProofWithIndex(
        uint256 chainId,
        uint256 blockNumber,
        bytes32[] calldata proof,
        bytes32 leaf,
        uint256 index
    ) external view onlySupportedChain(chainId) returns (bool) {
        StateRoot storage stateRoot = stateRoots[chainId][blockNumber];

        if (!stateRoot.finalized) {
            revert StateRootNotFinalized();
        }

        return proof.verifyWithIndex(stateRoot.root, leaf, index);
    }

    /**
     * @dev Verify proof against latest state root
     * @param chainId The chain ID
     * @param proof The merkle proof
     * @param leaf The leaf to verify
     * @return True if the proof is valid
     */
    function verifyProofLatest(
        uint256 chainId,
        bytes32[] calldata proof,
        bytes32 leaf
    ) external view onlySupportedChain(chainId) returns (bool) {
        bytes32 root = latestStateRoot[chainId];
        if (root == bytes32(0)) {
            revert StateRootNotFinalized();
        }

        return proof.verify(root, leaf);
    }

    /**
     * @dev Submit threshold signature for immediate finalization
     * @param chainId The chain ID
     * @param blockNumber The block number
     * @param root The state root
     * @param signatures Array of validator signatures
     */
    function submitThresholdSignature(
        uint256 chainId,
        uint256 blockNumber,
        bytes32 root,
        bytes[] calldata signatures
    ) external onlySupportedChain(chainId) {
        if (blockNumber <= latestFinalizedBlock[chainId]) {
            revert InvalidBlockNumber();
        }

        bytes32 messageHash = keccak256(
            abi.encodePacked(chainId, blockNumber, root)
        );
        bytes32 ethSignedHash = messageHash.toEthSignedMessageHash();

        uint256 validSignatures = 0;
        address[] memory signers = new address[](signatures.length);

        for (uint256 i = 0; i < signatures.length; i++) {
            address signer = ethSignedHash.recover(signatures[i]);

            // Check if signer is active validator
            if (!validatorRegistry.isActiveValidator(signer)) {
                continue;
            }

            // Check for duplicates
            bool isDuplicate = false;
            for (uint256 j = 0; j < validSignatures; j++) {
                if (signers[j] == signer) {
                    isDuplicate = true;
                    break;
                }
            }

            if (!isDuplicate) {
                signers[validSignatures] = signer;
                validSignatures++;
                validatorRegistry.recordActivity(signer);
            }
        }

        uint256 requiredSigs = _getRequiredSignatures();
        if (validSignatures < requiredSigs) {
            revert InsufficientSignatures();
        }

        // Directly finalize
        _finalizeStateRoot(chainId, blockNumber, root, validSignatures);
    }

    // ============ View Functions ============

    /**
     * @dev Get state root for a specific block
     */
    function getStateRoot(
        uint256 chainId,
        uint256 blockNumber
    ) external view returns (StateRoot memory) {
        return stateRoots[chainId][blockNumber];
    }

    /**
     * @dev Get pending update details
     */
    function getPendingUpdate(
        bytes32 updateId
    )
        external
        view
        returns (
            bytes32 root,
            uint256 chainId,
            uint256 blockNumber,
            uint256 proposedAt,
            uint256 signatureCount,
            bool executed
        )
    {
        PendingUpdate storage update = pendingUpdates[updateId];
        return (
            update.root,
            update.chainId,
            update.blockNumber,
            update.proposedAt,
            update.signers.length,
            update.executed
        );
    }

    /**
     * @dev Check if a validator has signed an update
     */
    function hasValidatorSigned(
        bytes32 updateId,
        address validator
    ) external view returns (bool) {
        return pendingUpdates[updateId].hasSigned[validator];
    }

    /**
     * @dev Get all supported chains
     */
    function getSupportedChains() external view returns (uint256[] memory) {
        return supportedChains;
    }

    /**
     * @dev Compute update ID
     */
    function computeUpdateId(
        uint256 chainId,
        uint256 blockNumber,
        bytes32 root
    ) external pure returns (bytes32) {
        return _computeUpdateId(chainId, blockNumber, root);
    }

    /**
     * @dev Get required number of signatures
     */
    function getRequiredSignatures() external view returns (uint256) {
        return _getRequiredSignatures();
    }

    // ============ Admin Functions ============

    /**
     * @dev Add a supported chain
     */
    function addChain(uint256 chainId) external onlyOwner {
        if (!isChainSupported[chainId]) {
            isChainSupported[chainId] = true;
            supportedChains.push(chainId);
            emit ChainAdded(chainId);
        }
    }

    /**
     * @dev Remove a supported chain
     */
    function removeChain(uint256 chainId) external onlyOwner {
        if (isChainSupported[chainId]) {
            isChainSupported[chainId] = false;

            // Remove from array
            for (uint256 i = 0; i < supportedChains.length; i++) {
                if (supportedChains[i] == chainId) {
                    supportedChains[i] = supportedChains[supportedChains.length - 1];
                    supportedChains.pop();
                    break;
                }
            }
            emit ChainRemoved(chainId);
        }
    }

    /**
     * @dev Update configuration
     */
    function setConfiguration(
        uint256 _confirmationBlocks,
        uint256 _updateTimeout,
        uint256 _requiredSignaturePercentage
    ) external onlyOwner {
        confirmationBlocks = _confirmationBlocks;
        updateTimeout = _updateTimeout;
        requiredSignaturePercentage = _requiredSignaturePercentage;
    }

    /**
     * @dev Update validator registry
     */
    function setValidatorRegistry(address _validatorRegistry) external onlyOwner {
        validatorRegistry = ValidatorRegistry(_validatorRegistry);
    }

    // ============ Internal Functions ============

    /**
     * @dev Try to finalize an update if enough signatures
     */
    function _tryFinalize(bytes32 updateId) internal {
        PendingUpdate storage update = pendingUpdates[updateId];

        uint256 requiredSigs = _getRequiredSignatures();

        if (update.signers.length >= requiredSigs) {
            update.executed = true;
            _finalizeStateRoot(
                update.chainId,
                update.blockNumber,
                update.root,
                update.signers.length
            );
        }
    }

    /**
     * @dev Finalize a state root
     */
    function _finalizeStateRoot(
        uint256 chainId,
        uint256 blockNumber,
        bytes32 root,
        uint256 confirmations
    ) internal {
        stateRoots[chainId][blockNumber] = StateRoot({
            root: root,
            chainId: chainId,
            blockNumber: blockNumber,
            timestamp: block.timestamp,
            confirmations: confirmations,
            finalized: true
        });

        if (blockNumber > latestFinalizedBlock[chainId]) {
            latestFinalizedBlock[chainId] = blockNumber;
            latestStateRoot[chainId] = root;
        }

        emit StateRootFinalized(chainId, blockNumber, root);
    }

    /**
     * @dev Compute update ID from parameters
     */
    function _computeUpdateId(
        uint256 chainId,
        uint256 blockNumber,
        bytes32 root
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(chainId, blockNumber, root));
    }

    /**
     * @dev Get required number of signatures based on active validators
     */
    function _getRequiredSignatures() internal view returns (uint256) {
        uint256 activeCount = validatorRegistry.getActiveValidatorCount();
        uint256 required = (activeCount * requiredSignaturePercentage) / 10000;
        return required > 0 ? required : 1;
    }
}
