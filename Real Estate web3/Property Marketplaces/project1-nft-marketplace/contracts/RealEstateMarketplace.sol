// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title RealEstateMarketplace
 * @dev Marketplace for buying, selling, and bidding on Real Estate NFTs
 * @notice Supports ETH and ERC20 token payments (USDT, USDC, etc.)
 */
contract RealEstateMarketplace is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ State Variables ============

    // Platform fee in basis points (100 = 1%)
    uint256 public platformFeeBps = 250; // 2.5%
    uint256 public constant MAX_FEE_BPS = 1000; // 10% max fee

    // Supported payment tokens
    mapping(address => bool) public supportedTokens;

    // Listing structure
    struct Listing {
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 price;
        address paymentToken; // address(0) for ETH
        bool isActive;
        uint256 listedAt;
    }

    // Bid structure
    struct Bid {
        address bidder;
        uint256 amount;
        address paymentToken;
        uint256 expiresAt;
        bool isActive;
    }

    // Offer structure (for unlisted NFTs)
    struct Offer {
        address buyer;
        uint256 amount;
        address paymentToken;
        uint256 expiresAt;
        bool isActive;
    }

    // Listing ID counter
    uint256 private _nextListingId;

    // Mappings
    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Bid[]) public listingBids;
    mapping(address => mapping(uint256 => Offer[])) public tokenOffers; // nftContract => tokenId => offers
    mapping(address => mapping(uint256 => uint256)) public activeListingId; // nftContract => tokenId => listingId

    // Escrow for bids
    mapping(address => mapping(address => uint256)) public escrowBalance; // bidder => token => amount

    // ============ Events ============

    event Listed(
        uint256 indexed listingId,
        address indexed seller,
        address indexed nftContract,
        uint256 tokenId,
        uint256 price,
        address paymentToken
    );

    event ListingCancelled(uint256 indexed listingId);
    event ListingUpdated(uint256 indexed listingId, uint256 newPrice);

    event Sale(
        uint256 indexed listingId,
        address indexed buyer,
        address indexed seller,
        uint256 price,
        uint256 platformFee
    );

    event BidPlaced(
        uint256 indexed listingId,
        address indexed bidder,
        uint256 amount,
        address paymentToken,
        uint256 expiresAt
    );

    event BidAccepted(uint256 indexed listingId, address indexed bidder, uint256 amount);
    event BidCancelled(uint256 indexed listingId, address indexed bidder);

    event OfferMade(
        address indexed nftContract,
        uint256 indexed tokenId,
        address indexed buyer,
        uint256 amount,
        address paymentToken
    );

    event OfferAccepted(
        address indexed nftContract,
        uint256 indexed tokenId,
        address indexed buyer,
        uint256 amount
    );

    event PaymentTokenUpdated(address indexed token, bool supported);
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);

    // ============ Errors ============

    error InvalidPrice();
    error InvalidListing();
    error NotSeller();
    error NotNFTOwner();
    error ListingNotActive();
    error InsufficientPayment();
    error UnsupportedPaymentToken();
    error BidExpired();
    error BidNotActive();
    error OfferNotActive();
    error OfferExpired();
    error InvalidDuration();
    error TransferFailed();
    error FeeTooHigh();
    error NFTNotApproved();

    // ============ Constructor ============

    constructor() Ownable(msg.sender) {
        // ETH is always supported (represented by address(0))
    }

    // ============ Listing Functions ============

    /**
     * @dev List an NFT for sale
     * @param nftContract Address of the NFT contract
     * @param tokenId Token ID to list
     * @param price Listing price
     * @param paymentToken Payment token address (address(0) for ETH)
     */
    function listProperty(
        address nftContract,
        uint256 tokenId,
        uint256 price,
        address paymentToken
    ) external nonReentrant returns (uint256) {
        if (price == 0) revert InvalidPrice();
        if (paymentToken != address(0) && !supportedTokens[paymentToken]) {
            revert UnsupportedPaymentToken();
        }

        IERC721 nft = IERC721(nftContract);
        if (nft.ownerOf(tokenId) != msg.sender) revert NotNFTOwner();
        if (!nft.isApprovedForAll(msg.sender, address(this)) &&
            nft.getApproved(tokenId) != address(this)) {
            revert NFTNotApproved();
        }

        uint256 listingId = _nextListingId++;

        listings[listingId] = Listing({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            price: price,
            paymentToken: paymentToken,
            isActive: true,
            listedAt: block.timestamp
        });

        activeListingId[nftContract][tokenId] = listingId;

        emit Listed(listingId, msg.sender, nftContract, tokenId, price, paymentToken);

        return listingId;
    }

    /**
     * @dev Cancel a listing
     * @param listingId Listing ID to cancel
     */
    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        if (listing.seller != msg.sender) revert NotSeller();
        if (!listing.isActive) revert ListingNotActive();

        listing.isActive = false;
        delete activeListingId[listing.nftContract][listing.tokenId];

        emit ListingCancelled(listingId);
    }

    /**
     * @dev Update listing price
     * @param listingId Listing ID to update
     * @param newPrice New price
     */
    function updateListingPrice(uint256 listingId, uint256 newPrice) external nonReentrant {
        if (newPrice == 0) revert InvalidPrice();

        Listing storage listing = listings[listingId];
        if (listing.seller != msg.sender) revert NotSeller();
        if (!listing.isActive) revert ListingNotActive();

        listing.price = newPrice;

        emit ListingUpdated(listingId, newPrice);
    }

    /**
     * @dev Buy a listed NFT directly
     * @param listingId Listing ID to buy
     */
    function buyProperty(uint256 listingId) external payable nonReentrant {
        Listing storage listing = listings[listingId];
        if (!listing.isActive) revert ListingNotActive();

        uint256 price = listing.price;
        uint256 platformFee = (price * platformFeeBps) / 10000;
        uint256 sellerProceeds = price - platformFee;

        // Handle payment
        if (listing.paymentToken == address(0)) {
            // ETH payment
            if (msg.value < price) revert InsufficientPayment();

            // Transfer to seller
            (bool success, ) = payable(listing.seller).call{value: sellerProceeds}("");
            if (!success) revert TransferFailed();

            // Refund excess
            if (msg.value > price) {
                (success, ) = payable(msg.sender).call{value: msg.value - price}("");
                if (!success) revert TransferFailed();
            }
        } else {
            // ERC20 payment
            IERC20 token = IERC20(listing.paymentToken);
            token.safeTransferFrom(msg.sender, listing.seller, sellerProceeds);
            token.safeTransferFrom(msg.sender, address(this), platformFee);
        }

        // Transfer NFT
        IERC721(listing.nftContract).safeTransferFrom(
            listing.seller,
            msg.sender,
            listing.tokenId
        );

        // Update listing state
        listing.isActive = false;
        delete activeListingId[listing.nftContract][listing.tokenId];

        emit Sale(listingId, msg.sender, listing.seller, price, platformFee);
    }

    // ============ Bidding Functions ============

    /**
     * @dev Place a bid on a listing
     * @param listingId Listing ID to bid on
     * @param amount Bid amount
     * @param duration Bid validity duration in seconds
     */
    function placeBid(
        uint256 listingId,
        uint256 amount,
        uint256 duration
    ) external payable nonReentrant {
        Listing storage listing = listings[listingId];
        if (!listing.isActive) revert ListingNotActive();
        if (amount == 0) revert InvalidPrice();
        if (duration == 0 || duration > 30 days) revert InvalidDuration();

        address paymentToken = listing.paymentToken;

        // Handle escrow
        if (paymentToken == address(0)) {
            if (msg.value < amount) revert InsufficientPayment();
            escrowBalance[msg.sender][address(0)] += amount;

            // Refund excess
            if (msg.value > amount) {
                (bool success, ) = payable(msg.sender).call{value: msg.value - amount}("");
                if (!success) revert TransferFailed();
            }
        } else {
            IERC20(paymentToken).safeTransferFrom(msg.sender, address(this), amount);
            escrowBalance[msg.sender][paymentToken] += amount;
        }

        uint256 expiresAt = block.timestamp + duration;

        listingBids[listingId].push(Bid({
            bidder: msg.sender,
            amount: amount,
            paymentToken: paymentToken,
            expiresAt: expiresAt,
            isActive: true
        }));

        emit BidPlaced(listingId, msg.sender, amount, paymentToken, expiresAt);
    }

    /**
     * @dev Accept a bid
     * @param listingId Listing ID
     * @param bidIndex Index of the bid to accept
     */
    function acceptBid(uint256 listingId, uint256 bidIndex) external nonReentrant {
        Listing storage listing = listings[listingId];
        if (listing.seller != msg.sender) revert NotSeller();
        if (!listing.isActive) revert ListingNotActive();

        Bid storage bid = listingBids[listingId][bidIndex];
        if (!bid.isActive) revert BidNotActive();
        if (block.timestamp > bid.expiresAt) revert BidExpired();

        uint256 amount = bid.amount;
        uint256 platformFee = (amount * platformFeeBps) / 10000;
        uint256 sellerProceeds = amount - platformFee;

        // Deduct from escrow
        escrowBalance[bid.bidder][bid.paymentToken] -= amount;

        // Transfer payment to seller
        if (bid.paymentToken == address(0)) {
            (bool success, ) = payable(listing.seller).call{value: sellerProceeds}("");
            if (!success) revert TransferFailed();
        } else {
            IERC20(bid.paymentToken).safeTransfer(listing.seller, sellerProceeds);
        }

        // Transfer NFT to bidder
        IERC721(listing.nftContract).safeTransferFrom(
            listing.seller,
            bid.bidder,
            listing.tokenId
        );

        // Update states
        bid.isActive = false;
        listing.isActive = false;
        delete activeListingId[listing.nftContract][listing.tokenId];

        emit BidAccepted(listingId, bid.bidder, amount);
    }

    /**
     * @dev Cancel a bid and withdraw escrow
     * @param listingId Listing ID
     * @param bidIndex Index of the bid to cancel
     */
    function cancelBid(uint256 listingId, uint256 bidIndex) external nonReentrant {
        Bid storage bid = listingBids[listingId][bidIndex];
        if (bid.bidder != msg.sender) revert NotSeller();
        if (!bid.isActive) revert BidNotActive();

        bid.isActive = false;

        // Return escrow
        uint256 amount = bid.amount;
        escrowBalance[msg.sender][bid.paymentToken] -= amount;

        if (bid.paymentToken == address(0)) {
            (bool success, ) = payable(msg.sender).call{value: amount}("");
            if (!success) revert TransferFailed();
        } else {
            IERC20(bid.paymentToken).safeTransfer(msg.sender, amount);
        }

        emit BidCancelled(listingId, msg.sender);
    }

    // ============ Offer Functions (for unlisted NFTs) ============

    /**
     * @dev Make an offer on an NFT (even if not listed)
     * @param nftContract NFT contract address
     * @param tokenId Token ID
     * @param amount Offer amount
     * @param paymentToken Payment token (address(0) for ETH)
     * @param duration Offer validity duration
     */
    function makeOffer(
        address nftContract,
        uint256 tokenId,
        uint256 amount,
        address paymentToken,
        uint256 duration
    ) external payable nonReentrant {
        if (amount == 0) revert InvalidPrice();
        if (duration == 0 || duration > 30 days) revert InvalidDuration();
        if (paymentToken != address(0) && !supportedTokens[paymentToken]) {
            revert UnsupportedPaymentToken();
        }

        // Handle escrow
        if (paymentToken == address(0)) {
            if (msg.value < amount) revert InsufficientPayment();
            escrowBalance[msg.sender][address(0)] += amount;
        } else {
            IERC20(paymentToken).safeTransferFrom(msg.sender, address(this), amount);
            escrowBalance[msg.sender][paymentToken] += amount;
        }

        tokenOffers[nftContract][tokenId].push(Offer({
            buyer: msg.sender,
            amount: amount,
            paymentToken: paymentToken,
            expiresAt: block.timestamp + duration,
            isActive: true
        }));

        emit OfferMade(nftContract, tokenId, msg.sender, amount, paymentToken);
    }

    /**
     * @dev Accept an offer
     * @param nftContract NFT contract address
     * @param tokenId Token ID
     * @param offerIndex Index of the offer to accept
     */
    function acceptOffer(
        address nftContract,
        uint256 tokenId,
        uint256 offerIndex
    ) external nonReentrant {
        IERC721 nft = IERC721(nftContract);
        if (nft.ownerOf(tokenId) != msg.sender) revert NotNFTOwner();

        Offer storage offer = tokenOffers[nftContract][tokenId][offerIndex];
        if (!offer.isActive) revert OfferNotActive();
        if (block.timestamp > offer.expiresAt) revert OfferExpired();

        uint256 amount = offer.amount;
        uint256 platformFee = (amount * platformFeeBps) / 10000;
        uint256 sellerProceeds = amount - platformFee;

        // Deduct from escrow
        escrowBalance[offer.buyer][offer.paymentToken] -= amount;

        // Transfer payment
        if (offer.paymentToken == address(0)) {
            (bool success, ) = payable(msg.sender).call{value: sellerProceeds}("");
            if (!success) revert TransferFailed();
        } else {
            IERC20(offer.paymentToken).safeTransfer(msg.sender, sellerProceeds);
        }

        // Transfer NFT
        nft.safeTransferFrom(msg.sender, offer.buyer, tokenId);

        // Update state
        offer.isActive = false;

        // Cancel any active listing for this NFT
        uint256 listingId = activeListingId[nftContract][tokenId];
        if (listings[listingId].isActive) {
            listings[listingId].isActive = false;
            delete activeListingId[nftContract][tokenId];
        }

        emit OfferAccepted(nftContract, tokenId, offer.buyer, amount);
    }

    // ============ Admin Functions ============

    /**
     * @dev Add or remove supported payment token
     * @param token Token address
     * @param supported Whether token should be supported
     */
    function setPaymentToken(address token, bool supported) external onlyOwner {
        supportedTokens[token] = supported;
        emit PaymentTokenUpdated(token, supported);
    }

    /**
     * @dev Update platform fee
     * @param newFeeBps New fee in basis points
     */
    function setPlatformFee(uint256 newFeeBps) external onlyOwner {
        if (newFeeBps > MAX_FEE_BPS) revert FeeTooHigh();
        uint256 oldFee = platformFeeBps;
        platformFeeBps = newFeeBps;
        emit PlatformFeeUpdated(oldFee, newFeeBps);
    }

    /**
     * @dev Withdraw platform fees
     * @param token Token to withdraw (address(0) for ETH)
     */
    function withdrawFees(address token) external onlyOwner {
        if (token == address(0)) {
            uint256 balance = address(this).balance;
            (bool success, ) = payable(owner()).call{value: balance}("");
            if (!success) revert TransferFailed();
        } else {
            uint256 balance = IERC20(token).balanceOf(address(this));
            IERC20(token).safeTransfer(owner(), balance);
        }
    }

    // ============ View Functions ============

    /**
     * @dev Get listing details
     * @param listingId Listing ID
     */
    function getListing(uint256 listingId) external view returns (Listing memory) {
        return listings[listingId];
    }

    /**
     * @dev Get all bids for a listing
     * @param listingId Listing ID
     */
    function getListingBids(uint256 listingId) external view returns (Bid[] memory) {
        return listingBids[listingId];
    }

    /**
     * @dev Get all offers for a token
     * @param nftContract NFT contract address
     * @param tokenId Token ID
     */
    function getTokenOffers(address nftContract, uint256 tokenId) external view returns (Offer[] memory) {
        return tokenOffers[nftContract][tokenId];
    }

    /**
     * @dev Get total number of listings
     */
    function totalListings() external view returns (uint256) {
        return _nextListingId;
    }

    // ============ Receive Function ============

    receive() external payable {}
}
