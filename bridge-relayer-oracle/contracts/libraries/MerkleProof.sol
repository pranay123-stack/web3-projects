// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MerkleProof
 * @dev Library for verifying merkle proofs, including support for sparse merkle trees
 */
library MerkleProof {
    /**
     * @dev Returns true if a `leaf` can be proved to be a part of a Merkle tree
     * defined by `root`. For this, a `proof` must be provided, containing
     * sibling hashes on the branch from the leaf to the root of the tree.
     * @param proof Array of sibling hashes
     * @param root The merkle root
     * @param leaf The leaf node to verify
     * @return True if the proof is valid
     */
    function verify(
        bytes32[] memory proof,
        bytes32 root,
        bytes32 leaf
    ) internal pure returns (bool) {
        return processProof(proof, leaf) == root;
    }

    /**
     * @dev Computes the root from a leaf and proof
     * @param proof Array of sibling hashes
     * @param leaf The leaf node
     * @return The computed root
     */
    function processProof(
        bytes32[] memory proof,
        bytes32 leaf
    ) internal pure returns (bytes32) {
        bytes32 computedHash = leaf;
        for (uint256 i = 0; i < proof.length; i++) {
            computedHash = _hashPair(computedHash, proof[i]);
        }
        return computedHash;
    }

    /**
     * @dev Verifies a merkle proof with index-based positioning
     * This is useful when the position in the tree matters
     * @param proof Array of sibling hashes
     * @param root The merkle root
     * @param leaf The leaf node to verify
     * @param index The index of the leaf in the tree
     * @return True if the proof is valid
     */
    function verifyWithIndex(
        bytes32[] memory proof,
        bytes32 root,
        bytes32 leaf,
        uint256 index
    ) internal pure returns (bool) {
        return processProofWithIndex(proof, leaf, index) == root;
    }

    /**
     * @dev Computes the root from a leaf, proof, and index
     * @param proof Array of sibling hashes
     * @param leaf The leaf node
     * @param index The index of the leaf
     * @return The computed root
     */
    function processProofWithIndex(
        bytes32[] memory proof,
        bytes32 leaf,
        uint256 index
    ) internal pure returns (bytes32) {
        bytes32 computedHash = leaf;
        for (uint256 i = 0; i < proof.length; i++) {
            if (index % 2 == 0) {
                computedHash = _hashPair(computedHash, proof[i]);
            } else {
                computedHash = _hashPair(proof[i], computedHash);
            }
            index = index / 2;
        }
        return computedHash;
    }

    /**
     * @dev Verifies a sparse merkle tree proof
     * Sparse merkle trees use default values for empty leaves
     * @param proof Array of sibling hashes
     * @param root The merkle root
     * @param key The key (path) to the leaf
     * @param value The value at the leaf
     * @param depth The depth of the tree
     * @param defaultNodes Array of default node values at each level
     * @return True if the proof is valid
     */
    function verifySparse(
        bytes32[] memory proof,
        bytes32 root,
        uint256 key,
        bytes32 value,
        uint256 depth,
        bytes32[] memory defaultNodes
    ) internal pure returns (bool) {
        require(proof.length == depth, "MerkleProof: invalid proof length");
        require(defaultNodes.length == depth, "MerkleProof: invalid default nodes length");

        bytes32 computedHash = value;

        for (uint256 i = 0; i < depth; i++) {
            bytes32 sibling = proof[i];

            // If sibling is zero, use default node at this level
            if (sibling == bytes32(0)) {
                sibling = defaultNodes[i];
            }

            // Check the bit at position i to determine left/right
            if ((key >> i) & 1 == 0) {
                computedHash = _hashPair(computedHash, sibling);
            } else {
                computedHash = _hashPair(sibling, computedHash);
            }
        }

        return computedHash == root;
    }

    /**
     * @dev Verifies multiple proofs in a single call (batch verification)
     * More gas efficient for multiple verifications
     * @param proofs Array of proof arrays
     * @param root The merkle root
     * @param leaves Array of leaf nodes
     * @return True if all proofs are valid
     */
    function verifyMultiple(
        bytes32[][] memory proofs,
        bytes32 root,
        bytes32[] memory leaves
    ) internal pure returns (bool) {
        require(proofs.length == leaves.length, "MerkleProof: length mismatch");

        for (uint256 i = 0; i < leaves.length; i++) {
            if (!verify(proofs[i], root, leaves[i])) {
                return false;
            }
        }
        return true;
    }

    /**
     * @dev Computes the merkle root from an array of leaves
     * Useful for on-chain root computation
     * @param leaves Array of leaf nodes (must be power of 2)
     * @return The merkle root
     */
    function computeRoot(bytes32[] memory leaves) internal pure returns (bytes32) {
        require(leaves.length > 0, "MerkleProof: empty leaves");

        uint256 n = leaves.length;

        // Ensure leaves is power of 2
        require((n & (n - 1)) == 0, "MerkleProof: leaves must be power of 2");

        // Create working array
        bytes32[] memory nodes = new bytes32[](n);
        for (uint256 i = 0; i < n; i++) {
            nodes[i] = leaves[i];
        }

        // Build tree bottom-up
        while (n > 1) {
            for (uint256 i = 0; i < n / 2; i++) {
                nodes[i] = _hashPair(nodes[2 * i], nodes[2 * i + 1]);
            }
            n = n / 2;
        }

        return nodes[0];
    }

    /**
     * @dev Hash a leaf node (domain separation for leaves vs internal nodes)
     * @param data The data to hash as a leaf
     * @return The leaf hash
     */
    function hashLeaf(bytes memory data) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(uint8(0x00), data));
    }

    /**
     * @dev Hash a leaf node from components
     * @param components The components to hash
     * @return The leaf hash
     */
    function hashLeafComponents(
        bytes32[] memory components
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(uint8(0x00), components));
    }

    /**
     * @dev Internal function to hash a pair of nodes
     * Sorts the pair to ensure consistent ordering
     * @param a First node
     * @param b Second node
     * @return The hash of the pair
     */
    function _hashPair(bytes32 a, bytes32 b) private pure returns (bytes32) {
        return a < b ? _efficientHash(a, b) : _efficientHash(b, a);
    }

    /**
     * @dev Gas-efficient hash of two bytes32 values
     * @param a First value
     * @param b Second value
     * @return value The hash
     */
    function _efficientHash(bytes32 a, bytes32 b) private pure returns (bytes32 value) {
        assembly {
            mstore(0x00, a)
            mstore(0x20, b)
            value := keccak256(0x00, 0x40)
        }
    }
}
