module ai_marketplace::data_marketplace {
    use std::error;
    use std::signer;
    use std::string::{Self, String};
    use std::vector;
    use aptos_framework::object::{Self, Object};
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::event;
    use aptos_framework::timestamp;
    use ai_marketplace::data_asset::{Self, DataAsset};

    /// Error codes
    const E_NOT_AUTHORIZED: u64 = 1;
    const E_LISTING_NOT_FOUND: u64 = 2;
    const E_INSUFFICIENT_PAYMENT: u64 = 3;
    const E_INVALID_PRICE: u64 = 4;
    const E_INVALID_SUBSCRIPTION: u64 = 5;
    const E_MARKETPLACE_NOT_INITIALIZED: u64 = 6;

    /// Pricing models
    const PRICING_ONE_TIME: u8 = 1;
    const PRICING_SUBSCRIPTION: u8 = 2;
    const PRICING_PAY_PER_USE: u8 = 3;
    const PRICING_TIERED: u8 = 4;

    /// Data listing
    struct DataListing has store, drop {
        /// Token address of the data asset
        token_address: address,
        /// Seller/data owner
        seller: address,
        /// Pricing model
        pricing_model: u8,
        /// Base price in APT (octas)
        base_price: u64,
        /// Subscription period (seconds) if applicable
        subscription_period: u64,
        /// Usage price (per query/download) if applicable
        usage_price: u64,
        /// Premium tier price (if tiered)
        premium_price: u64,
        /// Is listing active
        is_active: bool,
        /// Total sales count
        sales_count: u64,
        /// Total revenue generated
        total_revenue: u64,
    }

    /// Purchase record
    struct Purchase has store, drop {
        buyer: address,
        seller: address,
        token_address: address,
        price_paid: u64,
        pricing_model: u8,
        purchase_timestamp: u64,
        access_expires_at: u64,
    }

    /// Subscription
    struct Subscription has store, drop {
        subscriber: address,
        token_address: address,
        started_at: u64,
        expires_at: u64,
        auto_renew: bool,
    }

    /// Royalty split (for data contributors)
    struct RoyaltySplit has store, drop {
        recipient: address,
        percentage: u64, // Basis points (e.g., 1000 = 10%)
    }

    /// Marketplace state
    struct MarketplaceState has key {
        /// Active listings
        listings: vector<DataListing>,
        /// Purchase history
        purchases: vector<Purchase>,
        /// Active subscriptions
        subscriptions: vector<Subscription>,
        /// Total marketplace volume (APT)
        total_volume: u64,
        /// Total datasets sold
        total_datasets_sold: u64,
        /// Platform fee (basis points)
        platform_fee_bp: u64,
        /// Fee recipient
        fee_recipient: address,
        /// Royalty splits for datasets
        royalty_splits: vector<RoyaltySplit>,
    }

    /// Events
    #[event]
    struct DatasetListed has drop, store {
        token_address: address,
        seller: address,
        pricing_model: u8,
        base_price: u64,
        timestamp: u64,
    }

    #[event]
    struct DatasetPurchased has drop, store {
        token_address: address,
        buyer: address,
        seller: address,
        price: u64,
        pricing_model: u8,
        timestamp: u64,
    }

    #[event]
    struct SubscriptionCreated has drop, store {
        token_address: address,
        subscriber: address,
        expires_at: u64,
        timestamp: u64,
    }

    #[event]
    struct SubscriptionRenewed has drop, store {
        token_address: address,
        subscriber: address,
        new_expiration: u64,
        timestamp: u64,
    }

    #[event]
    struct RoyaltyPaid has drop, store {
        token_address: address,
        recipient: address,
        amount: u64,
        timestamp: u64,
    }

    /// Initialize marketplace
    public entry fun initialize_marketplace(
        admin: &signer,
        platform_fee_bp: u64,
        fee_recipient: address,
    ) {
        move_to(admin, MarketplaceState {
            listings: vector::empty(),
            purchases: vector::empty(),
            subscriptions: vector::empty(),
            total_volume: 0,
            total_datasets_sold: 0,
            platform_fee_bp,
            fee_recipient,
            royalty_splits: vector::empty(),
        });
    }

    /// List dataset for sale
    public entry fun list_dataset(
        seller: &signer,
        token: Object<DataAsset>,
        pricing_model: u8,
        base_price: u64,
        subscription_period: u64,
        usage_price: u64,
        premium_price: u64,
    ) acquires MarketplaceState {
        let seller_addr = signer::address_of(seller);
        let token_addr = object::object_address(&token);

        // Verify ownership
        assert!(object::owner(token) == seller_addr, error::permission_denied(E_NOT_AUTHORIZED));
        assert!(base_price > 0, error::invalid_argument(E_INVALID_PRICE));

        let marketplace = borrow_global_mut<MarketplaceState>(@ai_marketplace);

        let listing = DataListing {
            token_address: token_addr,
            seller: seller_addr,
            pricing_model,
            base_price,
            subscription_period,
            usage_price,
            premium_price,
            is_active: true,
            sales_count: 0,
            total_revenue: 0,
        };

        vector::push_back(&mut marketplace.listings, listing);

        event::emit(DatasetListed {
            token_address: token_addr,
            seller: seller_addr,
            pricing_model,
            base_price,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Purchase dataset (one-time)
    public entry fun purchase_dataset(
        buyer: &signer,
        listing_index: u64,
    ) acquires MarketplaceState {
        let buyer_addr = signer::address_of(buyer);
        let marketplace = borrow_global_mut<MarketplaceState>(@ai_marketplace);

        assert!(listing_index < vector::length(&marketplace.listings),
            error::not_found(E_LISTING_NOT_FOUND));

        let listing = vector::borrow_mut(&mut marketplace.listings, listing_index);
        assert!(listing.is_active, error::invalid_state(E_LISTING_NOT_FOUND));
        assert!(listing.pricing_model == PRICING_ONE_TIME,
            error::invalid_argument(E_INVALID_SUBSCRIPTION));

        let price = listing.base_price;
        let seller = listing.seller;
        let token_addr = listing.token_address;

        // Calculate fees
        let platform_fee = (price * marketplace.platform_fee_bp) / 10000;
        let seller_proceeds = price - platform_fee;

        // Transfer payment
        coin::transfer<AptosCoin>(buyer, seller, seller_proceeds);
        if (platform_fee > 0) {
            coin::transfer<AptosCoin>(buyer, marketplace.fee_recipient, platform_fee);
        };

        // Update listing stats
        listing.sales_count = listing.sales_count + 1;
        listing.total_revenue = listing.total_revenue + price;

        // Update marketplace stats
        marketplace.total_volume = marketplace.total_volume + price;
        marketplace.total_datasets_sold = marketplace.total_datasets_sold + 1;

        // Record purchase
        let purchase = Purchase {
            buyer: buyer_addr,
            seller,
            token_address: token_addr,
            price_paid: price,
            pricing_model: listing.pricing_model,
            purchase_timestamp: timestamp::now_seconds(),
            access_expires_at: 0, // Perpetual for one-time
        };
        vector::push_back(&mut marketplace.purchases, purchase);

        event::emit(DatasetPurchased {
            token_address: token_addr,
            buyer: buyer_addr,
            seller,
            price,
            pricing_model: listing.pricing_model,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Subscribe to dataset
    public entry fun create_subscription(
        subscriber: &signer,
        listing_index: u64,
        auto_renew: bool,
    ) acquires MarketplaceState {
        let subscriber_addr = signer::address_of(subscriber);
        let marketplace = borrow_global_mut<MarketplaceState>(@ai_marketplace);

        assert!(listing_index < vector::length(&marketplace.listings),
            error::not_found(E_LISTING_NOT_FOUND));

        let listing = vector::borrow_mut(&mut marketplace.listings, listing_index);
        assert!(listing.is_active, error::invalid_state(E_LISTING_NOT_FOUND));
        assert!(listing.pricing_model == PRICING_SUBSCRIPTION,
            error::invalid_argument(E_INVALID_SUBSCRIPTION));

        let price = listing.base_price;
        let seller = listing.seller;
        let token_addr = listing.token_address;

        // Calculate fees
        let platform_fee = (price * marketplace.platform_fee_bp) / 10000;
        let seller_proceeds = price - platform_fee;

        // Transfer payment
        coin::transfer<AptosCoin>(subscriber, seller, seller_proceeds);
        if (platform_fee > 0) {
            coin::transfer<AptosCoin>(subscriber, marketplace.fee_recipient, platform_fee);
        };

        let current_time = timestamp::now_seconds();
        let expires_at = current_time + listing.subscription_period;

        // Create subscription
        let subscription = Subscription {
            subscriber: subscriber_addr,
            token_address: token_addr,
            started_at: current_time,
            expires_at,
            auto_renew,
        };
        vector::push_back(&mut marketplace.subscriptions, subscription);

        // Update stats
        listing.sales_count = listing.sales_count + 1;
        listing.total_revenue = listing.total_revenue + price;
        marketplace.total_volume = marketplace.total_volume + price;

        event::emit(SubscriptionCreated {
            token_address: token_addr,
            subscriber: subscriber_addr,
            expires_at,
            timestamp: current_time,
        });
    }

    /// Renew subscription
    public entry fun renew_subscription(
        subscriber: &signer,
        subscription_index: u64,
    ) acquires MarketplaceState {
        let subscriber_addr = signer::address_of(subscriber);
        let marketplace = borrow_global_mut<MarketplaceState>(@ai_marketplace);

        assert!(subscription_index < vector::length(&marketplace.subscriptions),
            error::not_found(E_LISTING_NOT_FOUND));

        let subscription = vector::borrow_mut(&mut marketplace.subscriptions, subscription_index);
        assert!(subscription.subscriber == subscriber_addr,
            error::permission_denied(E_NOT_AUTHORIZED));

        // Find corresponding listing
        let token_addr = subscription.token_address;
        let listing_opt = find_listing(&marketplace.listings, token_addr);
        assert!(listing_opt < vector::length(&marketplace.listings),
            error::not_found(E_LISTING_NOT_FOUND));

        let listing = vector::borrow_mut(&mut marketplace.listings, listing_opt);
        let price = listing.base_price;

        // Calculate fees and transfer payment
        let platform_fee = (price * marketplace.platform_fee_bp) / 10000;
        let seller_proceeds = price - platform_fee;

        coin::transfer<AptosCoin>(subscriber, listing.seller, seller_proceeds);
        if (platform_fee > 0) {
            coin::transfer<AptosCoin>(subscriber, marketplace.fee_recipient, platform_fee);
        };

        // Extend subscription
        subscription.expires_at = subscription.expires_at + listing.subscription_period;
        listing.total_revenue = listing.total_revenue + price;
        marketplace.total_volume = marketplace.total_volume + price;

        event::emit(SubscriptionRenewed {
            token_address: token_addr,
            subscriber: subscriber_addr,
            new_expiration: subscription.expires_at,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Add royalty split for dataset
    public entry fun add_royalty_split(
        admin: &signer,
        recipient: address,
        percentage: u64,
    ) acquires MarketplaceState {
        let marketplace = borrow_global_mut<MarketplaceState>(@ai_marketplace);

        let split = RoyaltySplit {
            recipient,
            percentage,
        };
        vector::push_back(&mut marketplace.royalty_splits, split);
    }

    /// Cancel listing
    public entry fun cancel_listing(
        seller: &signer,
        listing_index: u64,
    ) acquires MarketplaceState {
        let seller_addr = signer::address_of(seller);
        let marketplace = borrow_global_mut<MarketplaceState>(@ai_marketplace);

        assert!(listing_index < vector::length(&marketplace.listings),
            error::not_found(E_LISTING_NOT_FOUND));

        let listing = vector::borrow_mut(&mut marketplace.listings, listing_index);
        assert!(listing.seller == seller_addr, error::permission_denied(E_NOT_AUTHORIZED));

        listing.is_active = false;
    }

    /// Helper: Find listing by token address
    fun find_listing(listings: &vector<DataListing>, token_addr: address): u64 {
        let i = 0u64;
        let len = vector::length(listings);
        while (i < len) {
            let listing = vector::borrow(listings, i);
            if (listing.token_address == token_addr && listing.is_active) {
                return i
            };
            i = i + 1;
        };
        len // Return length if not found
    }

    /// View: Get marketplace stats
    #[view]
    public fun get_marketplace_stats(): (u64, u64, u64, u64) acquires MarketplaceState {
        let marketplace = borrow_global<MarketplaceState>(@ai_marketplace);
        (
            marketplace.total_volume,
            marketplace.total_datasets_sold,
            vector::length(&marketplace.listings),
            vector::length(&marketplace.subscriptions),
        )
    }

    /// View: Get listing details
    #[view]
    public fun get_listing(listing_index: u64): (address, address, u8, u64, bool) acquires MarketplaceState {
        let marketplace = borrow_global<MarketplaceState>(@ai_marketplace);
        assert!(listing_index < vector::length(&marketplace.listings),
            error::not_found(E_LISTING_NOT_FOUND));

        let listing = vector::borrow(&marketplace.listings, listing_index);
        (
            listing.token_address,
            listing.seller,
            listing.pricing_model,
            listing.base_price,
            listing.is_active,
        )
    }

    /// View: Check if user has active subscription
    #[view]
    public fun has_active_subscription(user: address, token_addr: address): bool acquires MarketplaceState {
        let marketplace = borrow_global<MarketplaceState>(@ai_marketplace);
        let current_time = timestamp::now_seconds();

        let i = 0u64;
        let len = vector::length(&marketplace.subscriptions);
        while (i < len) {
            let sub = vector::borrow(&marketplace.subscriptions, i);
            if (sub.subscriber == user && sub.token_address == token_addr) {
                return sub.expires_at > current_time
            };
            i = i + 1;
        };
        false
    }
}
