module carbon_marketplace::carbon_credit_nft {
    use std::error;
    use std::option::{Self, Option};
    use std::signer;
    use std::string::{Self, String};
    use aptos_framework::object::{Self, Object, ConstructorRef, ExtendRef};
    use aptos_framework::event;
    use aptos_token_objects::collection;
    use aptos_token_objects::token;

    /// Error codes
    const E_NOT_AUTHORIZED: u64 = 1;
    const E_INVALID_CREDIT_AMOUNT: u64 = 2;
    const E_CREDIT_ALREADY_RETIRED: u64 = 3;
    const E_COLLECTION_NOT_FOUND: u64 = 4;
    const E_INVALID_PROJECT_DATA: u64 = 5;

    /// Carbon Credit Collection Data
    struct CarbonCreditCollection has key {
        extend_ref: ExtendRef,
        total_credits_minted: u64,
        total_credits_retired: u64,
    }

    /// Carbon Credit Metadata - stored on each token object
    struct CarbonCredit has key {
        /// Project identifier (e.g., "REDD+ Amazon Rainforest")
        project_id: String,
        /// Vintage year when carbon was offset
        vintage_year: u64,
        /// Amount in tonnes of CO2 equivalent
        credit_amount: u64,
        /// Verification standard (e.g., "Verra VCS", "Gold Standard")
        verification_standard: String,
        /// Whether this credit has been retired (used)
        is_retired: bool,
        /// Serial number for tracking
        serial_number: String,
        /// Geographic location of project
        location: String,
        /// Project type (e.g., "Renewable Energy", "Reforestation")
        project_type: String,
        /// Extend ref for modifying the token
        extend_ref: ExtendRef,
    }

    /// Events
    #[event]
    struct CarbonCreditMinted has drop, store {
        token_address: address,
        project_id: String,
        credit_amount: u64,
        vintage_year: u64,
        minter: address,
        serial_number: String,
    }

    #[event]
    struct CarbonCreditRetired has drop, store {
        token_address: address,
        project_id: String,
        credit_amount: u64,
        retired_by: address,
        retirement_timestamp: u64,
    }

    #[event]
    struct CarbonCreditTransferred has drop, store {
        token_address: address,
        from: address,
        to: address,
        credit_amount: u64,
    }

    /// Initialize the carbon credit collection
    /// This should be called once by the module deployer
    public entry fun initialize_collection(
        creator: &signer,
        description: String,
        collection_name: String,
        uri: String,
    ) {
        let creator_addr = signer::address_of(creator);

        // Create unlimited collection for carbon credits
        let constructor_ref = collection::create_unlimited_collection(
            creator,
            description,
            collection_name,
            option::none(), // No royalty
            uri,
        );

        let collection_signer = object::generate_signer(&constructor_ref);
        let extend_ref = object::generate_extend_ref(&constructor_ref);

        // Store collection data
        move_to(&collection_signer, CarbonCreditCollection {
            extend_ref,
            total_credits_minted: 0,
            total_credits_retired: 0,
        });
    }

    /// Mint a new carbon credit NFT
    /// Only authorized verifiers should call this
    public entry fun mint_carbon_credit(
        creator: &signer,
        collection_name: String,
        description: String,
        token_name: String,
        uri: String,
        project_id: String,
        vintage_year: u64,
        credit_amount: u64,
        verification_standard: String,
        serial_number: String,
        location: String,
        project_type: String,
    ) {
        // Validate inputs
        assert!(credit_amount > 0, error::invalid_argument(E_INVALID_CREDIT_AMOUNT));
        assert!(string::length(&project_id) > 0, error::invalid_argument(E_INVALID_PROJECT_DATA));

        let creator_addr = signer::address_of(creator);

        // Create the token
        let constructor_ref = token::create_named_token(
            creator,
            collection_name,
            description,
            token_name,
            option::none(), // No royalty
            uri,
        );

        let token_signer = object::generate_signer(&constructor_ref);
        let extend_ref = object::generate_extend_ref(&constructor_ref);
        let token_address = object::address_from_constructor_ref(&constructor_ref);

        // Store carbon credit metadata
        move_to(&token_signer, CarbonCredit {
            project_id,
            vintage_year,
            credit_amount,
            verification_standard,
            is_retired: false,
            serial_number,
            location,
            project_type,
            extend_ref,
        });

        // Emit minting event
        event::emit(CarbonCreditMinted {
            token_address,
            project_id,
            credit_amount,
            vintage_year,
            minter: creator_addr,
            serial_number,
        });
    }

    /// Transfer carbon credit to another address
    public entry fun transfer_carbon_credit(
        from: &signer,
        token: Object<CarbonCredit>,
        to: address,
    ) acquires CarbonCredit {
        let from_addr = signer::address_of(from);
        let token_addr = object::object_address(&token);

        // Verify ownership
        assert!(object::owner(token) == from_addr, error::permission_denied(E_NOT_AUTHORIZED));

        // Verify not retired
        let credit = borrow_global<CarbonCredit>(token_addr);
        assert!(!credit.is_retired, error::invalid_state(E_CREDIT_ALREADY_RETIRED));

        // Transfer the token
        object::transfer(from, token, to);

        // Emit transfer event
        event::emit(CarbonCreditTransferred {
            token_address: token_addr,
            from: from_addr,
            to,
            credit_amount: credit.credit_amount,
        });
    }

    /// Mark a carbon credit as retired (burned/used)
    /// This is irreversible and represents actual carbon offset usage
    public entry fun retire_carbon_credit(
        owner: &signer,
        token: Object<CarbonCredit>,
    ) acquires CarbonCredit {
        let owner_addr = signer::address_of(owner);
        let token_addr = object::object_address(&token);

        // Verify ownership
        assert!(object::owner(token) == owner_addr, error::permission_denied(E_NOT_AUTHORIZED));

        // Get mutable reference to credit
        let credit = borrow_global_mut<CarbonCredit>(token_addr);

        // Verify not already retired
        assert!(!credit.is_retired, error::invalid_state(E_CREDIT_ALREADY_RETIRED));

        // Mark as retired
        credit.is_retired = true;

        // Emit retirement event
        event::emit(CarbonCreditRetired {
            token_address: token_addr,
            project_id: credit.project_id,
            credit_amount: credit.credit_amount,
            retired_by: owner_addr,
            retirement_timestamp: aptos_framework::timestamp::now_seconds(),
        });
    }

    /// View function to get carbon credit details
    #[view]
    public fun get_credit_details(token: Object<CarbonCredit>): (
        String,  // project_id
        u64,     // vintage_year
        u64,     // credit_amount
        String,  // verification_standard
        bool,    // is_retired
        String,  // serial_number
        String,  // location
        String,  // project_type
    ) acquires CarbonCredit {
        let token_addr = object::object_address(&token);
        let credit = borrow_global<CarbonCredit>(token_addr);

        (
            credit.project_id,
            credit.vintage_year,
            credit.credit_amount,
            credit.verification_standard,
            credit.is_retired,
            credit.serial_number,
            credit.location,
            credit.project_type,
        )
    }

    /// View function to check if credit is retired
    #[view]
    public fun is_credit_retired(token: Object<CarbonCredit>): bool acquires CarbonCredit {
        let token_addr = object::object_address(&token);
        let credit = borrow_global<CarbonCredit>(token_addr);
        credit.is_retired
    }

    /// View function to get credit amount
    #[view]
    public fun get_credit_amount(token: Object<CarbonCredit>): u64 acquires CarbonCredit {
        let token_addr = object::object_address(&token);
        let credit = borrow_global<CarbonCredit>(token_addr);
        credit.credit_amount
    }

    #[test_only]
    use aptos_framework::account;

    #[test(creator = @0xCAFE)]
    fun test_initialize_collection(creator: &signer) {
        let creator_addr = signer::address_of(creator);
        account::create_account_for_test(creator_addr);

        initialize_collection(
            creator,
            string::utf8(b"Verified Carbon Credits"),
            string::utf8(b"Carbon Credits Collection"),
            string::utf8(b"https://carbon-credits.example.com"),
        );
    }

    #[test(creator = @0xCAFE)]
    fun test_mint_carbon_credit(creator: &signer) {
        let creator_addr = signer::address_of(creator);
        account::create_account_for_test(creator_addr);

        // Initialize collection first
        initialize_collection(
            creator,
            string::utf8(b"Verified Carbon Credits"),
            string::utf8(b"Carbon Credits Collection"),
            string::utf8(b"https://carbon-credits.example.com"),
        );

        // Mint a carbon credit
        mint_carbon_credit(
            creator,
            string::utf8(b"Carbon Credits Collection"),
            string::utf8(b"Amazon Rainforest REDD+ Project Credit"),
            string::utf8(b"CC-REDD-001"),
            string::utf8(b"https://carbon-credits.example.com/cc-redd-001"),
            string::utf8(b"REDD-AMAZON-2024"),
            2024,
            100, // 100 tonnes CO2
            string::utf8(b"Verra VCS"),
            string::utf8(b"VCS-001-2024-00001"),
            string::utf8(b"Amazon Basin, Brazil"),
            string::utf8(b"REDD+ Reforestation"),
        );
    }
}
