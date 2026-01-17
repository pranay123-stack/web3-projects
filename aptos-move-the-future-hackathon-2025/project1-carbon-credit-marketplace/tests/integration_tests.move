#[test_only]
module carbon_marketplace::integration_tests {
    use std::string;
    use std::signer;
    use aptos_framework::account;
    use aptos_framework::timestamp;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::{Self, AptosCoin};
    use carbon_marketplace::carbon_credit_nft;
    use carbon_marketplace::marketplace;
    use carbon_marketplace::verification;

    // Test addresses
    const ADMIN_ADDR: address = @carbon_marketplace;
    const VERIFIER_ADDR: address = @0x1234;
    const DEVELOPER_ADDR: address = @0x5678;
    const BUYER_ADDR: address = @0xABCD;
    const SELLER_ADDR: address = @0xEF01;

    /// Initialize test environment
    fun setup_test_env(aptos_framework: &signer) {
        // Initialize timestamp for testing
        timestamp::set_time_has_started_for_testing(aptos_framework);

        // Initialize AptosCoin for testing
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);

        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    /// Create test accounts with APT balance
    fun create_test_accounts(
        aptos_framework: &signer,
    ): (signer, signer, signer, signer, signer) {
        // Create accounts
        let admin = account::create_account_for_test(ADMIN_ADDR);
        let verifier = account::create_account_for_test(VERIFIER_ADDR);
        let developer = account::create_account_for_test(DEVELOPER_ADDR);
        let buyer = account::create_account_for_test(BUYER_ADDR);
        let seller = account::create_account_for_test(SELLER_ADDR);

        // Register AptosCoin for all accounts
        coin::register<AptosCoin>(&admin);
        coin::register<AptosCoin>(&verifier);
        coin::register<AptosCoin>(&developer);
        coin::register<AptosCoin>(&buyer);
        coin::register<AptosCoin>(&seller);

        // Mint APT for testing (1000 APT each)
        aptos_coin::mint(aptos_framework, ADMIN_ADDR, 100000000000);
        aptos_coin::mint(aptos_framework, VERIFIER_ADDR, 100000000000);
        aptos_coin::mint(aptos_framework, DEVELOPER_ADDR, 100000000000);
        aptos_coin::mint(aptos_framework, BUYER_ADDR, 100000000000);
        aptos_coin::mint(aptos_framework, SELLER_ADDR, 100000000000);

        (admin, verifier, developer, buyer, seller)
    }

    #[test(aptos_framework = @0x1)]
    fun test_complete_workflow(aptos_framework: &signer) {
        // Setup environment
        setup_test_env(aptos_framework);
        let (admin, verifier, developer, _buyer, _seller) = create_test_accounts(aptos_framework);

        // 1. Initialize systems
        carbon_credit_nft::initialize_collection(
            &admin,
            string::utf8(b"Verified Carbon Credits on Aptos"),
            string::utf8(b"Aptos Carbon Credits"),
            string::utf8(b"https://aptos-carbon.io/collection"),
        );

        marketplace::initialize_marketplace(
            &admin,
            250, // 2.5% fee
            ADMIN_ADDR,
        );

        verification::initialize_verification_system(&admin);

        // 2. Add verifier
        verification::add_verifier(
            &admin,
            VERIFIER_ADDR,
            string::utf8(b"Verra VCS"),
        );

        // Verify verifier was added
        assert!(verification::is_verifier(VERIFIER_ADDR), 1);

        // 3. Submit project for verification
        verification::submit_project(
            &developer,
            string::utf8(b"REDD-AMAZON-2024"),
            string::utf8(b"Amazon Rainforest Protection"),
            string::utf8(b"Verra VCS"),
            string::utf8(b"Amazon Basin, Brazil"),
            string::utf8(b"REDD+ Reforestation"),
            10000, // Request 10,000 tonnes
            string::utf8(b"ipfs://QmProjectMetadata"),
        );

        // 4. Verify the project
        verification::verify_project(
            &verifier,
            0, // First project
            10000, // Approve 10,000 tonnes
        );

        // 5. Check project status
        let (project_id, _name, dev_addr, status, approved, issued) =
            verification::get_project(0);
        assert!(project_id == string::utf8(b"REDD-AMAZON-2024"), 2);
        assert!(dev_addr == DEVELOPER_ADDR, 3);
        assert!(status == 1, 4); // STATUS_VERIFIED
        assert!(approved == 10000, 5);
        assert!(issued == 0, 6);

        // 6. Mint carbon credit NFT
        carbon_credit_nft::mint_carbon_credit(
            &developer,
            string::utf8(b"Aptos Carbon Credits"),
            string::utf8(b"1 tonne CO2 equivalent from Amazon REDD+ project"),
            string::utf8(b"CC-REDD-001"),
            string::utf8(b"https://aptos-carbon.io/credits/1"),
            string::utf8(b"REDD-AMAZON-2024"),
            2024,
            100, // 100 tonnes
            string::utf8(b"Verra VCS"),
            string::utf8(b"VCS-REDD-2024-00001"),
            string::utf8(b"Amazon Basin, Brazil"),
            string::utf8(b"REDD+ Reforestation"),
        );

        // Record credits issued
        verification::record_credits_issued(
            &developer,
            0, // Project index
            100, // 100 tonnes issued
        );
    }

    #[test(aptos_framework = @0x1)]
    fun test_carbon_credit_lifecycle(aptos_framework: &signer) {
        // Setup
        setup_test_env(aptos_framework);
        let (admin, _verifier, developer, _buyer, _seller) = create_test_accounts(aptos_framework);

        // Initialize collection
        carbon_credit_nft::initialize_collection(
            &admin,
            string::utf8(b"Test Carbon Credits"),
            string::utf8(b"Test Collection"),
            string::utf8(b"https://test.io"),
        );

        // Mint carbon credit
        carbon_credit_nft::mint_carbon_credit(
            &developer,
            string::utf8(b"Test Collection"),
            string::utf8(b"Test credit"),
            string::utf8(b"TC-001"),
            string::utf8(b"https://test.io/1"),
            string::utf8(b"TEST-PROJECT"),
            2024,
            50,
            string::utf8(b"Test Standard"),
            string::utf8(b"TS-001"),
            string::utf8(b"Test Location"),
            string::utf8(b"Test Type"),
        );

        // Test passes if minting succeeds
    }

    #[test(aptos_framework = @0x1)]
    fun test_marketplace_listing(aptos_framework: &signer) {
        // Setup
        setup_test_env(aptos_framework);
        let (admin, _verifier, _developer, _buyer, _seller) = create_test_accounts(aptos_framework);

        // Initialize marketplace
        marketplace::initialize_marketplace(
            &admin,
            250, // 2.5% fee
            ADMIN_ADDR,
        );

        // Check marketplace stats
        let (volume, credits_traded, _listing_count) = marketplace::get_marketplace_stats();
        assert!(volume == 0, 1);
        assert!(credits_traded == 0, 2);
    }

    #[test(aptos_framework = @0x1)]
    fun test_verification_system(aptos_framework: &signer) {
        // Setup
        setup_test_env(aptos_framework);
        let (admin, verifier, developer, _buyer, _seller) = create_test_accounts(aptos_framework);

        // Initialize verification system
        verification::initialize_verification_system(&admin);

        // Add verifier
        verification::add_verifier(
            &admin,
            VERIFIER_ADDR,
            string::utf8(b"Gold Standard"),
        );

        // Submit project
        verification::submit_project(
            &developer,
            string::utf8(b"WIND-001"),
            string::utf8(b"Wind Farm Project"),
            string::utf8(b"Gold Standard"),
            string::utf8(b"Texas, USA"),
            string::utf8(b"Renewable Energy"),
            5000,
            string::utf8(b"ipfs://QmWindProject"),
        );

        // Verify project
        verification::verify_project(
            &verifier,
            0,
            5000,
        );

        // Check stats
        let (verifier_count, project_count, verified_count) = verification::get_system_stats();
        assert!(verifier_count == 1, 1);
        assert!(project_count == 1, 2);
        assert!(verified_count == 1, 3);
    }

    #[test(aptos_framework = @0x1)]
    #[expected_failure(abort_code = 0x50002, location = carbon_marketplace::verification)]
    fun test_duplicate_verifier_fails(aptos_framework: &signer) {
        // Setup
        setup_test_env(aptos_framework);
        let (admin, _verifier, _developer, _buyer, _seller) = create_test_accounts(aptos_framework);

        // Initialize verification system
        verification::initialize_verification_system(&admin);

        // Add verifier
        verification::add_verifier(
            &admin,
            VERIFIER_ADDR,
            string::utf8(b"Verra"),
        );

        // Try to add same verifier again - should fail
        verification::add_verifier(
            &admin,
            VERIFIER_ADDR,
            string::utf8(b"Verra Duplicate"),
        );
    }

    #[test(aptos_framework = @0x1)]
    fun test_marketplace_active_listings(aptos_framework: &signer) {
        // Setup
        setup_test_env(aptos_framework);
        let (admin, _verifier, _developer, _buyer, _seller) = create_test_accounts(aptos_framework);

        // Initialize marketplace
        marketplace::initialize_marketplace(
            &admin,
            250,
            ADMIN_ADDR,
        );

        // Check active listings count
        let active_count = marketplace::get_active_listings_count();
        assert!(active_count == 0, 1);
    }
}
