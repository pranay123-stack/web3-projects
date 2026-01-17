// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ValidatorRegistry
 * @dev Manages the validator set for the bridge oracle system
 * Includes staking, slashing, and validator rotation functionality
 */
contract ValidatorRegistry is Ownable, ReentrancyGuard {
    // ============ Structs ============

    struct Validator {
        address addr;
        uint256 stake;
        uint256 joinedAt;
        uint256 lastActiveAt;
        bool isActive;
        uint256 slashCount;
        bytes publicKey; // For threshold signature verification
    }

    struct SlashProposal {
        address validator;
        bytes32 reason;
        uint256 amount;
        uint256 proposedAt;
        uint256 approvalCount;
        bool executed;
        mapping(address => bool) hasApproved;
    }

    // ============ State Variables ============

    // Validator management
    mapping(address => Validator) public validators;
    address[] public validatorList;
    mapping(address => uint256) public validatorIndex;

    // Staking parameters
    uint256 public minimumStake;
    uint256 public maximumValidators;
    uint256 public totalStaked;

    // Slashing parameters
    uint256 public slashThreshold; // Number of approvals needed
    uint256 public slashPercentage; // Percentage to slash (in basis points)
    uint256 public maxSlashCount; // Max slashes before removal
    mapping(uint256 => SlashProposal) public slashProposals;
    uint256 public slashProposalCount;

    // Validator rotation
    uint256 public rotationPeriod; // Time between rotations
    uint256 public lastRotationAt;
    uint256 public inactivityThreshold; // Time before validator is considered inactive

    // Consensus parameters
    uint256 public consensusThreshold; // Percentage needed for consensus (in basis points)

    // ============ Events ============

    event ValidatorAdded(address indexed validator, uint256 stake, bytes publicKey);
    event ValidatorRemoved(address indexed validator, uint256 stake);
    event StakeIncreased(address indexed validator, uint256 amount, uint256 newTotal);
    event StakeDecreased(address indexed validator, uint256 amount, uint256 newTotal);
    event ValidatorSlashed(address indexed validator, uint256 amount, bytes32 reason);
    event SlashProposalCreated(uint256 indexed proposalId, address validator, bytes32 reason);
    event SlashProposalApproved(uint256 indexed proposalId, address approver);
    event ValidatorRotated(address indexed oldValidator, address indexed newValidator);
    event ValidatorActivated(address indexed validator);
    event ValidatorDeactivated(address indexed validator);
    event ConsensusThresholdUpdated(uint256 oldThreshold, uint256 newThreshold);

    // ============ Errors ============

    error InsufficientStake();
    error ValidatorAlreadyExists();
    error ValidatorNotFound();
    error MaxValidatorsReached();
    error InvalidPublicKey();
    error SlashProposalNotFound();
    error AlreadyApproved();
    error ProposalAlreadyExecuted();
    error InsufficientApprovals();
    error NotValidator();
    error InvalidThreshold();
    error WithdrawalFailed();
    error CannotSlashSelf();

    // ============ Modifiers ============

    modifier onlyValidator() {
        if (!validators[msg.sender].isActive) {
            revert NotValidator();
        }
        _;
    }

    // ============ Constructor ============

    constructor(
        uint256 _minimumStake,
        uint256 _maximumValidators,
        uint256 _consensusThreshold
    ) Ownable(msg.sender) {
        minimumStake = _minimumStake;
        maximumValidators = _maximumValidators;
        consensusThreshold = _consensusThreshold;
        slashThreshold = 2; // Default: need 2 validators to approve slash
        slashPercentage = 1000; // Default: 10% slash
        maxSlashCount = 3; // Default: removed after 3 slashes
        rotationPeriod = 7 days;
        inactivityThreshold = 1 days;
        lastRotationAt = block.timestamp;
    }

    // ============ External Functions ============

    /**
     * @dev Register as a validator by staking ETH
     * @param publicKey The validator's public key for threshold signatures
     */
    function registerValidator(bytes calldata publicKey) external payable nonReentrant {
        if (msg.value < minimumStake) {
            revert InsufficientStake();
        }
        if (validators[msg.sender].addr != address(0)) {
            revert ValidatorAlreadyExists();
        }
        if (validatorList.length >= maximumValidators) {
            revert MaxValidatorsReached();
        }
        if (publicKey.length == 0) {
            revert InvalidPublicKey();
        }

        validators[msg.sender] = Validator({
            addr: msg.sender,
            stake: msg.value,
            joinedAt: block.timestamp,
            lastActiveAt: block.timestamp,
            isActive: true,
            slashCount: 0,
            publicKey: publicKey
        });

        validatorIndex[msg.sender] = validatorList.length;
        validatorList.push(msg.sender);
        totalStaked += msg.value;

        emit ValidatorAdded(msg.sender, msg.value, publicKey);
    }

    /**
     * @dev Increase stake as a validator
     */
    function increaseStake() external payable onlyValidator nonReentrant {
        validators[msg.sender].stake += msg.value;
        totalStaked += msg.value;
        emit StakeIncreased(msg.sender, msg.value, validators[msg.sender].stake);
    }

    /**
     * @dev Decrease stake (partial withdrawal)
     * @param amount Amount to withdraw
     */
    function decreaseStake(uint256 amount) external onlyValidator nonReentrant {
        Validator storage validator = validators[msg.sender];
        if (validator.stake - amount < minimumStake) {
            revert InsufficientStake();
        }

        validator.stake -= amount;
        totalStaked -= amount;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) {
            revert WithdrawalFailed();
        }

        emit StakeDecreased(msg.sender, amount, validator.stake);
    }

    /**
     * @dev Unregister as a validator and withdraw stake
     */
    function unregisterValidator() external nonReentrant {
        Validator storage validator = validators[msg.sender];
        if (validator.addr == address(0)) {
            revert ValidatorNotFound();
        }

        uint256 stake = validator.stake;
        totalStaked -= stake;

        // Remove from list
        _removeValidatorFromList(msg.sender);

        // Clear validator data
        delete validators[msg.sender];

        // Transfer stake back
        (bool success, ) = payable(msg.sender).call{value: stake}("");
        if (!success) {
            revert WithdrawalFailed();
        }

        emit ValidatorRemoved(msg.sender, stake);
    }

    /**
     * @dev Propose slashing a validator
     * @param validatorAddr The validator to slash
     * @param reason The reason for slashing
     */
    function proposeSlash(
        address validatorAddr,
        bytes32 reason
    ) external onlyValidator returns (uint256) {
        if (validators[validatorAddr].addr == address(0)) {
            revert ValidatorNotFound();
        }
        if (validatorAddr == msg.sender) {
            revert CannotSlashSelf();
        }

        uint256 proposalId = slashProposalCount++;
        SlashProposal storage proposal = slashProposals[proposalId];
        proposal.validator = validatorAddr;
        proposal.reason = reason;
        proposal.amount = (validators[validatorAddr].stake * slashPercentage) / 10000;
        proposal.proposedAt = block.timestamp;
        proposal.approvalCount = 1;
        proposal.hasApproved[msg.sender] = true;

        emit SlashProposalCreated(proposalId, validatorAddr, reason);
        emit SlashProposalApproved(proposalId, msg.sender);

        return proposalId;
    }

    /**
     * @dev Approve a slash proposal
     * @param proposalId The proposal to approve
     */
    function approveSlash(uint256 proposalId) external onlyValidator {
        SlashProposal storage proposal = slashProposals[proposalId];
        if (proposal.validator == address(0)) {
            revert SlashProposalNotFound();
        }
        if (proposal.executed) {
            revert ProposalAlreadyExecuted();
        }
        if (proposal.hasApproved[msg.sender]) {
            revert AlreadyApproved();
        }

        proposal.hasApproved[msg.sender] = true;
        proposal.approvalCount++;

        emit SlashProposalApproved(proposalId, msg.sender);

        // Execute if threshold reached
        if (proposal.approvalCount >= slashThreshold) {
            _executeSlash(proposalId);
        }
    }

    /**
     * @dev Update validator activity timestamp
     * Called by oracle/bridge contracts when validator participates
     */
    function recordActivity(address validatorAddr) external {
        if (validators[validatorAddr].isActive) {
            validators[validatorAddr].lastActiveAt = block.timestamp;
        }
    }

    /**
     * @dev Check and deactivate inactive validators
     */
    function checkInactiveValidators() external {
        for (uint256 i = 0; i < validatorList.length; i++) {
            address addr = validatorList[i];
            Validator storage validator = validators[addr];
            if (
                validator.isActive &&
                block.timestamp - validator.lastActiveAt > inactivityThreshold
            ) {
                validator.isActive = false;
                emit ValidatorDeactivated(addr);
            }
        }
    }

    /**
     * @dev Reactivate a validator
     */
    function reactivate() external {
        Validator storage validator = validators[msg.sender];
        if (validator.addr == address(0)) {
            revert ValidatorNotFound();
        }
        if (validator.stake < minimumStake) {
            revert InsufficientStake();
        }

        validator.isActive = true;
        validator.lastActiveAt = block.timestamp;
        emit ValidatorActivated(msg.sender);
    }

    // ============ View Functions ============

    /**
     * @dev Get all active validators
     */
    function getActiveValidators() external view returns (address[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < validatorList.length; i++) {
            if (validators[validatorList[i]].isActive) {
                activeCount++;
            }
        }

        address[] memory active = new address[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < validatorList.length; i++) {
            if (validators[validatorList[i]].isActive) {
                active[index++] = validatorList[i];
            }
        }
        return active;
    }

    /**
     * @dev Get validator count
     */
    function getValidatorCount() external view returns (uint256) {
        return validatorList.length;
    }

    /**
     * @dev Get active validator count
     */
    function getActiveValidatorCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < validatorList.length; i++) {
            if (validators[validatorList[i]].isActive) {
                count++;
            }
        }
        return count;
    }

    /**
     * @dev Check if address is an active validator
     */
    function isActiveValidator(address addr) external view returns (bool) {
        return validators[addr].isActive;
    }

    /**
     * @dev Get validator public key
     */
    function getValidatorPublicKey(address addr) external view returns (bytes memory) {
        return validators[addr].publicKey;
    }

    /**
     * @dev Calculate required signatures for consensus
     */
    function getRequiredSignatures() external view returns (uint256) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < validatorList.length; i++) {
            if (validators[validatorList[i]].isActive) {
                activeCount++;
            }
        }
        return (activeCount * consensusThreshold) / 10000 + 1;
    }

    /**
     * @dev Get validator info
     */
    function getValidatorInfo(address addr) external view returns (
        uint256 stake,
        uint256 joinedAt,
        uint256 lastActiveAt,
        bool isActive,
        uint256 slashCount
    ) {
        Validator storage v = validators[addr];
        return (v.stake, v.joinedAt, v.lastActiveAt, v.isActive, v.slashCount);
    }

    // ============ Admin Functions ============

    /**
     * @dev Update minimum stake requirement
     */
    function setMinimumStake(uint256 _minimumStake) external onlyOwner {
        minimumStake = _minimumStake;
    }

    /**
     * @dev Update maximum validators
     */
    function setMaximumValidators(uint256 _maximumValidators) external onlyOwner {
        maximumValidators = _maximumValidators;
    }

    /**
     * @dev Update consensus threshold
     */
    function setConsensusThreshold(uint256 _consensusThreshold) external onlyOwner {
        if (_consensusThreshold > 10000) {
            revert InvalidThreshold();
        }
        emit ConsensusThresholdUpdated(consensusThreshold, _consensusThreshold);
        consensusThreshold = _consensusThreshold;
    }

    /**
     * @dev Update slash parameters
     */
    function setSlashParameters(
        uint256 _slashThreshold,
        uint256 _slashPercentage,
        uint256 _maxSlashCount
    ) external onlyOwner {
        slashThreshold = _slashThreshold;
        slashPercentage = _slashPercentage;
        maxSlashCount = _maxSlashCount;
    }

    /**
     * @dev Update inactivity threshold
     */
    function setInactivityThreshold(uint256 _inactivityThreshold) external onlyOwner {
        inactivityThreshold = _inactivityThreshold;
    }

    // ============ Internal Functions ============

    /**
     * @dev Execute a slash proposal
     */
    function _executeSlash(uint256 proposalId) internal {
        SlashProposal storage proposal = slashProposals[proposalId];
        proposal.executed = true;

        Validator storage validator = validators[proposal.validator];
        uint256 slashAmount = proposal.amount;

        if (slashAmount > validator.stake) {
            slashAmount = validator.stake;
        }

        validator.stake -= slashAmount;
        totalStaked -= slashAmount;
        validator.slashCount++;

        emit ValidatorSlashed(proposal.validator, slashAmount, proposal.reason);

        // Remove validator if max slash count reached
        if (validator.slashCount >= maxSlashCount) {
            validator.isActive = false;
            emit ValidatorDeactivated(proposal.validator);
        }

        // Slashed funds go to contract (could be distributed to other validators)
    }

    /**
     * @dev Remove validator from list
     */
    function _removeValidatorFromList(address addr) internal {
        uint256 index = validatorIndex[addr];
        uint256 lastIndex = validatorList.length - 1;

        if (index != lastIndex) {
            address lastValidator = validatorList[lastIndex];
            validatorList[index] = lastValidator;
            validatorIndex[lastValidator] = index;
        }

        validatorList.pop();
        delete validatorIndex[addr];
    }
}
