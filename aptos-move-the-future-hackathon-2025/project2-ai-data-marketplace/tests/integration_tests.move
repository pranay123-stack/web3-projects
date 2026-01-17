#[test_only]
module ai_marketplace::integration_tests {
    use std::string;
    use std::signer;
    use aptos_framework::account;
    use aptos_framework::timestamp;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::{Self, AptosCoin};
    use ai_marketplace::data_asset;
    use ai_marketplace::data_marketplace;
    use ai_marketplace::access_control;
    use ai_marketplace::ai_model_registry;

    // Test addresses
    const ADMIN_ADDR: address = @ai_marketplace;
    const CREATOR_ADDR: address = @0x1111;
    const BUYER_ADDR: address = @0x2222;
    const USER1_ADDR: address = @0x3333;
    const USER2_ADDR: address = @0x4444;

    /// Initialize test environment
    fun setup_test_env(aptos_framework: &signer) {
        timestamp::set_time_has_started_for_testing(aptos_framework);

        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);
        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    /// Create test accounts with APT
    fun create_test_accounts(
        aptos_framework: &signer,
    ): (signer, signer, signer, signer, signer) {
        let admin = account::create_account_for_test(ADMIN_ADDR);
        let creator = account::create_account_for_test(CREATOR_ADDR);
        let buyer = account::create_account_for_test(BUYER_ADDR);
        let user1 = account::create_account_for_test(USER1_ADDR);
        let user2 = account::create_account_for_test(USER2_ADDR);

        coin::register<AptosCoin>(&admin);
        coin::register<AptosCoin>(&creator);
        coin::register<AptosCoin>(&buyer);
        coin::register<AptosCoin>(&user1);
        coin::register<AptosCoin>(&user2);

        aptos_coin::mint(aptos_framework, ADMIN_ADDR, 100000000000);
        aptos_coin::mint(aptos_framework, CREATOR_ADDR, 100000000000);
        aptos_coin::mint(aptos_framework, BUYER_ADDR, 100000000000);
        aptos_coin::mint(aptos_framework, USER1_ADDR, 100000000000);
        aptos_coin::mint(aptos_framework, USER2_ADDR, 100000000000);

        (admin, creator, buyer, user1, user2)
    }

    #[test(aptos_framework = @0x1)]
    fun test_complete_workflow(aptos_framework: &signer) {
        setup_test_env(aptos_framework);
        let (admin, creator, buyer, _user1, _user2) = create_test_accounts(aptos_framework);

        // 1. Initialize all systems
        data_asset::initialize_collection(
            &admin,
            string::utf8(b"AI Training Datasets on Aptos"),
            string::utf8(b"Aptos AI Data"),
            string::utf8(b"https://aptos-ai-data.io"),
        );

        data_marketplace::initialize_marketplace(
            &admin,
            250, // 2.5% fee
            ADMIN_ADDR,
        );

        access_control::initialize_access_control(&admin);
        ai_model_registry::initialize_registry(&admin);

        // 2. Mint dataset NFT
        data_asset::mint_data_asset(
            &creator,
            string::utf8(b"Aptos AI Data"),
            string::utf8(b"IMG-DATASET-001"),
            string::utf8(b"ImageNet-style dataset"),
            string::utf8(b"https://aptos-ai-data.io/img-001"),
            string::utf8(b"ImageNet Style Dataset"),
            string::utf8(b"High quality labeled images for computer vision"),
            2, // CATEGORY_IMAGE
            100000000, // 100MB
            10000, // 10k images
            string::utf8(b"ipfs://QmDataset"),
            string::utf8(b"hash123"),
            1, // LICENSE_PERPETUAL
            0,
            0,
        );

        // Test passes if all initializations succeed
    }

    #[test(aptos_framework = @0x1)]
    fun test_data_asset_minting(aptos_framework: &signer) {
        setup_test_env(aptos_framework);
        let (admin, creator, _buyer, _user1, _user2) = create_test_accounts(aptos_framework);

        data_asset::initialize_collection(
            &admin,
            string::utf8(b"Test AI Datasets"),
            string::utf8(b"Test Collection"),
            string::utf8(b"https://test.io"),
        );

        data_asset::mint_data_asset(
            &creator,
            string::utf8(b"Test Collection"),
            string::utf8(b"TEST-001"),
            string::utf8(b"Test dataset"),
            string::utf8(b"https://test.io/001"),
            string::utf8(b"Test Dataset"),
            string::utf8(b"Description"),
            1, // TEXT
            50000,
            1000,
            string::utf8(b"ipfs://test"),
            string::utf8(b"hash"),
            1, // PERPETUAL
            0,
            0,
        );
    }

    #[test(aptos_framework = @0x1)]
    fun test_marketplace_initialization(aptos_framework: &signer) {
        setup_test_env(aptos_framework);
        let (admin, _creator, _buyer, _user1, _user2) = create_test_accounts(aptos_framework);

        data_marketplace::initialize_marketplace(
            &admin,
            250,
            ADMIN_ADDR,
        );

        let (volume, datasets_sold, listing_count, sub_count) =
            data_marketplace::get_marketplace_stats();
        assert!(volume == 0, 1);
        assert!(datasets_sold == 0, 2);
        assert!(listing_count == 0, 3);
        assert!(sub_count == 0, 4);
    }

    #[test(aptos_framework = @0x1)]
    fun test_access_control_initialization(aptos_framework: &signer) {
        setup_test_env(aptos_framework);
        let (admin, _creator, _buyer, _user1, _user2) = create_test_accounts(aptos_framework);

        access_control::initialize_access_control(&admin);

        let (token_count, total_accesses, log_count) =
            access_control::get_access_stats();
        assert!(token_count == 0, 1);
        assert!(total_accesses == 0, 2);
        assert!(log_count == 0, 3);
    }

    #[test(aptos_framework = @0x1)]
    fun test_ai_model_registry(aptos_framework: &signer) {
        setup_test_env(aptos_framework);
        let (admin, creator, _buyer, _user1, _user2) = create_test_accounts(aptos_framework);

        ai_model_registry::initialize_registry(&admin);

        // Register AI model
        ai_model_registry::register_model(
            &creator,
            string::utf8(b"ImageClassifier-v1"),
            string::utf8(b"CNN for image classification"),
            5, // COMPUTER_VISION
            string::utf8(b"ipfs://QmModel"),
            string::utf8(b"PyTorch"),
            string::utf8(b"1.0.0"),
            10000000, // 10M parameters
            true, // public
        );

        let (total_models, total_inferences, _log_count) =
            ai_model_registry::get_registry_stats();
        assert!(total_models == 1, 1);
        assert!(total_inferences == 0, 2);
    }

    #[test(aptos_framework = @0x1)]
    fun test_model_data_attribution(aptos_framework: &signer) {
        setup_test_env(aptos_framework);
        let (admin, creator, _buyer, _user1, _user2) = create_test_accounts(aptos_framework);

        ai_model_registry::initialize_registry(&admin);

        // Register model
        ai_model_registry::register_model(
            &creator,
            string::utf8(b"TestModel"),
            string::utf8(b"Test model"),
            1, // CLASSIFICATION
            string::utf8(b"ipfs://model"),
            string::utf8(b"TensorFlow"),
            string::utf8(b"1.0"),
            1000000,
            true,
        );

        // Add data source
        ai_model_registry::add_data_source(
            &creator,
            1, // model_id
            @0xDATASET1,
            string::utf8(b"ImageNet"),
            5000, // 50% contribution
            CREATOR_ADDR,
        );

        let source_count = ai_model_registry::get_data_sources(1);
        assert!(source_count == 1, 1);
    }

    #[test(aptos_framework = @0x1)]
    fun test_model_metrics_update(aptos_framework: &signer) {
        setup_test_env(aptos_framework);
        let (admin, creator, _buyer, _user1, _user2) = create_test_accounts(aptos_framework);

        ai_model_registry::initialize_registry(&admin);

        ai_model_registry::register_model(
            &creator,
            string::utf8(b"TestModel"),
            string::utf8(b"Test"),
            1,
            string::utf8(b"ipfs://model"),
            string::utf8(b"PyTorch"),
            string::utf8(b"1.0"),
            100000,
            true,
        );

        // Update metrics
        ai_model_registry::update_metrics(
            &creator,
            1,
            9500,  // 95% accuracy
            9200,  // 92% precision
            9400,  // 94% recall
            9300,  // 93% F1
            string::utf8(b"AUC"),
            9600,  // 96% AUC
        );

        let (accuracy, precision, recall, f1) = ai_model_registry::get_metrics(1);
        assert!(accuracy == 9500, 1);
        assert!(precision == 9200, 2);
        assert!(recall == 9400, 3);
        assert!(f1 == 9300, 4);
    }
}
