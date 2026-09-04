// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title KeyLedger
 * @notice Immutable, tamper-evident audit ledger for WireGuard key lifecycle events.
 * 
 * ZERO-KNOWLEDGE PRIVACY GUARANTEE:
 * - No private keys or raw public keys are ever accepted or stored on-chain.
 * - Only SHA-256 hashes (bytes32) of public keys and event metadata are recorded.
 */
contract KeyLedger {
    /// @notice Emitted when a key lifecycle event is anchored on-chain
    /// @param keyHash SHA-256 hash of the WireGuard public key (indexed for fast filtering)
    /// @param eventType Lifecycle state: 0 = Provisioned, 1 = Rotated, 2 = Revoked
    /// @param timestamp Unix timestamp of the event
    event EventAnchored(
        bytes32 indexed keyHash,
        uint8 eventType,
        uint256 timestamp
    );

    /// @notice Tracks the number of lifecycle events anchored for each public key hash
    mapping(bytes32 => uint256) public eventCount;

    /**
     * @notice Anchors a key lifecycle event on-chain
     * @param keyHash SHA-256 hash of the WireGuard public key (32 bytes)
     * @param eventType 0 = provisioned, 1 = rotated, 2 = revoked
     * @param timestamp Unix timestamp of the event (or 0 to record current block.timestamp)
     */
    function anchorEvent(
        bytes32 keyHash,
        uint8 eventType,
        uint256 timestamp
    ) external {
        require(keyHash != bytes32(0), "Invalid key hash");
        require(eventType <= 2, "Invalid event type: 0=provisioned, 1=rotated, 2=revoked");

        uint256 eventTime = timestamp == 0 ? block.timestamp : timestamp;
        eventCount[keyHash] += 1;

        emit EventAnchored(keyHash, eventType, eventTime);
    }

    /**
     * @notice Returns the total number of lifecycle events anchored for a specific key hash
     * @param keyHash SHA-256 hash of the WireGuard public key
     */
    function getEventCount(bytes32 keyHash) external view returns (uint256) {
        return eventCount[keyHash];
    }
}
