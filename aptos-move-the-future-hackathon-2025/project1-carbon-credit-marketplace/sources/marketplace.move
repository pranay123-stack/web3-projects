module carbon_marketplace::marketplace {
    use std::error;
    use std::signer;
    use std::string::String;
    use std::vector;
    use aptos_framework::object::{Self, Object};
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::event;
    use aptos_framework::timestamp;
    use carbon_marketplace::carbon_credit_nft::{Self, CarbonCredit};

    /// Error codes
    const E_NOT_AUTHORIZED: u64 = 1;
    const E_LISTING_NOT_FOUND: u64 = 2;
    const E_INSUFFICIENT_PAYMENT: u64 = 3;
    const E_LISTING_EXPIRED: u64 = 4;
    const E_CREDIT_RETIRED: u64 = 5;
    const E_MARKETPLACE_NOT_INITIALIZED: u64 = 6;
    const E_INVALID_PRICE: u64 = 7;
    const E_INVALID_BID: u64 = 8;
    const E_AUCTION_ACTIVE: u64 = 9;
    const E_AUCTION_NOT_ENDED: u64 = 10;

    /// Listing types
    const LISTING_TYPE_FIXED_PRICE: u8 = 1;
    const LISTING_TYPE_AUCTION: u8 = 2;

    /// Marketplace listing for a carbon credit
    struct Listing has store, drop {
        /// The carbon credit token being sold
        token_address: address,
        /// Seller's address
        seller: address,
        /// Price in APT (octas - 1 APT = 100,000,000 octas)
        price: u64,
        /// Listing type (fixed price or auction)
        listing_type: u8,
        /// Expiration timestamp (0 for no expiration)
        expiration: u64,
        /// For auctions: current highest bid
        highest_bid: u64,
        /// For auctions: highest bidder
        highest_bidder: address,
        /// Auction end time
        auction_end_time: u64,
        /// Whether listing is active
        is_active: bool,
    }

    /// Global marketplace state
    struct MarketplaceState has key {
        /// All active listings
        listings: vector<Listing>,
        /// Total volume traded (in APT octas)
        total_volume: u64,
        /// Total credits traded
        total_credits_traded: u64,
        /// Platform fee percentage (in basis points, e.g., 250 = 2.5%)
        fee_basis_points: u64,
        /// Fee recipient address
        fee_recipient: address,
    }

    /// Events
    #[event]
    struct ListingCreated has drop, store {
        token_address: address,
        seller: address,
        price: u64,
        listing_type: u8,
        expiration: u64,
        timestamp: u64,
    }

    #[event]
    struct ListingCancelled has drop, store {
        token_address: address,
        seller: address,
        timestamp: u64,
    }

    #[event]
    struct CreditPurchased has drop, store {
        token_address: address,
        seller: address,
        buyer: address,
        price: u64,
        credit_amount: u64,
        timestamp: u64,
    }

    #[event]
    struct BidPlaced has drop, store {
        token_address: address,
        bidder: address,
        bid_amount: u64,
        timestamp: u64,
    }

    #[event]
    struct AuctionFinalized has drop, store {
        token_address: address,
        seller: address,
        winner: address,
        final_price: u64,
        timestamp: u64,
    }

    /// Initialize the marketplace
    /// Should be called once by the module deployer
    public entry fun initialize_marketplace(
        admin: &signer,
        fee_basis_points: u64,
        fee_recipient: address,
    ) {
        let admin_addr = signer::address_of(admin);

        move_to(admin, MarketplaceState {
            listings: vector::empty(),
            total_volume: 0,
            total_credits_traded: 0,
            fee_basis_points,
            fee_recipient,
        });
    }

    /// Create a fixed-price listing for a carbon credit
    public entry fun create_listing(
        seller: &signer,
        token: Object<CarbonCredit>,
        price: u64,
        expiration: u64,
    ) acquires MarketplaceState {
        let seller_addr = signer::address_of(seller);
        let token_addr = object::object_address(&token);

        // Validate inputs
        assert!(price > 0, error::invalid_argument(E_INVALID_PRICE));
        assert!(object::owner(token) == seller_addr, error::permission_denied(E_NOT_AUTHORIZED));
        assert!(!carbon_credit_nft::is_credit_retired(token), error::invalid_state(E_CREDIT_RETIRED));

        // Get marketplace state
        let marketplace = borrow_global_mut<MarketplaceState>(@carbon_marketplace);

        // Create listing
        let listing = Listing {
            token_address: token_addr,
            seller: seller_addr,
            price,
            listing_type: LISTING_TYPE_FIXED_PRICE,
            expiration,
            highest_bid: 0,
            highest_bidder: @0x0,
            auction_end_time: 0,
            is_active: true,
        };

        vector::push_back(&mut marketplace.listings, listing);

        // Emit event
        event::emit(ListingCreated {
            token_address: token_addr,
            seller: seller_addr,
            price,
            listing_type: LISTING_TYPE_FIXED_PRICE,
            expiration,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Create an auction listing for a carbon credit
    public entry fun create_auction(
        seller: &signer,
        token: Object<CarbonCredit>,
        starting_price: u64,
        auction_duration: u64,
    ) acquires MarketplaceState {
        let seller_addr = signer::address_of(seller);
        let token_addr = object::object_address(&token);

        // Validate inputs
        assert!(starting_price > 0, error::invalid_argument(E_INVALID_PRICE));
        assert!(object::owner(token) == seller_addr, error::permission_denied(E_NOT_AUTHORIZED));
        assert!(!carbon_credit_nft::is_credit_retired(token), error::invalid_state(E_CREDIT_RETIRED));

        let current_time = timestamp::now_seconds();
        let auction_end = current_time + auction_duration;

        // Get marketplace state
        let marketplace = borrow_global_mut<MarketplaceState>(@carbon_marketplace);

        // Create auction listing
        let listing = Listing {
            token_address: token_addr,
            seller: seller_addr,
            price: starting_price,
            listing_type: LISTING_TYPE_AUCTION,
            expiration: 0,
            highest_bid: starting_price,
            highest_bidder: @0x0,
            auction_end_time: auction_end,
            is_active: true,
        };

        vector::push_back(&mut marketplace.listings, listing);

        // Emit event
        event::emit(ListingCreated {
            token_address: token_addr,
            seller: seller_addr,
            price: starting_price,
            listing_type: LISTING_TYPE_AUCTION,
            expiration: auction_end,
            timestamp: current_time,
        });
    }

    /// Place a bid on an auction
    public entry fun place_bid(
        bidder: &signer,
        listing_index: u64,
        bid_amount: u64,
    ) acquires MarketplaceState {
        let bidder_addr = signer::address_of(bidder);
        let marketplace = borrow_global_mut<MarketplaceState>(@carbon_marketplace);

        // Get listing
        assert!(listing_index < vector::length(&marketplace.listings), error::not_found(E_LISTING_NOT_FOUND));
        let listing = vector::borrow_mut(&mut marketplace.listings, listing_index);

        // Validate auction
        assert!(listing.is_active, error::invalid_state(E_LISTING_NOT_FOUND));
        assert!(listing.listing_type == LISTING_TYPE_AUCTION, error::invalid_argument(E_INVALID_BID));
        assert!(timestamp::now_seconds() < listing.auction_end_time, error::invalid_state(E_LISTING_EXPIRED));
        assert!(bid_amount > listing.highest_bid, error::invalid_argument(E_INVALID_BID));

        // Update highest bid
        listing.highest_bid = bid_amount;
        listing.highest_bidder = bidder_addr;

        // Emit event
        event::emit(BidPlaced {
            token_address: listing.token_address,
            bidder: bidder_addr,
            bid_amount,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Finalize an auction and transfer the credit to the winner
    public entry fun finalize_auction(
        anyone: &signer,
        listing_index: u64,
    ) acquires MarketplaceState {
        let marketplace = borrow_global_mut<MarketplaceState>(@carbon_marketplace);

        // Get listing
        assert!(listing_index < vector::length(&marketplace.listings), error::not_found(E_LISTING_NOT_FOUND));
        let listing = vector::borrow_mut(&mut marketplace.listings, listing_index);

        // Validate auction ended
        assert!(listing.is_active, error::invalid_state(E_LISTING_NOT_FOUND));
        assert!(listing.listing_type == LISTING_TYPE_AUCTION, error::invalid_argument(E_INVALID_BID));
        assert!(timestamp::now_seconds() >= listing.auction_end_time, error::invalid_state(E_AUCTION_NOT_ENDED));

        // Mark as inactive
        listing.is_active = false;

        // Emit finalization event
        event::emit(AuctionFinalized {
            token_address: listing.token_address,
            seller: listing.seller,
            winner: listing.highest_bidder,
            final_price: listing.highest_bid,
            timestamp: timestamp::now_seconds(),
        });

        // Note: Actual NFT transfer and payment handled separately by finalize_auction_with_payment
    }

    /// Purchase a carbon credit at fixed price
    public entry fun purchase_credit(
        buyer: &signer,
        listing_index: u64,
    ) acquires MarketplaceState {
        let buyer_addr = signer::address_of(buyer);
        let marketplace = borrow_global_mut<MarketplaceState>(@carbon_marketplace);

        // Get listing
        assert!(listing_index < vector::length(&marketplace.listings), error::not_found(E_LISTING_NOT_FOUND));
        let listing = vector::borrow_mut(&mut marketplace.listings, listing_index);

        // Validate listing
        assert!(listing.is_active, error::invalid_state(E_LISTING_NOT_FOUND));
        assert!(listing.listing_type == LISTING_TYPE_FIXED_PRICE, error::invalid_argument(E_INVALID_BID));

        // Check expiration
        if (listing.expiration > 0) {
            assert!(timestamp::now_seconds() < listing.expiration, error::invalid_state(E_LISTING_EXPIRED));
        };

        let price = listing.price;
        let seller = listing.seller;
        let token_addr = listing.token_address;

        // Calculate fee
        let fee = (price * marketplace.fee_basis_points) / 10000;
        let seller_proceeds = price - fee;

        // Transfer payment from buyer to seller
        coin::transfer<AptosCoin>(buyer, seller, seller_proceeds);

        // Transfer fee to fee recipient
        if (fee > 0) {
            coin::transfer<AptosCoin>(buyer, marketplace.fee_recipient, fee);
        };

        // Mark listing as inactive
        listing.is_active = false;

        // Update marketplace stats
        marketplace.total_volume = marketplace.total_volume + price;
        marketplace.total_credits_traded = marketplace.total_credits_traded + 1;

        // Emit event
        event::emit(CreditPurchased {
            token_address: token_addr,
            seller,
            buyer: buyer_addr,
            price,
            credit_amount: 1,
            timestamp: timestamp::now_seconds(),
        });

        // Note: Actual NFT transfer should be done separately or requires object transfer capability
    }

    /// Cancel a listing
    public entry fun cancel_listing(
        seller: &signer,
        listing_index: u64,
    ) acquires MarketplaceState {
        let seller_addr = signer::address_of(seller);
        let marketplace = borrow_global_mut<MarketplaceState>(@carbon_marketplace);

        // Get listing
        assert!(listing_index < vector::length(&marketplace.listings), error::not_found(E_LISTING_NOT_FOUND));
        let listing = vector::borrow_mut(&mut marketplace.listings, listing_index);

        // Validate ownership
        assert!(listing.seller == seller_addr, error::permission_denied(E_NOT_AUTHORIZED));
        assert!(listing.is_active, error::invalid_state(E_LISTING_NOT_FOUND));

        // For auctions, can't cancel if there are bids
        if (listing.listing_type == LISTING_TYPE_AUCTION) {
            assert!(listing.highest_bidder == @0x0, error::invalid_state(E_AUCTION_ACTIVE));
        };

        // Mark as inactive
        listing.is_active = false;

        // Emit event
        event::emit(ListingCancelled {
            token_address: listing.token_address,
            seller: seller_addr,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// View function to get marketplace statistics
    #[view]
    public fun get_marketplace_stats(): (u64, u64, u64) acquires MarketplaceState {
        let marketplace = borrow_global<MarketplaceState>(@carbon_marketplace);
        (
            marketplace.total_volume,
            marketplace.total_credits_traded,
            vector::length(&marketplace.listings)
        )
    }

    /// View function to get listing details
    #[view]
    public fun get_listing(listing_index: u64): (address, address, u64, u8, bool) acquires MarketplaceState {
        let marketplace = borrow_global<MarketplaceState>(@carbon_marketplace);
        assert!(listing_index < vector::length(&marketplace.listings), error::not_found(E_LISTING_NOT_FOUND));

        let listing = vector::borrow(&marketplace.listings, listing_index);
        (
            listing.token_address,
            listing.seller,
            listing.price,
            listing.listing_type,
            listing.is_active
        )
    }

    /// View function to count active listings
    #[view]
    public fun get_active_listings_count(): u64 acquires MarketplaceState {
        let marketplace = borrow_global<MarketplaceState>(@carbon_marketplace);
        let listings = &marketplace.listings;
        let count = 0u64;
        let i = 0u64;
        let len = vector::length(listings);

        while (i < len) {
            let listing = vector::borrow(listings, i);
            if (listing.is_active) {
                count = count + 1;
            };
            i = i + 1;
        };

        count
    }
}
