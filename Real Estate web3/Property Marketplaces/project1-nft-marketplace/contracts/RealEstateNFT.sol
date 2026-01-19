// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title RealEstateNFT
 * @dev NFT contract for tokenizing real estate properties
 * @notice Each NFT represents ownership proof of a real estate property
 */
contract RealEstateNFT is ERC721, ERC721URIStorage, ERC721Enumerable, Ownable, ReentrancyGuard {

    // ============ State Variables ============

    uint256 private _nextTokenId;
    uint256 public mintingFee;

    // Property details structure
    struct Property {
        string propertyAddress;
        string propertyType; // "house", "apartment", "office", "retail", "land"
        uint256 squareFeet;
        uint256 bedrooms;
        uint256 bathrooms;
        uint256 yearBuilt;
        string legalDocumentHash; // IPFS hash of legal documents
        bool isVerified;
        address originalOwner;
        uint256 mintedAt;
    }

    // Mapping from token ID to Property details
    mapping(uint256 => Property) public properties;

    // Mapping to track verified minters (real estate agents, verified sellers)
    mapping(address => bool) public verifiedMinters;

    // ============ Events ============

    event PropertyMinted(
        uint256 indexed tokenId,
        address indexed owner,
        string propertyAddress,
        string propertyType,
        uint256 squareFeet
    );

    event PropertyVerified(uint256 indexed tokenId, address indexed verifier);
    event MinterVerified(address indexed minter);
    event MinterRevoked(address indexed minter);
    event MintingFeeUpdated(uint256 oldFee, uint256 newFee);

    // ============ Errors ============

    error InvalidPropertyAddress();
    error InvalidPropertyType();
    error InvalidSquareFeet();
    error InsufficientMintingFee();
    error PropertyAlreadyVerified();
    error NotVerifiedMinter();
    error TokenDoesNotExist();

    // ============ Constructor ============

    constructor(
        uint256 _mintingFee
    ) ERC721("RealEstateNFT", "RENFT") Ownable(msg.sender) {
        mintingFee = _mintingFee;
    }

    // ============ Modifiers ============

    modifier onlyVerifiedMinter() {
        if (!verifiedMinters[msg.sender] && msg.sender != owner()) {
            revert NotVerifiedMinter();
        }
        _;
    }

    modifier tokenExists(uint256 tokenId) {
        if (_ownerOf(tokenId) == address(0)) {
            revert TokenDoesNotExist();
        }
        _;
    }

    // ============ External Functions ============

    /**
     * @dev Mint a new property NFT
     * @param to Address to mint the NFT to
     * @param uri IPFS URI containing property metadata
     * @param propertyAddress Physical address of the property
     * @param propertyType Type of property
     * @param squareFeet Size of the property
     * @param bedrooms Number of bedrooms
     * @param bathrooms Number of bathrooms
     * @param yearBuilt Year the property was built
     * @param legalDocumentHash IPFS hash of legal documents
     */
    function mintProperty(
        address to,
        string memory uri,
        string memory propertyAddress,
        string memory propertyType,
        uint256 squareFeet,
        uint256 bedrooms,
        uint256 bathrooms,
        uint256 yearBuilt,
        string memory legalDocumentHash
    ) external payable nonReentrant returns (uint256) {
        // Validations
        if (bytes(propertyAddress).length == 0) revert InvalidPropertyAddress();
        if (bytes(propertyType).length == 0) revert InvalidPropertyType();
        if (squareFeet == 0) revert InvalidSquareFeet();
        if (msg.value < mintingFee) revert InsufficientMintingFee();

        uint256 tokenId = _nextTokenId++;

        // Store property details
        properties[tokenId] = Property({
            propertyAddress: propertyAddress,
            propertyType: propertyType,
            squareFeet: squareFeet,
            bedrooms: bedrooms,
            bathrooms: bathrooms,
            yearBuilt: yearBuilt,
            legalDocumentHash: legalDocumentHash,
            isVerified: false,
            originalOwner: to,
            mintedAt: block.timestamp
        });

        // Mint the NFT
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        emit PropertyMinted(tokenId, to, propertyAddress, propertyType, squareFeet);

        return tokenId;
    }

    /**
     * @dev Verify a property (only owner or verified minters)
     * @param tokenId Token ID of the property to verify
     */
    function verifyProperty(uint256 tokenId) external onlyVerifiedMinter tokenExists(tokenId) {
        if (properties[tokenId].isVerified) revert PropertyAlreadyVerified();

        properties[tokenId].isVerified = true;
        emit PropertyVerified(tokenId, msg.sender);
    }

    /**
     * @dev Add a verified minter
     * @param minter Address to verify as a minter
     */
    function addVerifiedMinter(address minter) external onlyOwner {
        verifiedMinters[minter] = true;
        emit MinterVerified(minter);
    }

    /**
     * @dev Remove a verified minter
     * @param minter Address to remove from verified minters
     */
    function removeVerifiedMinter(address minter) external onlyOwner {
        verifiedMinters[minter] = false;
        emit MinterRevoked(minter);
    }

    /**
     * @dev Update minting fee
     * @param newFee New minting fee in wei
     */
    function setMintingFee(uint256 newFee) external onlyOwner {
        uint256 oldFee = mintingFee;
        mintingFee = newFee;
        emit MintingFeeUpdated(oldFee, newFee);
    }

    /**
     * @dev Withdraw contract balance
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    // ============ View Functions ============

    /**
     * @dev Get property details
     * @param tokenId Token ID of the property
     */
    function getProperty(uint256 tokenId) external view tokenExists(tokenId) returns (Property memory) {
        return properties[tokenId];
    }

    /**
     * @dev Get all tokens owned by an address
     * @param owner Address to query
     */
    function getTokensByOwner(address owner) external view returns (uint256[] memory) {
        uint256 balance = balanceOf(owner);
        uint256[] memory tokens = new uint256[](balance);

        for (uint256 i = 0; i < balance; i++) {
            tokens[i] = tokenOfOwnerByIndex(owner, i);
        }

        return tokens;
    }

    /**
     * @dev Get total number of properties minted
     */
    function totalProperties() external view returns (uint256) {
        return _nextTokenId;
    }

    // ============ Override Functions ============

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
