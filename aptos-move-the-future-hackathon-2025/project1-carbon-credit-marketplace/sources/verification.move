module carbon_marketplace::verification {
    use std::error;
    use std::signer;
    use std::string::{Self, String};
    use std::vector;
    use aptos_framework::object::Object;
    use aptos_framework::event;
    use aptos_framework::timestamp;
    use carbon_marketplace::carbon_credit_nft::CarbonCredit;

    /// Error codes
    const E_NOT_AUTHORIZED: u64 = 1;
    const E_VERIFIER_EXISTS: u64 = 2;
    const E_VERIFIER_NOT_FOUND: u64 = 3;
    const E_PROJECT_NOT_VERIFIED: u64 = 4;
    const E_INVALID_PROJECT_DATA: u64 = 5;
    const E_VERIFICATION_SYSTEM_NOT_INITIALIZED: u64 = 6;

    /// Verification status
    const STATUS_PENDING: u8 = 0;
    const STATUS_VERIFIED: u8 = 1;
    const STATUS_REJECTED: u8 = 2;
    const STATUS_SUSPENDED: u8 = 3;

    /// Authorized verifier entity
    struct Verifier has store, drop, copy {
        /// Verifier address
        address: address,
        /// Verifier organization name (e.g., "Verra", "Gold Standard")
        organization: String,
        /// Is this verifier currently active
        is_active: bool,
        /// Number of projects verified
        verified_count: u64,
        /// Timestamp when authorized
        authorized_at: u64,
    }

    /// Carbon offset project registry
    struct Project has store, drop {
        /// Unique project ID
        project_id: String,
        /// Project name
        name: String,
        /// Project developer/owner
        developer: address,
        /// Verification standard (Verra VCS, Gold Standard, etc.)
        standard: String,
        /// Project location
        location: String,
        /// Project type
        project_type: String,
        /// Total credits approved for this project
        total_credits_approved: u64,
        /// Credits already issued
        credits_issued: u64,
        /// Verification status
        status: u8,
        /// Verifier who approved this project
        verified_by: address,
        /// Verification timestamp
        verified_at: u64,
        /// Additional metadata URI (IPFS, Arweave, etc.)
        metadata_uri: String,
    }

    /// Global verification system state
    struct VerificationSystem has key {
        /// Admin who can add/remove verifiers
        admin: address,
        /// List of authorized verifiers
        verifiers: vector<Verifier>,
        /// Registry of all carbon offset projects
        projects: vector<Project>,
        /// Total verified projects
        total_verified_projects: u64,
    }

    /// Events
    #[event]
    struct VerifierAdded has drop, store {
        verifier_address: address,
        organization: String,
        timestamp: u64,
    }

    #[event]
    struct VerifierRemoved has drop, store {
        verifier_address: address,
        organization: String,
        timestamp: u64,
    }

    #[event]
    struct ProjectSubmitted has drop, store {
        project_id: String,
        developer: address,
        project_type: String,
        timestamp: u64,
    }

    #[event]
    struct ProjectVerified has drop, store {
        project_id: String,
        verifier: address,
        total_credits_approved: u64,
        timestamp: u64,
    }

    #[event]
    struct ProjectRejected has drop, store {
        project_id: String,
        verifier: address,
        timestamp: u64,
    }

    #[event]
    struct CreditsIssued has drop, store {
        project_id: String,
        amount: u64,
        total_issued: u64,
        timestamp: u64,
    }

    /// Initialize the verification system
    public entry fun initialize_verification_system(admin: &signer) {
        let admin_addr = signer::address_of(admin);

        move_to(admin, VerificationSystem {
            admin: admin_addr,
            verifiers: vector::empty(),
            projects: vector::empty(),
            total_verified_projects: 0,
        });
    }

    /// Add an authorized verifier (only admin)
    public entry fun add_verifier(
        admin: &signer,
        verifier_address: address,
        organization: String,
    ) acquires VerificationSystem {
        let admin_addr = signer::address_of(admin);
        let system = borrow_global_mut<VerificationSystem>(@carbon_marketplace);

        // Verify admin permission
        assert!(system.admin == admin_addr, error::permission_denied(E_NOT_AUTHORIZED));

        // Check if verifier already exists
        let verifiers = &system.verifiers;
        let i = 0;
        let len = vector::length(verifiers);
        while (i < len) {
            let v = vector::borrow(verifiers, i);
            assert!(v.address != verifier_address, error::already_exists(E_VERIFIER_EXISTS));
            i = i + 1;
        };

        // Add new verifier
        let verifier = Verifier {
            address: verifier_address,
            organization,
            is_active: true,
            verified_count: 0,
            authorized_at: timestamp::now_seconds(),
        };

        vector::push_back(&mut system.verifiers, verifier);

        // Emit event
        event::emit(VerifierAdded {
            verifier_address,
            organization,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Remove a verifier (only admin)
    public entry fun remove_verifier(
        admin: &signer,
        verifier_address: address,
    ) acquires VerificationSystem {
        let admin_addr = signer::address_of(admin);
        let system = borrow_global_mut<VerificationSystem>(@carbon_marketplace);

        // Verify admin permission
        assert!(system.admin == admin_addr, error::permission_denied(E_NOT_AUTHORIZED));

        // Find and remove verifier
        let verifiers = &mut system.verifiers;
        let i = 0;
        let len = vector::length(verifiers);
        let found = false;
        let org = string::utf8(b"");

        while (i < len) {
            let v = vector::borrow(verifiers, i);
            if (v.address == verifier_address) {
                org = v.organization;
                found = true;
                break
            };
            i = i + 1;
        };

        assert!(found, error::not_found(E_VERIFIER_NOT_FOUND));
        vector::remove(verifiers, i);

        // Emit event
        event::emit(VerifierRemoved {
            verifier_address,
            organization: org,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Submit a new carbon offset project for verification
    public entry fun submit_project(
        developer: &signer,
        project_id: String,
        name: String,
        standard: String,
        location: String,
        project_type: String,
        total_credits_requested: u64,
        metadata_uri: String,
    ) acquires VerificationSystem {
        let developer_addr = signer::address_of(developer);
        let system = borrow_global_mut<VerificationSystem>(@carbon_marketplace);

        // Validate project data
        assert!(string::length(&project_id) > 0, error::invalid_argument(E_INVALID_PROJECT_DATA));
        assert!(total_credits_requested > 0, error::invalid_argument(E_INVALID_PROJECT_DATA));

        // Create pending project
        let project = Project {
            project_id,
            name,
            developer: developer_addr,
            standard,
            location,
            project_type,
            total_credits_approved: total_credits_requested,
            credits_issued: 0,
            status: STATUS_PENDING,
            verified_by: @0x0,
            verified_at: 0,
            metadata_uri,
        };

        vector::push_back(&mut system.projects, project);

        // Emit event
        event::emit(ProjectSubmitted {
            project_id,
            developer: developer_addr,
            project_type,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Verify a carbon offset project (only authorized verifiers)
    public entry fun verify_project(
        verifier: &signer,
        project_index: u64,
        approved_credits: u64,
    ) acquires VerificationSystem {
        let verifier_addr = signer::address_of(verifier);
        let system = borrow_global_mut<VerificationSystem>(@carbon_marketplace);

        // Check if caller is authorized verifier
        let is_authorized = is_authorized_verifier(&system.verifiers, verifier_addr);
        assert!(is_authorized, error::permission_denied(E_NOT_AUTHORIZED));

        // Get project
        assert!(project_index < vector::length(&system.projects), error::not_found(E_PROJECT_NOT_VERIFIED));
        let project = vector::borrow_mut(&mut system.projects, project_index);

        // Update project verification
        project.status = STATUS_VERIFIED;
        project.total_credits_approved = approved_credits;
        project.verified_by = verifier_addr;
        project.verified_at = timestamp::now_seconds();

        // Update verifier stats
        increment_verifier_count(&mut system.verifiers, verifier_addr);

        // Update system stats
        system.total_verified_projects = system.total_verified_projects + 1;

        // Emit event
        event::emit(ProjectVerified {
            project_id: project.project_id,
            verifier: verifier_addr,
            total_credits_approved: approved_credits,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Reject a carbon offset project
    public entry fun reject_project(
        verifier: &signer,
        project_index: u64,
    ) acquires VerificationSystem {
        let verifier_addr = signer::address_of(verifier);
        let system = borrow_global_mut<VerificationSystem>(@carbon_marketplace);

        // Check if caller is authorized verifier
        let is_authorized = is_authorized_verifier(&system.verifiers, verifier_addr);
        assert!(is_authorized, error::permission_denied(E_NOT_AUTHORIZED));

        // Get project
        assert!(project_index < vector::length(&system.projects), error::not_found(E_PROJECT_NOT_VERIFIED));
        let project = vector::borrow_mut(&mut system.projects, project_index);

        // Update project status
        project.status = STATUS_REJECTED;
        project.verified_by = verifier_addr;
        project.verified_at = timestamp::now_seconds();

        // Emit event
        event::emit(ProjectRejected {
            project_id: project.project_id,
            verifier: verifier_addr,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Record credits issued for a project
    public entry fun record_credits_issued(
        issuer: &signer,
        project_index: u64,
        amount: u64,
    ) acquires VerificationSystem {
        let system = borrow_global_mut<VerificationSystem>(@carbon_marketplace);

        // Get project
        assert!(project_index < vector::length(&system.projects), error::not_found(E_PROJECT_NOT_VERIFIED));
        let project = vector::borrow_mut(&mut system.projects, project_index);

        // Verify project is verified
        assert!(project.status == STATUS_VERIFIED, error::invalid_state(E_PROJECT_NOT_VERIFIED));

        // Update issued credits
        project.credits_issued = project.credits_issued + amount;

        // Emit event
        event::emit(CreditsIssued {
            project_id: project.project_id,
            amount,
            total_issued: project.credits_issued,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Helper: Check if address is authorized verifier
    fun is_authorized_verifier(verifiers: &vector<Verifier>, addr: address): bool {
        let i = 0;
        let len = vector::length(verifiers);
        while (i < len) {
            let v = vector::borrow(verifiers, i);
            if (v.address == addr && v.is_active) {
                return true
            };
            i = i + 1;
        };
        false
    }

    /// Helper: Increment verifier's verified count
    fun increment_verifier_count(verifiers: &mut vector<Verifier>, addr: address) {
        let i = 0;
        let len = vector::length(verifiers);
        while (i < len) {
            let v = vector::borrow_mut(verifiers, i);
            if (v.address == addr) {
                v.verified_count = v.verified_count + 1;
                break
            };
            i = i + 1;
        };
    }

    /// View: Get project details
    #[view]
    public fun get_project(project_index: u64): (String, String, address, u8, u64, u64) acquires VerificationSystem {
        let system = borrow_global<VerificationSystem>(@carbon_marketplace);
        assert!(project_index < vector::length(&system.projects), error::not_found(E_PROJECT_NOT_VERIFIED));

        let project = vector::borrow(&system.projects, project_index);
        (
            project.project_id,
            project.name,
            project.developer,
            project.status,
            project.total_credits_approved,
            project.credits_issued
        )
    }

    /// View: Get verification system stats
    #[view]
    public fun get_system_stats(): (u64, u64, u64) acquires VerificationSystem {
        let system = borrow_global<VerificationSystem>(@carbon_marketplace);
        (
            vector::length(&system.verifiers),
            vector::length(&system.projects),
            system.total_verified_projects
        )
    }

    /// View: Check if address is verifier
    #[view]
    public fun is_verifier(addr: address): bool acquires VerificationSystem {
        let system = borrow_global<VerificationSystem>(@carbon_marketplace);
        is_authorized_verifier(&system.verifiers, addr)
    }
}
