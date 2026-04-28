#!/bin/bash
set -e

# This script expects two arguments:
# 1. Path to the new configuration file (temporary file)
# 2. Path to the actual WireGuard config file (e.g., /etc/wireguard/wg1.conf)

NEW_CONF=$1
TARGET_CONF=$2
INTERFACE=$(basename "$TARGET_CONF" .conf)

if [ -z "$NEW_CONF" ] || [ -z "$TARGET_CONF" ]; then
    echo "Usage: $0 <new_conf_tmp> <target_conf>"
    exit 1
fi

if [ ! -f "$NEW_CONF" ]; then
    echo "Error: New configuration file not found at $NEW_CONF"
    exit 1
fi

# Ensure correct permissions on the new file
chmod 600 "$NEW_CONF"

# Atomically replace the target configuration file
mv "$NEW_CONF" "$TARGET_CONF"

# Sync the configuration without restarting the interface
# This assumes the interface is already up
if ip link show dev "$INTERFACE" > /dev/null 2>&1; then
    wg syncconf "$INTERFACE" <(wg-quick strip "$TARGET_CONF")
    echo "Successfully synced WireGuard interface $INTERFACE"
else
    echo "Interface $INTERFACE is not running. It will use the new config on next start."
fi
