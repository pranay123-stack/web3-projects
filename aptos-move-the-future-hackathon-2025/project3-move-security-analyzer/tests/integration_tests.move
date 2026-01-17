#[test_only]
module security_analyzer::integration_tests {
    use std::string;
    use std::signer;
    use aptos_framework::account;
    use aptos_framework::timestamp;
    use security_analyzer::security_scanner;
    use security_analyzer::vulnerability_db;

    // Test addresses
    const ADMIN_ADDR: address = @security_analyzer;
    const AUDITOR1_ADDR: address = @0x1111;
    const AUDITOR2_ADDR: address = @0x2222;
    const USER_ADDR: address = @0x3333;
    const CONTRACT_ADDR: address = @0x4444;

    /// Initialize test environment
    fun setup_test_env(aptos_framework: &signer) {
        timestamp::set_time_has_started_for_testing(aptos_framework);
    }

    /// Create test accounts
    fun create_test_accounts(aptos_framework: &signer): (signer, signer, signer, signer) {
        let admin = account::create_account_for_test(ADMIN_ADDR);
        let auditor1 = account::create_account_for_test(AUDITOR1_ADDR);
        let auditor2 = account::create_account_for_test(AUDITOR2_ADDR);
        let user = account::create_account_for_test(USER_ADDR);

        (admin, auditor1, auditor2, user)
    }

    #[test(aptos_framework = @0x1)]
    fun test_scanner_initialization(aptos_framework: &signer) {
        setup_test_env(aptos_framework);
        let (admin, _auditor1, _auditor2, _user) = create_test_accounts(aptos_framework);

        security_scanner::initialize_scanner(&admin);

        let (total_scans, total_vulns, scan_count, auditor_count) =
            security_scanner::get_scanner_stats();

        assert!(total_scans == 0, 1);
        assert!(total_vulns == 0, 2);
        assert!(scan_count == 0, 3);
        assert!(auditor_count == 0, 4);
    }

    #[test(aptos_framework = @0x1)]
    fun test_auditor_registration(aptos_framework: &signer) {
        setup_test_env(aptos_framework);
        let (admin, auditor1, _auditor2, _user) = create_test_accounts(aptos_framework);

        security_scanner::initialize_scanner(&admin);

        security_scanner::register_auditor(
            &auditor1,
            string::utf8(b"CertiK Auditor"),
        );

        let (name, scans_completed, vulns_found, reputation, is_active) =
            security_scanner::get_auditor_details(AUDITOR1_ADDR);

        assert!(name == string::utf8(b"CertiK Auditor"), 1);
        assert!(scans_completed == 0, 2);
        assert!(vulns_found == 0, 3);
        assert!(reputation == 100, 4);
        assert!(is_active == true, 5);
    }

    #[test(aptos_framework = @0x1)]
    fun test_request_scan(aptos_framework: &signer) {
        setup_test_env(aptos_framework);
        let (admin, _auditor1, _auditor2, user) = create_test_accounts(aptos_framework);

        security_scanner::initialize_scanner(&admin);

        security_scanner::request_scan(&user, CONTRACT_ADDR);

        let (contract_addr, requester, status, critical, high, medium, low, score) =
            security_scanner::get_scan_details(1);

        assert!(contract_addr == CONTRACT_ADDR, 1);
        assert!(requester == USER_ADDR, 2);
        assert!(status == 1, 3); // STATUS_PENDING
        assert!(critical == 0, 4);
        assert!(high == 0, 5);
        assert!(medium == 0, 6);
        assert!(low == 0, 7);
        assert!(score == 0, 8);
    }

    #[test(aptos_framework = @0x1)]
    fun test_report_vulnerability(aptos_framework: &signer) {
        setup_test_env(aptos_framework);
        let (admin, auditor1, _auditor2, user) = create_test_accounts(aptos_framework);

        security_scanner::initialize_scanner(&admin);

        security_scanner::register_auditor(
            &auditor1,
            string::utf8(b"Security Expert"),
        );

        security_scanner::request_scan(&user, CONTRACT_ADDR);

        // Report a critical vulnerability
        security_scanner::report_vulnerability(
            &auditor1,
            1, // scan_id
            2, // category: ACCESS_CONTROL
            1, // severity: CRITICAL
            string::utf8(b"token_module"),
            string::utf8(b"transfer"),
            42,
            string::utf8(b"Missing authorization check in transfer function"),
            string::utf8(b"Add signer verification before allowing transfers"),
            95, // confidence
        );

        let (_contract_addr, _requester, status, critical, _high, _medium, _low, _score) =
            security_scanner::get_scan_details(1);

        assert!(status == 2, 1); // STATUS_IN_PROGRESS
        assert!(critical == 1, 2);

        let vuln_count = security_scanner::get_scan_vulnerability_count(1);
        assert!(vuln_count == 1, 3);
    }

    #[test(aptos_framework = @0x1)]
    fun test_complete_scan(aptos_framework: &signer) {
        setup_test_env(aptos_framework);
        let (admin, auditor1, _auditor2, user) = create_test_accounts(aptos_framework);

        security_scanner::initialize_scanner(&admin);

        security_scanner::register_auditor(
            &auditor1,
            string::utf8(b"Auditor Pro"),
        );

        security_scanner::request_scan(&user, CONTRACT_ADDR);

        // Report vulnerabilities
        security_scanner::report_vulnerability(
            &auditor1,
            1,
            2,
            1, // CRITICAL
            string::utf8(b"module1"),
            string::utf8(b"function1"),
            10,
            string::utf8(b"Critical issue"),
            string::utf8(b"Fix this"),
            90,
        );

        security_scanner::report_vulnerability(
            &auditor1,
            1,
            3,
            2, // HIGH
            string::utf8(b"module2"),
            string::utf8(b"function2"),
            20,
            string::utf8(b"High issue"),
            string::utf8(b"Fix that"),
            85,
        );

        // Complete scan
        security_scanner::complete_scan(&auditor1, 1, 50000);

        let (_contract_addr, _requester, status, critical, high, _medium, _low, score) =
            security_scanner::get_scan_details(1);

        assert!(status == 3, 1); // STATUS_COMPLETED
        assert!(critical == 1, 2);
        assert!(high == 1, 3);
        // Score should be 100 - (1*20 + 1*10) = 70
        assert!(score == 70, 4);

        // Check auditor stats updated
        let (_name, scans_completed, vulns_found, _reputation, _is_active) =
            security_scanner::get_auditor_details(AUDITOR1_ADDR);

        assert!(scans_completed == 1, 5);
        assert!(vulns_found == 2, 6);
    }

    #[test(aptos_framework = @0x1)]
    fun test_vulnerability_db_initialization(aptos_framework: &signer) {
        setup_test_env(aptos_framework);
        let (admin, _auditor1, _auditor2, _user) = create_test_accounts(aptos_framework);

        vulnerability_db::initialize_db(&admin);

        let (pattern_count, cve_count) = vulnerability_db::get_db_stats();

        assert!(pattern_count == 0, 1);
        assert!(cve_count == 0, 2);
    }

    #[test(aptos_framework = @0x1)]
    fun test_add_vulnerability_pattern(aptos_framework: &signer) {
        setup_test_env(aptos_framework);
        let (admin, _auditor1, _auditor2, _user) = create_test_accounts(aptos_framework);

        vulnerability_db::initialize_db(&admin);

        vulnerability_db::add_pattern(
            &admin,
            string::utf8(b"Reentrancy Attack"),
            1, // CATEGORY_REENTRANCY
            1, // SEVERITY_CRITICAL
            string::utf8(b"Contract vulnerable to reentrancy attacks"),
            string::utf8(b"external_call_before_state_change"),
            string::utf8(b"Update state before making external calls"),
            string::utf8(b"CWE-841"),
        );

        let (name, category, severity, description, recommendation, detection_count) =
            vulnerability_db::get_pattern_details(1);

        assert!(name == string::utf8(b"Reentrancy Attack"), 1);
        assert!(category == 1, 2);
        assert!(severity == 1, 3);
        assert!(detection_count == 0, 4);
    }

    #[test(aptos_framework = @0x1)]
    fun test_record_pattern_detection(aptos_framework: &signer) {
        setup_test_env(aptos_framework);
        let (admin, auditor1, _auditor2, _user) = create_test_accounts(aptos_framework);

        vulnerability_db::initialize_db(&admin);

        vulnerability_db::add_pattern(
            &admin,
            string::utf8(b"Integer Overflow"),
            3, // CATEGORY_ARITHMETIC
            2, // SEVERITY_HIGH
            string::utf8(b"Potential integer overflow"),
            string::utf8(b"unchecked_arithmetic"),
            string::utf8(b"Use checked arithmetic operations"),
            string::utf8(b"CWE-190"),
        );

        // Record detection
        vulnerability_db::record_detection(&auditor1, 1, CONTRACT_ADDR);

        let (_name, _category, _severity, _description, _recommendation, detection_count) =
            vulnerability_db::get_pattern_details(1);

        assert!(detection_count == 1, 1);
    }

    #[test(aptos_framework = @0x1)]
    fun test_add_cve_entry(aptos_framework: &signer) {
        setup_test_env(aptos_framework);
        let (admin, _auditor1, _auditor2, _user) = create_test_accounts(aptos_framework);

        vulnerability_db::initialize_db(&admin);

        vulnerability_db::add_cve(
            &admin,
            string::utf8(b"CVE-2024-001"),
            string::utf8(b"Move Compiler Vulnerability"),
            string::utf8(b"Critical bug in Move compiler v1.x"),
            1, // SEVERITY_CRITICAL
            string::utf8(b"1.0.0 - 1.5.0"),
            true, // patch_available
            1700000000,
        );

        let (pattern_count, cve_count) = vulnerability_db::get_db_stats();

        assert!(pattern_count == 0, 1);
        assert!(cve_count == 1, 2);
    }

    #[test(aptos_framework = @0x1)]
    fun test_end_to_end_workflow(aptos_framework: &signer) {
        setup_test_env(aptos_framework);
        let (admin, auditor1, _auditor2, user) = create_test_accounts(aptos_framework);

        // 1. Initialize systems
        security_scanner::initialize_scanner(&admin);
        vulnerability_db::initialize_db(&admin);

        // 2. Add vulnerability patterns
        vulnerability_db::add_pattern(
            &admin,
            string::utf8(b"Missing Access Control"),
            2, // ACCESS_CONTROL
            1, // CRITICAL
            string::utf8(b"Function missing authorization check"),
            string::utf8(b"public_function_without_auth"),
            string::utf8(b"Add signer verification"),
            string::utf8(b"CWE-284"),
        );

        // 3. Register auditor
        security_scanner::register_auditor(
            &auditor1,
            string::utf8(b"Elite Security Auditor"),
        );

        // 4. User requests scan
        security_scanner::request_scan(&user, CONTRACT_ADDR);

        // 5. Auditor reports vulnerabilities
        security_scanner::report_vulnerability(
            &auditor1,
            1,
            2, // ACCESS_CONTROL
            1, // CRITICAL
            string::utf8(b"defi_module"),
            string::utf8(b"withdraw"),
            100,
            string::utf8(b"Withdraw function lacks authorization"),
            string::utf8(b"Add assert!(signer::address_of(account) == owner)"),
            98,
        );

        vulnerability_db::record_detection(&auditor1, 1, CONTRACT_ADDR);

        security_scanner::report_vulnerability(
            &auditor1,
            1,
            3, // ARITHMETIC
            3, // MEDIUM
            string::utf8(b"defi_module"),
            string::utf8(b"calculate_interest"),
            150,
            string::utf8(b"Potential precision loss in division"),
            string::utf8(b"Multiply before dividing"),
            80,
        );

        // 6. Complete scan
        security_scanner::complete_scan(&auditor1, 1, 75000);

        // 7. Verify results
        let (_contract_addr, _requester, status, critical, _high, medium, _low, score) =
            security_scanner::get_scan_details(1);

        assert!(status == 3, 1); // COMPLETED
        assert!(critical == 1, 2);
        assert!(medium == 1, 3);
        // Score: 100 - (1*20 + 1*5) = 75
        assert!(score == 75, 4);

        let vuln_count = security_scanner::get_scan_vulnerability_count(1);
        assert!(vuln_count == 2, 5);

        // Verify auditor reputation increased
        let (_name, scans_completed, vulns_found, reputation, _is_active) =
            security_scanner::get_auditor_details(AUDITOR1_ADDR);

        assert!(scans_completed == 1, 6);
        assert!(vulns_found == 2, 7);
        assert!(reputation == 110, 8); // Started at 100, +10 for completing scan
    }
}
