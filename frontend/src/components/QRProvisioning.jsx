import { useState } from "react";

/* ── QR Provisioning Panel ── */
export function QRProvisioning({ onGeneratePeer, qrData, loading }) {
    const [deviceName, setDeviceName] = useState("");
    const [deviceType, setDeviceType] = useState("mobile");
    const [showConfig, setShowConfig] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleGenerate = () => {
        onGeneratePeer(deviceName || "My Device", deviceType);
    };

    const handleCopy = () => {
        if (qrData?.config) {
            navigator.clipboard.writeText(qrData.config);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const deviceTypes = [
        { id: "mobile", icon: "📱", label: "Phone" },
        { id: "tablet", icon: "📟", label: "Tablet" },
        { id: "laptop", icon: "💻", label: "Laptop" },
    ];

    return (
        <div className="glass-card overflow-hidden">
            <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-2">
                    <span style={{ fontSize: 14 }}>📱</span>
                    <span className="font-semibold text-white text-sm">QR Provisioning</span>
                </div>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>
                    Scan with WireGuard app for instant onboarding
                </p>
            </div>

            <div className="p-5">
                {!qrData ? (
                    <>
                        {/* Device type selector */}
                        <div className="mb-4">
                            <label style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", display: "block", marginBottom: 8 }}>
                                DEVICE TYPE
                            </label>
                            <div className="flex gap-2">
                                {deviceTypes.map(dt => (
                                    <button key={dt.id} onClick={() => setDeviceType(dt.id)}
                                        className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all duration-200"
                                        style={{
                                            background: deviceType === dt.id ? "rgba(16,185,129,0.06)" : "rgba(255,255,255,0.02)",
                                            border: `1px solid ${deviceType === dt.id ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.06)"}`,
                                        }}>
                                        <span style={{ fontSize: 20 }}>{dt.icon}</span>
                                        <span style={{ fontSize: 10, color: deviceType === dt.id ? "#10B981" : "rgba(255,255,255,0.3)" }}>
                                            {dt.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Device name */}
                        <div className="mb-4">
                            <label style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", display: "block", marginBottom: 6 }}>
                                DEVICE NAME (optional)
                            </label>
                            <input
                                type="text"
                                value={deviceName}
                                onChange={e => setDeviceName(e.target.value)}
                                placeholder="e.g. My iPhone"
                                className="w-full px-3 py-2.5 rounded-lg font-mono text-xs text-white"
                                style={{
                                    background: "rgba(255,255,255,0.04)",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                    outline: "none",
                                    fontSize: 12,
                                }}
                            />
                        </div>

                        {/* Generate button */}
                        <button onClick={handleGenerate} disabled={loading}
                            className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-300"
                            style={{
                                background: loading
                                    ? "rgba(255,170,0,0.12)"
                                    : "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(0,170,255,0.15))",
                                border: `1.5px solid ${loading ? "#ffaa00" : "rgba(16,185,129,0.3)"}`,
                                color: loading ? "#ffaa00" : "#10B981",
                                boxShadow: loading ? "none" : "0 4px 20px rgba(16,185,129,0.1)",
                            }}>
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                                            stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                            style={{ animation: "spin 1s linear infinite", transformOrigin: "center" }} />
                                    </svg>
                                    Generating Config…
                                </span>
                            ) : "🔑 Generate QR Config"}
                        </button>
                    </>
                ) : (
                    <div className="animate-fadeIn">
                        {/* QR Code */}
                        <div className="flex justify-center mb-4">
                            <div className="qr-container">
                                <img src={qrData.qrUrl} alt="WireGuard QR" style={{ width: 180, height: 180 }} />
                            </div>
                        </div>

                        <div className="text-center mb-4">
                            <div className="font-mono font-semibold text-white text-xs mb-1">
                                Scan with WireGuard App
                            </div>
                            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
                                Peer ID: {qrData.peerId}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 mb-3">
                            <button onClick={handleCopy}
                                className="flex-1 py-2.5 rounded-lg font-mono text-xs transition-all duration-200"
                                style={{
                                    background: copied ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.04)",
                                    border: `1px solid ${copied ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.08)"}`,
                                    color: copied ? "#10B981" : "rgba(255,255,255,0.5)",
                                }}>
                                {copied ? "✓ Copied!" : "📋 Copy Config"}
                            </button>
                            <button onClick={() => setShowConfig(!showConfig)}
                                className="flex-1 py-2.5 rounded-lg font-mono text-xs transition-all duration-200"
                                style={{
                                    background: "rgba(255,255,255,0.04)",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                    color: "rgba(255,255,255,0.5)",
                                }}>
                                {showConfig ? "Hide" : "View"} Config
                            </button>
                        </div>

                        {/* Config preview */}
                        {showConfig && (
                            <div className="p-3 rounded-lg animate-fadeIn" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)" }}>
                                <pre className="font-mono" style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                                    {qrData.config}
                                </pre>
                            </div>
                        )}

                        {/* Another device */}
                        <button onClick={() => { /* reset */ }}
                            className="w-full mt-3 py-2 rounded-lg text-xs transition-all duration-200"
                            style={{
                                background: "transparent",
                                border: "1px dashed rgba(255,255,255,0.1)",
                                color: "rgba(255,255,255,0.3)",
                            }}>
                            + Add Another Device
                        </button>
                    </div>
                )}
            </div>

            {/* Flow diagram */}
            <div className="px-5 pb-4">
                <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <div className="flex items-center justify-center gap-2 flex-wrap" style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>
                        <span style={{ color: "#10B981" }}>Scan QR</span>
                        <span>→</span>
                        <span>Phone Connects</span>
                        <span>→</span>
                        <span style={{ color: "#6366F1" }}>Vultr Relay</span>
                        <span>→</span>
                        <span style={{ color: "#8b5cf6" }}>Hetzner Exit</span>
                        <span>→</span>
                        <span style={{ color: "#10B981" }}>🌐 Internet</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Device Management ── */
export function DeviceList({ devices, onRevoke }) {
    if (!devices || devices.length === 0) {
        return (
            <div className="glass-card p-5">
                <div className="flex items-center gap-2 mb-3">
                    <span style={{ fontSize: 14 }}>📡</span>
                    <span className="font-semibold text-white text-sm">Connected Devices</span>
                </div>
                <div className="text-center py-4" style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>
                    No devices connected
                </div>
                <div className="flex items-center gap-1.5 justify-center">
                    <div className="w-1 h-1 rounded-full" style={{ background: "#10B981" }} />
                    <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>
                        Device list is temporary — not stored
                    </span>
                </div>
            </div>
        );
    }

    const deviceIcons = { mobile: "📱", tablet: "📟", laptop: "💻" };

    return (
        <div className="glass-card overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-2">
                    <span style={{ fontSize: 14 }}>📡</span>
                    <span className="font-semibold text-white text-sm">Connected Devices</span>
                </div>
                <span className="font-mono px-2 py-0.5 rounded" style={{ fontSize: 9, background: "rgba(16,185,129,0.06)", color: "#10B981", border: "1px solid rgba(16,185,129,0.15)" }}>
                    {devices.length} active
                </span>
            </div>
            <div className="p-4 space-y-2">
                {devices.map((device, i) => (
                    <div key={device.id} className="device-card flex items-center gap-3 animate-slideInRight"
                        style={{ animationDelay: `${i * 0.1}s` }}>
                        <span style={{ fontSize: 20 }}>{deviceIcons[device.type] || "📱"}</span>
                        <div className="flex-1">
                            <div className="font-mono font-semibold text-white" style={{ fontSize: 12 }}>{device.name}</div>
                            <div className="font-mono" style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>
                                Key: {device.publicKey}
                            </div>
                        </div>
                        <button onClick={() => onRevoke(device.id)}
                            className="px-3 py-1.5 rounded-lg text-xs transition-all duration-200"
                            style={{
                                background: "rgba(255,68,102,0.08)",
                                border: "1px solid rgba(255,68,102,0.2)",
                                color: "#ff4466",
                                fontSize: 10,
                            }}>
                            Revoke
                        </button>
                    </div>
                ))}
                <div className="mt-2 flex items-center gap-1.5 justify-center">
                    <div className="w-1 h-1 rounded-full" style={{ background: "#ffaa00" }} />
                    <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>
                        Temporary only — no logs stored
                    </span>
                </div>
            </div>
        </div>
    );
}
