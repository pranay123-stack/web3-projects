module ai_marketplace::ai_model_registry {
    use std::error;
    use std::signer;
    use std::string::{Self, String};
    use std::vector;
    use aptos_framework::event;
    use aptos_framework::timestamp;

    /// Error codes
    const E_NOT_AUTHORIZED: u64 = 1;
    const E_MODEL_NOT_FOUND: u64 = 2;
    const E_INVALID_METRICS: u64 = 3;
    const E_DATASET_NOT_USED: u64 = 4;

    /// AI Model types
    const MODEL_TYPE_CLASSIFICATION: u8 = 1;
    const MODEL_TYPE_REGRESSION: u8 = 2;
    const MODEL_TYPE_GENERATION: u8 = 3;
    const MODEL_TYPE_NLP: u8 = 4;
    const MODEL_TYPE_COMPUTER_VISION: u8 = 5;
    const MODEL_TYPE_MULTIMODAL: u8 = 6;

    /// Training data source
    struct DataSource has store, drop, copy {
        /// Dataset token address
        dataset_address: address,
        /// Dataset name
        dataset_name: String,
        /// Percentage of training data from this source (basis points)
        contribution_percentage: u64,
        /// Dataset owner (for attribution)
        data_owner: address,
    }

    /// Performance metrics
    struct PerformanceMetrics has store, drop, copy {
        /// Accuracy (0-10000 for 0-100.00%)
        accuracy: u64,
        /// Precision
        precision: u64,
        /// Recall
        recall: u64,
        /// F1 score
        f1_score: u64,
        /// Custom metric name
        custom_metric_name: String,
        /// Custom metric value
        custom_metric_value: u64,
    }

    /// Registered AI Model
    struct AIModel has store, drop, copy {
        /// Unique model ID
        model_id: u64,
        /// Model name
        name: String,
        /// Model description
        description: String,
        /// Model type
        model_type: u8,
        /// Model creator/owner
        creator: address,
        /// Training datasets used
        data_sources: vector<DataSource>,
        /// Performance metrics
        metrics: PerformanceMetrics,
        /// Model weights URI (IPFS/Arweave)
        model_uri: String,
        /// Framework used (PyTorch, TensorFlow, etc.)
        framework: String,
        /// Model version
        version: String,
        /// Total parameters
        parameter_count: u64,
        /// Registration timestamp
        registered_at: u64,
        /// Last updated timestamp
        updated_at: u64,
        /// Is model public
        is_public: bool,
        /// Download count
        download_count: u64,
    }

    /// Model usage log
    struct ModelUsage has store, drop {
        model_id: u64,
        user: address,
        usage_type: String, // "inference", "fine-tuning", "evaluation"
        timestamp: u64,
    }

    /// Model registry state
    struct ModelRegistryState has key {
        /// All registered models
        models: vector<AIModel>,
        /// Usage logs
        usage_logs: vector<ModelUsage>,
        /// Next model ID
        next_model_id: u64,
        /// Total models registered
        total_models: u64,
        /// Total inferences run
        total_inferences: u64,
    }

    /// Events
    #[event]
    struct ModelRegistered has drop, store {
        model_id: u64,
        name: String,
        creator: address,
        model_type: u8,
        dataset_count: u64,
        timestamp: u64,
    }

    #[event]
    struct ModelUpdated has drop, store {
        model_id: u64,
        name: String,
        new_version: String,
        timestamp: u64,
    }

    #[event]
    struct ModelUsed has drop, store {
        model_id: u64,
        user: address,
        usage_type: String,
        timestamp: u64,
    }

    #[event]
    struct DataAttributionRecorded has drop, store {
        model_id: u64,
        dataset_address: address,
        data_owner: address,
        contribution_percentage: u64,
        timestamp: u64,
    }

    /// Initialize model registry
    public entry fun initialize_registry(admin: &signer) {
        move_to(admin, ModelRegistryState {
            models: vector::empty(),
            usage_logs: vector::empty(),
            next_model_id: 1,
            total_models: 0,
            total_inferences: 0,
        });
    }

    /// Register new AI model
    public entry fun register_model(
        creator: &signer,
        name: String,
        description: String,
        model_type: u8,
        model_uri: String,
        framework: String,
        version: String,
        parameter_count: u64,
        is_public: bool,
    ) acquires ModelRegistryState {
        let creator_addr = signer::address_of(creator);
        let state = borrow_global_mut<ModelRegistryState>(@ai_marketplace);

        let current_time = timestamp::now_seconds();

        let model = AIModel {
            model_id: state.next_model_id,
            name,
            description,
            model_type,
            creator: creator_addr,
            data_sources: vector::empty(),
            metrics: PerformanceMetrics {
                accuracy: 0,
                precision: 0,
                recall: 0,
                f1_score: 0,
                custom_metric_name: string::utf8(b""),
                custom_metric_value: 0,
            },
            model_uri,
            framework,
            version,
            parameter_count,
            registered_at: current_time,
            updated_at: current_time,
            is_public,
            download_count: 0,
        };

        vector::push_back(&mut state.models, model);
        state.next_model_id = state.next_model_id + 1;
        state.total_models = state.total_models + 1;

        event::emit(ModelRegistered {
            model_id: model.model_id,
            name,
            creator: creator_addr,
            model_type,
            dataset_count: 0,
            timestamp: current_time,
        });
    }

    /// Add training data source to model
    public entry fun add_data_source(
        creator: &signer,
        model_id: u64,
        dataset_address: address,
        dataset_name: String,
        contribution_percentage: u64,
        data_owner: address,
    ) acquires ModelRegistryState {
        let creator_addr = signer::address_of(creator);
        let state = borrow_global_mut<ModelRegistryState>(@ai_marketplace);

        let model_index = find_model(&state.models, model_id);
        assert!(model_index < vector::length(&state.models),
            error::not_found(E_MODEL_NOT_FOUND));

        let model = vector::borrow_mut(&mut state.models, model_index);
        assert!(model.creator == creator_addr, error::permission_denied(E_NOT_AUTHORIZED));

        let source = DataSource {
            dataset_address,
            dataset_name,
            contribution_percentage,
            data_owner,
        };

        vector::push_back(&mut model.data_sources, source);
        model.updated_at = timestamp::now_seconds();

        event::emit(DataAttributionRecorded {
            model_id,
            dataset_address,
            data_owner,
            contribution_percentage,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Update model metrics
    public entry fun update_metrics(
        creator: &signer,
        model_id: u64,
        accuracy: u64,
        precision: u64,
        recall: u64,
        f1_score: u64,
        custom_metric_name: String,
        custom_metric_value: u64,
    ) acquires ModelRegistryState {
        let creator_addr = signer::address_of(creator);
        let state = borrow_global_mut<ModelRegistryState>(@ai_marketplace);

        let model_index = find_model(&state.models, model_id);
        assert!(model_index < vector::length(&state.models),
            error::not_found(E_MODEL_NOT_FOUND));

        let model = vector::borrow_mut(&mut state.models, model_index);
        assert!(model.creator == creator_addr, error::permission_denied(E_NOT_AUTHORIZED));

        model.metrics = PerformanceMetrics {
            accuracy,
            precision,
            recall,
            f1_score,
            custom_metric_name,
            custom_metric_value,
        };
        model.updated_at = timestamp::now_seconds();
    }

    /// Update model version
    public entry fun update_model_version(
        creator: &signer,
        model_id: u64,
        new_version: String,
        new_model_uri: String,
    ) acquires ModelRegistryState {
        let creator_addr = signer::address_of(creator);
        let state = borrow_global_mut<ModelRegistryState>(@ai_marketplace);

        let model_index = find_model(&state.models, model_id);
        assert!(model_index < vector::length(&state.models),
            error::not_found(E_MODEL_NOT_FOUND));

        let model = vector::borrow_mut(&mut state.models, model_index);
        assert!(model.creator == creator_addr, error::permission_denied(E_NOT_AUTHORIZED));

        model.version = new_version;
        model.model_uri = new_model_uri;
        model.updated_at = timestamp::now_seconds();

        event::emit(ModelUpdated {
            model_id,
            name: model.name,
            new_version,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Record model usage
    public entry fun record_usage(
        user: &signer,
        model_id: u64,
        usage_type: String,
    ) acquires ModelRegistryState {
        let user_addr = signer::address_of(user);
        let state = borrow_global_mut<ModelRegistryState>(@ai_marketplace);

        let model_index = find_model(&state.models, model_id);
        assert!(model_index < vector::length(&state.models),
            error::not_found(E_MODEL_NOT_FOUND));

        let model = vector::borrow_mut(&mut state.models, model_index);

        // Increment download count for downloads
        if (usage_type == string::utf8(b"download")) {
            model.download_count = model.download_count + 1;
        };

        // Log usage
        let usage = ModelUsage {
            model_id,
            user: user_addr,
            usage_type,
            timestamp: timestamp::now_seconds(),
        };
        vector::push_back(&mut state.usage_logs, usage);

        if (usage_type == string::utf8(b"inference")) {
            state.total_inferences = state.total_inferences + 1;
        };

        event::emit(ModelUsed {
            model_id,
            user: user_addr,
            usage_type,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Helper: Find model by ID
    fun find_model(models: &vector<AIModel>, model_id: u64): u64 {
        let i = 0u64;
        let len = vector::length(models);
        while (i < len) {
            let model = vector::borrow(models, i);
            if (model.model_id == model_id) {
                return i
            };
            i = i + 1;
        };
        len
    }

    /// View: Get model details
    #[view]
    public fun get_model_details(model_id: u64): (
        String,   // name
        String,   // description
        u8,       // model_type
        address,  // creator
        String,   // framework
        String,   // version
        u64,      // parameter_count
        bool,     // is_public
        u64,      // download_count
    ) acquires ModelRegistryState {
        let state = borrow_global<ModelRegistryState>(@ai_marketplace);
        let model_index = find_model(&state.models, model_id);
        assert!(model_index < vector::length(&state.models),
            error::not_found(E_MODEL_NOT_FOUND));

        let model = vector::borrow(&state.models, model_index);
        (
            model.name,
            model.description,
            model.model_type,
            model.creator,
            model.framework,
            model.version,
            model.parameter_count,
            model.is_public,
            model.download_count,
        )
    }

    /// View: Get model data sources (for attribution)
    #[view]
    public fun get_data_sources(model_id: u64): u64 acquires ModelRegistryState {
        let state = borrow_global<ModelRegistryState>(@ai_marketplace);
        let model_index = find_model(&state.models, model_id);
        assert!(model_index < vector::length(&state.models),
            error::not_found(E_MODEL_NOT_FOUND));

        let model = vector::borrow(&state.models, model_index);
        vector::length(&model.data_sources)
    }

    /// View: Get model metrics
    #[view]
    public fun get_metrics(model_id: u64): (u64, u64, u64, u64) acquires ModelRegistryState {
        let state = borrow_global<ModelRegistryState>(@ai_marketplace);
        let model_index = find_model(&state.models, model_id);
        assert!(model_index < vector::length(&state.models),
            error::not_found(E_MODEL_NOT_FOUND));

        let model = vector::borrow(&state.models, model_index);
        (
            model.metrics.accuracy,
            model.metrics.precision,
            model.metrics.recall,
            model.metrics.f1_score,
        )
    }

    /// View: Get registry statistics
    #[view]
    public fun get_registry_stats(): (u64, u64, u64) acquires ModelRegistryState {
        let state = borrow_global<ModelRegistryState>(@ai_marketplace);
        (
            state.total_models,
            state.total_inferences,
            vector::length(&state.usage_logs),
        )
    }

    /// View: Get models by creator
    #[view]
    public fun get_creator_models(creator: address): vector<u64> acquires ModelRegistryState {
        let state = borrow_global<ModelRegistryState>(@ai_marketplace);
        let result = vector::empty<u64>();

        let i = 0u64;
        let len = vector::length(&state.models);

        while (i < len) {
            let model = vector::borrow(&state.models, i);
            if (model.creator == creator) {
                vector::push_back(&mut result, model.model_id);
            };
            i = i + 1;
        };

        result
    }
}
