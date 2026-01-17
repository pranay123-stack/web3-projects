module ai_marketplace::data_asset {
    use std::error;
    use std::option::{Self, Option};
    use std::signer;
    use std::string::{Self, String};
    use std::vector;
    use aptos_framework::object::{Self, Object, ConstructorRef, ExtendRef};
    use aptos_framework::event;
    use aptos_framework::timestamp;
    use aptos_token_objects::collection;
    use aptos_token_objects::token;

    /// Error codes
    const E_NOT_AUTHORIZED: u64 = 1;
    const E_INVALID_DATA_SIZE: u64 = 2;
    const E_INVALID_LICENSE_TYPE: u64 = 3;
    const E_ACCESS_EXPIRED: u64 = 4;
    const E_USAGE_LIMIT_EXCEEDED: u64 = 5;
    const E_INSUFFICIENT_QUALITY_SCORE: u64 = 6;

    /// License types
    const LICENSE_PERPETUAL: u8 = 1;
    const LICENSE_TIME_LIMITED: u8 = 2;
    const LICENSE_USAGE_LIMITED: u8 = 3;
    const LICENSE_TRAINING_ONLY: u8 = 4;

    /// Data categories
    const CATEGORY_TEXT: u8 = 1;
    const CATEGORY_IMAGE: u8 = 2;
    const CATEGORY_AUDIO: u8 = 3;
    const CATEGORY_VIDEO: u8 = 4;
    const CATEGORY_TABULAR: u8 = 5;
    const CATEGORY_TIME_SERIES: u8 = 6;

    /// Data Asset Collection
    struct DataAssetCollection has key {
        extend_ref: ExtendRef,
        total_datasets: u64,
        total_downloads: u64,
    }

    /// Data Asset NFT - represents a dataset
    struct DataAsset has key {
        /// Dataset name
        name: String,
        /// Dataset description
        description: String,
        /// Data category (text, image, audio, etc.)
        category: u8,
        /// Size in bytes
        size_bytes: u64,
        /// Number of records/samples
        record_count: u64,
        /// IPFS or Arweave hash for encrypted data
        data_uri: String,
        /// Encryption key hash (actual key given on purchase)
        encryption_key_hash: String,
        /// License type
        license_type: u8,
        /// License duration in seconds (0 for perpetual)
        license_duration: u64,
        /// Usage limit (0 for unlimited)
        usage_limit: u64,
        /// Current usage count
        usage_count: u64,
        /// Quality score (0-100)
        quality_score: u64,
        /// Total revenue generated
        total_revenue: u64,
        /// Original creator
        creator: address,
        /// Created timestamp
        created_at: u64,
        /// Access expiration (for time-limited licenses)
        access_expires_at: u64,
        /// Extend ref for modifications
        extend_ref: ExtendRef,
    }

    /// Download record
    struct DownloadRecord has store, drop {
        downloader: address,
        timestamp: u64,
        usage_purpose: String,
    }

    /// Quality rating
    struct QualityRating has store, drop {
        rater: address,
        score: u64,
        comment: String,
        timestamp: u64,
    }

    /// Dataset ratings storage
    struct DatasetRatings has key {
        ratings: vector<QualityRating>,
        average_score: u64,
        total_ratings: u64,
    }

    /// Events
    #[event]
    struct DataAssetMinted has drop, store {
        token_address: address,
        creator: address,
        name: String,
        category: u8,
        size_bytes: u64,
        license_type: u8,
    }

    #[event]
    struct DataAccessGranted has drop, store {
        token_address: address,
        owner: address,
        accessor: address,
        timestamp: u64,
    }

    #[event]
    struct DataUsageRecorded has drop, store {
        token_address: address,
        user: address,
        usage_count: u64,
        purpose: String,
    }

    #[event]
    struct QualityRated has drop, store {
        token_address: address,
        rater: address,
        score: u64,
        new_average: u64,
    }

    /// Initialize the data asset collection
    public entry fun initialize_collection(
        creator: &signer,
        description: String,
        collection_name: String,
        uri: String,
    ) {
        let constructor_ref = collection::create_unlimited_collection(
            creator,
            description,
            collection_name,
            option::none(),
            uri,
        );

        let collection_signer = object::generate_signer(&constructor_ref);
        let extend_ref = object::generate_extend_ref(&constructor_ref);

        move_to(&collection_signer, DataAssetCollection {
            extend_ref,
            total_datasets: 0,
            total_downloads: 0,
        });
    }

    /// Mint a new data asset NFT
    public entry fun mint_data_asset(
        creator: &signer,
        collection_name: String,
        token_name: String,
        token_description: String,
        token_uri: String,
        dataset_name: String,
        dataset_description: String,
        category: u8,
        size_bytes: u64,
        record_count: u64,
        data_uri: String,
        encryption_key_hash: String,
        license_type: u8,
        license_duration: u64,
        usage_limit: u64,
    ) {
        let creator_addr = signer::address_of(creator);

        // Validate inputs
        assert!(size_bytes > 0, error::invalid_argument(E_INVALID_DATA_SIZE));
        assert!(license_type >= LICENSE_PERPETUAL && license_type <= LICENSE_TRAINING_ONLY,
            error::invalid_argument(E_INVALID_LICENSE_TYPE));

        // Create token
        let constructor_ref = token::create_named_token(
            creator,
            collection_name,
            token_description,
            token_name,
            option::none(),
            token_uri,
        );

        let token_signer = object::generate_signer(&constructor_ref);
        let extend_ref = object::generate_extend_ref(&constructor_ref);
        let token_address = object::address_from_constructor_ref(&constructor_ref);

        let current_time = timestamp::now_seconds();

        // Store data asset metadata
        move_to(&token_signer, DataAsset {
            name: dataset_name,
            description: dataset_description,
            category,
            size_bytes,
            record_count,
            data_uri,
            encryption_key_hash,
            license_type,
            license_duration,
            usage_limit,
            usage_count: 0,
            quality_score: 50, // Default middle score
            total_revenue: 0,
            creator: creator_addr,
            created_at: current_time,
            access_expires_at: if (license_type == LICENSE_TIME_LIMITED) {
                current_time + license_duration
            } else {
                0
            },
            extend_ref,
        });

        // Initialize ratings storage
        move_to(&token_signer, DatasetRatings {
            ratings: vector::empty(),
            average_score: 50,
            total_ratings: 0,
        });

        // Emit event
        event::emit(DataAssetMinted {
            token_address,
            creator: creator_addr,
            name: dataset_name,
            category,
            size_bytes,
            license_type,
        });
    }

    /// Record data usage
    public entry fun record_usage(
        user: &signer,
        token: Object<DataAsset>,
        purpose: String,
    ) acquires DataAsset {
        let user_addr = signer::address_of(user);
        let token_addr = object::object_address(&token);

        // Verify ownership
        assert!(object::owner(token) == user_addr, error::permission_denied(E_NOT_AUTHORIZED));

        let asset = borrow_global_mut<DataAsset>(token_addr);

        // Check usage limits
        if (asset.usage_limit > 0) {
            assert!(asset.usage_count < asset.usage_limit,
                error::resource_exhausted(E_USAGE_LIMIT_EXCEEDED));
        };

        // Check time limits
        if (asset.license_type == LICENSE_TIME_LIMITED) {
            let current_time = timestamp::now_seconds();
            assert!(current_time < asset.access_expires_at,
                error::invalid_state(E_ACCESS_EXPIRED));
        };

        // Increment usage
        asset.usage_count = asset.usage_count + 1;

        // Emit event
        event::emit(DataUsageRecorded {
            token_address: token_addr,
            user: user_addr,
            usage_count: asset.usage_count,
            purpose,
        });
    }

    /// Rate dataset quality
    public entry fun rate_quality(
        rater: &signer,
        token: Object<DataAsset>,
        score: u64,
        comment: String,
    ) acquires DataAsset, DatasetRatings {
        let rater_addr = signer::address_of(rater);
        let token_addr = object::object_address(&token);

        // Validate score
        assert!(score <= 100, error::invalid_argument(E_INSUFFICIENT_QUALITY_SCORE));

        let ratings = borrow_global_mut<DatasetRatings>(token_addr);

        // Add new rating
        let rating = QualityRating {
            rater: rater_addr,
            score,
            comment,
            timestamp: timestamp::now_seconds(),
        };

        vector::push_back(&mut ratings.ratings, rating);
        ratings.total_ratings = ratings.total_ratings + 1;

        // Recalculate average
        let total_score = 0u64;
        let i = 0u64;
        let len = vector::length(&ratings.ratings);
        while (i < len) {
            let r = vector::borrow(&ratings.ratings, i);
            total_score = total_score + r.score;
            i = i + 1;
        };
        ratings.average_score = total_score / ratings.total_ratings;

        // Update asset quality score
        let asset = borrow_global_mut<DataAsset>(token_addr);
        asset.quality_score = ratings.average_score;

        // Emit event
        event::emit(QualityRated {
            token_address: token_addr,
            rater: rater_addr,
            score,
            new_average: ratings.average_score,
        });
    }

    /// Grant access to data (transfer NFT)
    public entry fun grant_access(
        owner: &signer,
        token: Object<DataAsset>,
        accessor: address,
    ) acquires DataAsset {
        let owner_addr = signer::address_of(owner);
        let token_addr = object::object_address(&token);

        // Verify ownership
        assert!(object::owner(token) == owner_addr, error::permission_denied(E_NOT_AUTHORIZED));

        // Transfer token
        object::transfer(owner, token, accessor);

        // Update access expiration if time-limited
        let asset = borrow_global_mut<DataAsset>(token_addr);
        if (asset.license_type == LICENSE_TIME_LIMITED) {
            asset.access_expires_at = timestamp::now_seconds() + asset.license_duration;
        };

        // Emit event
        event::emit(DataAccessGranted {
            token_address: token_addr,
            owner: owner_addr,
            accessor,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// View function: Get data asset details
    #[view]
    public fun get_asset_details(token: Object<DataAsset>): (
        String,  // name
        String,  // description
        u8,      // category
        u64,     // size_bytes
        u64,     // record_count
        u8,      // license_type
        u64,     // quality_score
        address, // creator
    ) acquires DataAsset {
        let token_addr = object::object_address(&token);
        let asset = borrow_global<DataAsset>(token_addr);

        (
            asset.name,
            asset.description,
            asset.category,
            asset.size_bytes,
            asset.record_count,
            asset.license_type,
            asset.quality_score,
            asset.creator,
        )
    }

    /// View function: Check if access is still valid
    #[view]
    public fun is_access_valid(token: Object<DataAsset>): bool acquires DataAsset {
        let token_addr = object::object_address(&token);
        let asset = borrow_global<DataAsset>(token_addr);

        if (asset.license_type == LICENSE_TIME_LIMITED) {
            timestamp::now_seconds() < asset.access_expires_at
        } else if (asset.usage_limit > 0) {
            asset.usage_count < asset.usage_limit
        } else {
            true
        }
    }

    /// View function: Get usage statistics
    #[view]
    public fun get_usage_stats(token: Object<DataAsset>): (u64, u64, u64) acquires DataAsset {
        let token_addr = object::object_address(&token);
        let asset = borrow_global<DataAsset>(token_addr);

        (
            asset.usage_count,
            asset.usage_limit,
            asset.access_expires_at,
        )
    }

    /// View function: Get quality rating average
    #[view]
    public fun get_quality_score(token: Object<DataAsset>): (u64, u64) acquires DatasetRatings {
        let token_addr = object::object_address(&token);
        let ratings = borrow_global<DatasetRatings>(token_addr);

        (
            ratings.average_score,
            ratings.total_ratings,
        )
    }
}
