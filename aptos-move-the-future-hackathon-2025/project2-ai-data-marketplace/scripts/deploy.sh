#!/bin/bash

# AI Data Marketplace Deployment Script
# For Aptos Testnet/Mainnet

set -e

echo "=========================================="
echo "AI Data Marketplace Deployment"
echo "=========================================="
echo ""

NETWORK="${1:-testnet}"
MODULE_ADDRESS="${2}"

if [ -z "$MODULE_ADDRESS" ]; then
    echo "Error: Module address required"
    echo "Usage: ./deploy.sh <network> <module_address>"
    echo "Example: ./deploy.sh testnet 0xDATA..."
    exit 1
fi

echo "Network: $NETWORK"
echo "Module Address: $MODULE_ADDRESS"
echo ""

# Compile
echo "Step 1: Compiling Move modules..."
aptos move compile \
    --named-addresses ai_marketplace=$MODULE_ADDRESS \
    --save-metadata

[ $? -eq 0 ] && echo "✅ Compilation successful" || exit 1
echo ""

# Test
echo "Step 2: Running tests..."
aptos move test \
    --named-addresses ai_marketplace=$MODULE_ADDRESS

[ $? -eq 0 ] && echo "✅ All tests passed" || exit 1
echo ""

# Deploy
echo "Step 3: Deploying to $NETWORK..."
aptos move publish \
    --named-addresses ai_marketplace=$MODULE_ADDRESS \
    --network $NETWORK \
    --assume-yes

[ $? -eq 0 ] && echo "✅ Deployment successful" || exit 1
echo ""

echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "Initialize contracts:"
echo ""
echo "1. Data asset collection:"
echo "   aptos move run --function-id ${MODULE_ADDRESS}::data_asset::initialize_collection \\"
echo "     --args string:'AI Training Datasets' string:'AI Data' string:'https://...' \\"
echo "     --network $NETWORK"
echo ""
echo "2. Marketplace:"
echo "   aptos move run --function-id ${MODULE_ADDRESS}::marketplace::initialize_marketplace \\"
echo "     --args u64:250 address:$MODULE_ADDRESS \\"
echo "     --network $NETWORK"
echo ""
echo "3. Access control:"
echo "   aptos move run --function-id ${MODULE_ADDRESS}::access_control::initialize_access_control \\"
echo "     --network $NETWORK"
echo ""
echo "4. AI model registry:"
echo "   aptos move run --function-id ${MODULE_ADDRESS}::ai_model_registry::initialize_registry \\"
echo "     --network $NETWORK"
echo ""
echo "Module deployed at: $MODULE_ADDRESS on $NETWORK"
echo "=========================================="
