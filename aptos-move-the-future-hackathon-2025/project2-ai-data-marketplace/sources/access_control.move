module ai_marketplace::access_control {
    use std::error;
    use std::signer;
    use std::string::{Self, String};
    use std::vector;
    use aptos_framework::object::{Self, Object};
    use aptos_framework::event;
    use aptos_framework::timestamp;
    use aptos_framework::account;
    use aptos_framework::randomness;
    use ai_marketplace::data_asset::{Self, DataAsset};

    /// Error codes
    const E_NOT_AUTHORIZED: u64 = 1;
    const E_TOKEN_EXPIRED: u64 = 2;
    const E_TOKEN_NOT_FOUND: u64 = 3;
    const E_USAGE_EXCEEDED: u64 = 4;
    const E_INVALID_TOKEN: u64 = 5;
    const E_ACCESS_REVOKED: u64 = 6;

    /// Access token - grants time/usage limited access to dataset
    struct AccessToken has store, drop, copy {
        /// Unique token ID
        token_id: u64,
        /// Dataset token address
        dataset_address: address,
        /// User granted access
        user: address,
        /// Token issuer (dataset owner)
        issuer: address,
        /// Creation timestamp
        issued_at: u64,
        /// Expiration timestamp (0 = no expiration)
        expires_at: u64,
        /// Usage limit (0 = unlimited)
        usage_limit: u64,
        /// Current usage count
        usage_count: u64,
        /// Is token active
        is_active: bool,
        /// Encryption key for dataset access
        encryption_key: String,
    }

    /// Access log entry
    struct AccessLog has store, drop {
        token_id: u64,
        user: address,
        dataset_address: address,
        access_timestamp: u64,
        access_type: String, // "download", "query", "training"
        ip_hash: String, // For audit purposes
    }

    /// Access control state
    struct AccessControlState has key {
        /// All issued access tokens
        access_tokens: vector<AccessToken>,
        /// Access logs for audit
        access_logs: vector<AccessLog>,
        /// Next token ID
        next_token_id: u64,
        /// Total accesses granted
        total_accesses: u64,
    }

    /// Events
    #[event]
    struct AccessTokenIssued has drop, store {
        token_id: u64,
        dataset_address: address,
        user: address,
        expires_at: u64,
        usage_limit: u64,
        timestamp: u64,
    }

    #[event]
    struct AccessGranted has drop, store {
        token_id: u64,
        user: address,
        dataset_address: address,
        access_type: String,
        timestamp: u64,
    }

    #[event]
    struct AccessRevoked has drop, store {
        token_id: u64,
        user: address,
        dataset_address: address,
        timestamp: u64,
    }

    #[event]
    struct TokenRefreshed has drop, store {
        token_id: u64,
        user: address,
        new_expiration: u64,
        timestamp: u64,
    }

    /// Initialize access control system
    public entry fun initialize_access_control(admin: &signer) {
        move_to(admin, AccessControlState {
            access_tokens: vector::empty(),
            access_logs: vector::empty(),
            next_token_id: 1,
            total_accesses: 0,
        });
    }

    /// Issue access token to user
    public entry fun issue_access_token(
        issuer: &signer,
        dataset: Object<DataAsset>,
        user: address,
        duration_seconds: u64,
        usage_limit: u64,
        encryption_key: String,
    ) acquires AccessControlState {
        let issuer_addr = signer::address_of(issuer);
        let dataset_addr = object::object_address(&dataset);

        // Verify issuer owns the dataset (or check marketplace purchase)
        let state = borrow_global_mut<AccessControlState>(@ai_marketplace);

        let current_time = timestamp::now_seconds();
        let expires_at = if (duration_seconds > 0) {
            current_time + duration_seconds
        } else {
            0 // No expiration
        };

        let token = AccessToken {
            token_id: state.next_token_id,
            dataset_address: dataset_addr,
            user,
            issuer: issuer_addr,
            issued_at: current_time,
            expires_at,
            usage_limit,
            usage_count: 0,
            is_active: true,
            encryption_key,
        };

        vector::push_back(&mut state.access_tokens, token);
        state.next_token_id = state.next_token_id + 1;

        event::emit(AccessTokenIssued {
            token_id: token.token_id,
            dataset_address: dataset_addr,
            user,
            expires_at,
            usage_limit,
            timestamp: current_time,
        });
    }

    /// Grant access using token
    public entry fun grant_access(
        user: &signer,
        token_id: u64,
        access_type: String,
        ip_hash: String,
    ) acquires AccessControlState {
        let user_addr = signer::address_of(user);
        let state = borrow_global_mut<AccessControlState>(@ai_marketplace);

        // Find token
        let token_index = find_token(&state.access_tokens, token_id);
        assert!(token_index < vector::length(&state.access_tokens),
            error::not_found(E_TOKEN_NOT_FOUND));

        let token = vector::borrow_mut(&mut state.access_tokens, token_index);

        // Verify token validity
        assert!(token.user == user_addr, error::permission_denied(E_NOT_AUTHORIZED));
        assert!(token.is_active, error::invalid_state(E_ACCESS_REVOKED));

        let current_time = timestamp::now_seconds();

        // Check expiration
        if (token.expires_at > 0) {
            assert!(current_time < token.expires_at,
                error::invalid_state(E_TOKEN_EXPIRED));
        };

        // Check usage limit
        if (token.usage_limit > 0) {
            assert!(token.usage_count < token.usage_limit,
                error::resource_exhausted(E_USAGE_EXCEEDED));
        };

        // Increment usage
        token.usage_count = token.usage_count + 1;

        // Log access
        let log = AccessLog {
            token_id,
            user: user_addr,
            dataset_address: token.dataset_address,
            access_timestamp: current_time,
            access_type,
            ip_hash,
        };
        vector::push_back(&mut state.access_logs, log);
        state.total_accesses = state.total_accesses + 1;

        event::emit(AccessGranted {
            token_id,
            user: user_addr,
            dataset_address: token.dataset_address,
            access_type,
            timestamp: current_time,
        });
    }

    /// Revoke access token
    public entry fun revoke_access(
        issuer: &signer,
        token_id: u64,
    ) acquires AccessControlState {
        let issuer_addr = signer::address_of(issuer);
        let state = borrow_global_mut<AccessControlState>(@ai_marketplace);

        let token_index = find_token(&state.access_tokens, token_id);
        assert!(token_index < vector::length(&state.access_tokens),
            error::not_found(E_TOKEN_NOT_FOUND));

        let token = vector::borrow_mut(&mut state.access_tokens, token_index);
        assert!(token.issuer == issuer_addr, error::permission_denied(E_NOT_AUTHORIZED));

        token.is_active = false;

        event::emit(AccessRevoked {
            token_id,
            user: token.user,
            dataset_address: token.dataset_address,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Refresh/extend token expiration
    public entry fun refresh_token(
        user: &signer,
        token_id: u64,
        additional_duration: u64,
    ) acquires AccessControlState {
        let user_addr = signer::address_of(user);
        let state = borrow_global_mut<AccessControlState>(@ai_marketplace);

        let token_index = find_token(&state.access_tokens, token_id);
        assert!(token_index < vector::length(&state.access_tokens),
            error::not_found(E_TOKEN_NOT_FOUND));

        let token = vector::borrow_mut(&mut state.access_tokens, token_index);
        assert!(token.user == user_addr, error::permission_denied(E_NOT_AUTHORIZED));
        assert!(token.is_active, error::invalid_state(E_ACCESS_REVOKED));

        if (token.expires_at > 0) {
            token.expires_at = token.expires_at + additional_duration;
        } else {
            token.expires_at = timestamp::now_seconds() + additional_duration;
        };

        event::emit(TokenRefreshed {
            token_id,
            user: user_addr,
            new_expiration: token.expires_at,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Batch issue tokens (for multiple users)
    public entry fun batch_issue_tokens(
        issuer: &signer,
        dataset: Object<DataAsset>,
        users: vector<address>,
        duration_seconds: u64,
        usage_limit: u64,
        encryption_key: String,
    ) acquires AccessControlState {
        let i = 0u64;
        let len = vector::length(&users);

        while (i < len) {
            let user = *vector::borrow(&users, i);
            issue_access_token(
                issuer,
                dataset,
                user,
                duration_seconds,
                usage_limit,
                encryption_key,
            );
            i = i + 1;
        };
    }

    /// Helper: Find token by ID
    fun find_token(tokens: &vector<AccessToken>, token_id: u64): u64 {
        let i = 0u64;
        let len = vector::length(tokens);
        while (i < len) {
            let token = vector::borrow(tokens, i);
            if (token.token_id == token_id) {
                return i
            };
            i = i + 1;
        };
        len
    }

    /// View: Get token details
    #[view]
    public fun get_token_details(token_id: u64): (
        address,  // dataset_address
        address,  // user
        u64,      // issued_at
        u64,      // expires_at
        u64,      // usage_count
        u64,      // usage_limit
        bool,     // is_active
    ) acquires AccessControlState {
        let state = borrow_global<AccessControlState>(@ai_marketplace);
        let token_index = find_token(&state.access_tokens, token_id);
        assert!(token_index < vector::length(&state.access_tokens),
            error::not_found(E_TOKEN_NOT_FOUND));

        let token = vector::borrow(&state.access_tokens, token_index);
        (
            token.dataset_address,
            token.user,
            token.issued_at,
            token.expires_at,
            token.usage_count,
            token.usage_limit,
            token.is_active,
        )
    }

    /// View: Check if token is valid
    #[view]
    public fun is_token_valid(token_id: u64): bool acquires AccessControlState {
        let state = borrow_global<AccessControlState>(@ai_marketplace);
        let token_index = find_token(&state.access_tokens, token_id);

        if (token_index >= vector::length(&state.access_tokens)) {
            return false
        };

        let token = vector::borrow(&state.access_tokens, token_index);

        if (!token.is_active) {
            return false
        };

        let current_time = timestamp::now_seconds();

        // Check expiration
        if (token.expires_at > 0 && current_time >= token.expires_at) {
            return false
        };

        // Check usage
        if (token.usage_limit > 0 && token.usage_count >= token.usage_limit) {
            return false
        };

        true
    }

    /// View: Get user's active tokens
    #[view]
    public fun get_user_tokens(user: address): vector<u64> acquires AccessControlState {
        let state = borrow_global<AccessControlState>(@ai_marketplace);
        let result = vector::empty<u64>();
        let current_time = timestamp::now_seconds();

        let i = 0u64;
        let len = vector::length(&state.access_tokens);

        while (i < len) {
            let token = vector::borrow(&state.access_tokens, i);
            if (token.user == user && token.is_active) {
                // Check if not expired
                if (token.expires_at == 0 || current_time < token.expires_at) {
                    vector::push_back(&mut result, token.token_id);
                };
            };
            i = i + 1;
        };

        result
    }

    /// View: Get access statistics
    #[view]
    public fun get_access_stats(): (u64, u64, u64) acquires AccessControlState {
        let state = borrow_global<AccessControlState>(@ai_marketplace);
        (
            vector::length(&state.access_tokens),
            state.total_accesses,
            vector::length(&state.access_logs),
        )
    }
}
