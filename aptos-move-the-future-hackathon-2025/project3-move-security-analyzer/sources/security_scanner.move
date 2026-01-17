module security_analyzer::security_scanner {
    use std::error;
    use std::signer;
    use std::string::{Self, String};
    use std::vector;
    use aptos_framework::event;
    use aptos_framework::timestamp;

    /// Error codes
    const E_NOT_AUTHORIZED: u64 = 1;
    const E_SCAN_NOT_FOUND: u64 = 2;
    const E_INVALID_SEVERITY: u64 = 3;
    const E_ALREADY_AUDITOR: u64 = 4;
    const E_NOT_AUDITOR: u64 = 5;

    /// Vulnerability severity levels
    const SEVERITY_CRITICAL: u8 = 1;
    const SEVERITY_HIGH: u8 = 2;
    const SEVERITY_MEDIUM: u8 = 3;
    const SEVERITY_LOW: u8 = 4;
    const SEVERITY_INFO: u8 = 5;

    /// Vulnerability categories
    const CATEGORY_REENTRANCY: u8 = 1;
    const CATEGORY_ACCESS_CONTROL: u8 = 2;
    const CATEGORY_ARITHMETIC: u8 = 3;
    const CATEGORY_RESOURCE_LEAK: u8 = 4;
    const CATEGORY_TYPE_CONFUSION: u8 = 5;
    const CATEGORY_TIMESTAMP: u8 = 6;
    const CATEGORY_GAS_OPTIMIZATION: u8 = 7;

    /// Scan status
    const STATUS_PENDING: u8 = 1;
    const STATUS_IN_PROGRESS: u8 = 2;
    const STATUS_COMPLETED: u8 = 3;
    const STATUS_FAILED: u8 = 4;

    /// Vulnerability finding
    struct Vulnerability has store, drop, copy {
        /// Vulnerability ID
        vuln_id: u64,
        /// Category
        category: u8,
        /// Severity level
        severity: u8,
        /// Module name
        module_name: String,
        /// Function name
        function_name: String,
        /// Line number (if available)
        line_number: u64,
        /// Description
        description: String,
        /// Recommendation
        recommendation: String,
        /// Confidence level (0-100)
        confidence: u8,
        /// Discovered timestamp
        discovered_at: u64,
    }

    /// Security scan result
    struct SecurityScan has store, drop, copy {
        /// Unique scan ID
        scan_id: u64,
        /// Contract address being scanned
        contract_address: address,
        /// Requester address
        requester: address,
        /// Scan status
        status: u8,
        /// Vulnerabilities found
        vulnerabilities: vector<Vulnerability>,
        /// Total critical count
        critical_count: u64,
        /// Total high count
        high_count: u64,
        /// Total medium count
        medium_count: u64,
        /// Total low count
        low_count: u64,
        /// Total info count
        info_count: u64,
        /// Overall security score (0-100)
        security_score: u8,
        /// Scan started timestamp
        started_at: u64,
        /// Scan completed timestamp
        completed_at: u64,
        /// Gas cost estimation
        estimated_gas: u64,
    }

    /// Auditor profile
    struct Auditor has store, drop, copy {
        auditor_address: address,
        name: String,
        scans_completed: u64,
        vulnerabilities_found: u64,
        reputation_score: u64,
        is_active: bool,
        registered_at: u64,
    }

    /// Scanner state
    struct ScannerState has key {
        /// All security scans
        scans: vector<SecurityScan>,
        /// Registered auditors
        auditors: vector<Auditor>,
        /// Next scan ID
        next_scan_id: u64,
        /// Next vulnerability ID
        next_vuln_id: u64,
        /// Total scans completed
        total_scans: u64,
        /// Total vulnerabilities found
        total_vulnerabilities: u64,
        /// Admin address
        admin: address,
    }

    /// Events
    #[event]
    struct ScanRequested has drop, store {
        scan_id: u64,
        contract_address: address,
        requester: address,
        timestamp: u64,
    }

    #[event]
    struct ScanCompleted has drop, store {
        scan_id: u64,
        contract_address: address,
        vulnerabilities_found: u64,
        security_score: u8,
        timestamp: u64,
    }

    #[event]
    struct VulnerabilityFound has drop, store {
        scan_id: u64,
        vuln_id: u64,
        severity: u8,
        category: u8,
        module_name: String,
        timestamp: u64,
    }

    #[event]
    struct AuditorRegistered has drop, store {
        auditor: address,
        name: String,
        timestamp: u64,
    }

    /// Initialize security scanner
    public entry fun initialize_scanner(admin: &signer) {
        let admin_addr = signer::address_of(admin);

        move_to(admin, ScannerState {
            scans: vector::empty(),
            auditors: vector::empty(),
            next_scan_id: 1,
            next_vuln_id: 1,
            total_scans: 0,
            total_vulnerabilities: 0,
            admin: admin_addr,
        });
    }

    /// Register as an auditor
    public entry fun register_auditor(
        auditor: &signer,
        name: String,
    ) acquires ScannerState {
        let auditor_addr = signer::address_of(auditor);
        let state = borrow_global_mut<ScannerState>(@security_analyzer);

        // Check if already registered
        let i = 0u64;
        let len = vector::length(&state.auditors);
        while (i < len) {
            let existing = vector::borrow(&state.auditors, i);
            assert!(existing.auditor_address != auditor_addr, error::already_exists(E_ALREADY_AUDITOR));
            i = i + 1;
        };

        let new_auditor = Auditor {
            auditor_address: auditor_addr,
            name,
            scans_completed: 0,
            vulnerabilities_found: 0,
            reputation_score: 100,
            is_active: true,
            registered_at: timestamp::now_seconds(),
        };

        vector::push_back(&mut state.auditors, new_auditor);

        event::emit(AuditorRegistered {
            auditor: auditor_addr,
            name,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Request a security scan
    public entry fun request_scan(
        requester: &signer,
        contract_address: address,
    ) acquires ScannerState {
        let requester_addr = signer::address_of(requester);
        let state = borrow_global_mut<ScannerState>(@security_analyzer);
        let current_time = timestamp::now_seconds();

        let scan = SecurityScan {
            scan_id: state.next_scan_id,
            contract_address,
            requester: requester_addr,
            status: STATUS_PENDING,
            vulnerabilities: vector::empty(),
            critical_count: 0,
            high_count: 0,
            medium_count: 0,
            low_count: 0,
            info_count: 0,
            security_score: 0,
            started_at: current_time,
            completed_at: 0,
            estimated_gas: 0,
        };

        vector::push_back(&mut state.scans, scan);
        state.next_scan_id = state.next_scan_id + 1;

        event::emit(ScanRequested {
            scan_id: scan.scan_id,
            contract_address,
            requester: requester_addr,
            timestamp: current_time,
        });
    }

    /// Report a vulnerability (auditor only)
    public entry fun report_vulnerability(
        auditor: &signer,
        scan_id: u64,
        category: u8,
        severity: u8,
        module_name: String,
        function_name: String,
        line_number: u64,
        description: String,
        recommendation: String,
        confidence: u8,
    ) acquires ScannerState {
        let auditor_addr = signer::address_of(auditor);
        let state = borrow_global_mut<ScannerState>(@security_analyzer);

        // Verify auditor is registered
        assert!(is_registered_auditor(&state.auditors, auditor_addr),
            error::permission_denied(E_NOT_AUDITOR));

        // Find scan
        let scan_index = find_scan(&state.scans, scan_id);
        assert!(scan_index < vector::length(&state.scans),
            error::not_found(E_SCAN_NOT_FOUND));

        let scan = vector::borrow_mut(&mut state.scans, scan_index);

        // Create vulnerability
        let vuln = Vulnerability {
            vuln_id: state.next_vuln_id,
            category,
            severity,
            module_name,
            function_name,
            line_number,
            description,
            recommendation,
            confidence,
            discovered_at: timestamp::now_seconds(),
        };

        vector::push_back(&mut scan.vulnerabilities, vuln);
        state.next_vuln_id = state.next_vuln_id + 1;
        state.total_vulnerabilities = state.total_vulnerabilities + 1;

        // Update severity counts
        if (severity == SEVERITY_CRITICAL) {
            scan.critical_count = scan.critical_count + 1;
        } else if (severity == SEVERITY_HIGH) {
            scan.high_count = scan.high_count + 1;
        } else if (severity == SEVERITY_MEDIUM) {
            scan.medium_count = scan.medium_count + 1;
        } else if (severity == SEVERITY_LOW) {
            scan.low_count = scan.low_count + 1;
        } else {
            scan.info_count = scan.info_count + 1;
        };

        // Update scan status
        scan.status = STATUS_IN_PROGRESS;

        // Update auditor stats
        let auditor_index = find_auditor(&state.auditors, auditor_addr);
        if (auditor_index < vector::length(&state.auditors)) {
            let auditor_profile = vector::borrow_mut(&mut state.auditors, auditor_index);
            auditor_profile.vulnerabilities_found = auditor_profile.vulnerabilities_found + 1;
        };

        event::emit(VulnerabilityFound {
            scan_id,
            vuln_id: vuln.vuln_id,
            severity,
            category,
            module_name,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Complete a security scan
    public entry fun complete_scan(
        auditor: &signer,
        scan_id: u64,
        estimated_gas: u64,
    ) acquires ScannerState {
        let auditor_addr = signer::address_of(auditor);
        let state = borrow_global_mut<ScannerState>(@security_analyzer);

        // Verify auditor
        assert!(is_registered_auditor(&state.auditors, auditor_addr),
            error::permission_denied(E_NOT_AUDITOR));

        // Find scan
        let scan_index = find_scan(&state.scans, scan_id);
        assert!(scan_index < vector::length(&state.scans),
            error::not_found(E_SCAN_NOT_FOUND));

        let scan = vector::borrow_mut(&mut state.scans, scan_index);

        // Calculate security score
        let score = calculate_security_score(
            scan.critical_count,
            scan.high_count,
            scan.medium_count,
            scan.low_count,
        );

        scan.security_score = score;
        scan.status = STATUS_COMPLETED;
        scan.completed_at = timestamp::now_seconds();
        scan.estimated_gas = estimated_gas;

        state.total_scans = state.total_scans + 1;

        // Update auditor stats
        let auditor_index = find_auditor(&state.auditors, auditor_addr);
        if (auditor_index < vector::length(&state.auditors)) {
            let auditor_profile = vector::borrow_mut(&mut state.auditors, auditor_index);
            auditor_profile.scans_completed = auditor_profile.scans_completed + 1;
            // Increase reputation for completing scans
            if (auditor_profile.reputation_score < 1000) {
                auditor_profile.reputation_score = auditor_profile.reputation_score + 10;
            };
        };

        event::emit(ScanCompleted {
            scan_id,
            contract_address: scan.contract_address,
            vulnerabilities_found: vector::length(&scan.vulnerabilities),
            security_score: score,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Calculate security score based on vulnerability counts
    fun calculate_security_score(
        critical: u64,
        high: u64,
        medium: u64,
        low: u64,
    ): u8 {
        let score = 100u64;

        // Deduct points based on severity
        score = score - (critical * 20);
        score = score - (high * 10);
        score = score - (medium * 5);
        score = score - (low * 2);

        // Cap at 0
        if (score > 100) {
            score = 0;
        };

        (score as u8)
    }

    /// Helper: Find scan by ID
    fun find_scan(scans: &vector<SecurityScan>, scan_id: u64): u64 {
        let i = 0u64;
        let len = vector::length(scans);
        while (i < len) {
            let scan = vector::borrow(scans, i);
            if (scan.scan_id == scan_id) {
                return i
            };
            i = i + 1;
        };
        len
    }

    /// Helper: Find auditor by address
    fun find_auditor(auditors: &vector<Auditor>, auditor_addr: address): u64 {
        let i = 0u64;
        let len = vector::length(auditors);
        while (i < len) {
            let auditor = vector::borrow(auditors, i);
            if (auditor.auditor_address == auditor_addr) {
                return i
            };
            i = i + 1;
        };
        len
    }

    /// Helper: Check if address is registered auditor
    fun is_registered_auditor(auditors: &vector<Auditor>, addr: address): bool {
        let i = 0u64;
        let len = vector::length(auditors);
        while (i < len) {
            let auditor = vector::borrow(auditors, i);
            if (auditor.auditor_address == addr && auditor.is_active) {
                return true
            };
            i = i + 1;
        };
        false
    }

    /// View: Get scan details
    #[view]
    public fun get_scan_details(scan_id: u64): (
        address,  // contract_address
        address,  // requester
        u8,       // status
        u64,      // critical_count
        u64,      // high_count
        u64,      // medium_count
        u64,      // low_count
        u8,       // security_score
    ) acquires ScannerState {
        let state = borrow_global<ScannerState>(@security_analyzer);
        let scan_index = find_scan(&state.scans, scan_id);
        assert!(scan_index < vector::length(&state.scans),
            error::not_found(E_SCAN_NOT_FOUND));

        let scan = vector::borrow(&state.scans, scan_index);
        (
            scan.contract_address,
            scan.requester,
            scan.status,
            scan.critical_count,
            scan.high_count,
            scan.medium_count,
            scan.low_count,
            scan.security_score,
        )
    }

    /// View: Get total vulnerabilities for scan
    #[view]
    public fun get_scan_vulnerability_count(scan_id: u64): u64 acquires ScannerState {
        let state = borrow_global<ScannerState>(@security_analyzer);
        let scan_index = find_scan(&state.scans, scan_id);
        assert!(scan_index < vector::length(&state.scans),
            error::not_found(E_SCAN_NOT_FOUND));

        let scan = vector::borrow(&state.scans, scan_index);
        vector::length(&scan.vulnerabilities)
    }

    /// View: Get auditor details
    #[view]
    public fun get_auditor_details(auditor_addr: address): (
        String,   // name
        u64,      // scans_completed
        u64,      // vulnerabilities_found
        u64,      // reputation_score
        bool,     // is_active
    ) acquires ScannerState {
        let state = borrow_global<ScannerState>(@security_analyzer);
        let auditor_index = find_auditor(&state.auditors, auditor_addr);
        assert!(auditor_index < vector::length(&state.auditors),
            error::not_found(E_NOT_AUDITOR));

        let auditor = vector::borrow(&state.auditors, auditor_index);
        (
            auditor.name,
            auditor.scans_completed,
            auditor.vulnerabilities_found,
            auditor.reputation_score,
            auditor.is_active,
        )
    }

    /// View: Get scanner statistics
    #[view]
    public fun get_scanner_stats(): (u64, u64, u64, u64) acquires ScannerState {
        let state = borrow_global<ScannerState>(@security_analyzer);
        (
            state.total_scans,
            state.total_vulnerabilities,
            vector::length(&state.scans),
            vector::length(&state.auditors),
        )
    }

    /// View: Get scans by requester
    #[view]
    public fun get_requester_scans(requester: address): vector<u64> acquires ScannerState {
        let state = borrow_global<ScannerState>(@security_analyzer);
        let result = vector::empty<u64>();

        let i = 0u64;
        let len = vector::length(&state.scans);

        while (i < len) {
            let scan = vector::borrow(&state.scans, i);
            if (scan.requester == requester) {
                vector::push_back(&mut result, scan.scan_id);
            };
            i = i + 1;
        };

        result
    }
}
