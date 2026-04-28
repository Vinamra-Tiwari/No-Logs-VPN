import { useState, useEffect, useRef } from "react";

/* ── Privacy Mode Indicator ── */
export function PrivacyIndicator({ connected, sessionExpired }) {

    const getState = () => {
        if (sessionExpired) return { icon: "⚠️", label: "Session Expired", color: "#ff4466", bg: "rgba(255,68,102,0.08)", border: "rgba(255,68,102,0.2)" };
        if (connected) return { icon: "🔒", label: "Ephemeral Session Running", color: "#00ffb4", bg: "rgba(0,255,180,0.06)", border: "rgba(0,255,180,0.15)" };
        return { icon: "🟢", label: "No Logs Active", color: "#00ffb4", bg: "rgba(0,255,180,0.04)", border: "rgba(0,255,180,0.1)" };
    };

    const state = getState();

    return (
        <div className="tooltip-container">
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl transition-all duration-300"
                style={{
                    background: state.bg,
                    border: `1px solid ${state.border}`,
                    cursor: "default",
                }}>
                <span style={{ fontSize: 14, lineHeight: 1 }}>{state.icon}</span>
                <div className="flex flex-col">
                    <span className="font-mono" style={{ fontSize: 11, color: state.color, fontWeight: 600 }}>
                        {state.label}
                    </span>
                    <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>Privacy Protected</span>
                </div>
                <div className="w-1.5 h-1.5 rounded-full ml-1"
                    style={{
                        background: state.color,
                        boxShadow: `0 0 6px ${state.color}`,
                        animation: sessionExpired ? "none" : "strengthPulse 2s ease infinite",
                    }} />
            </div>
            <div className="tooltip-text">
                🔐 No activity, IP, or DNS logs are stored
            </div>
        </div>
    );
}

/* ── Session Timer ── */
export function SessionTimer({ expiresAt, onExtend, onExpired }) {
    const [remaining, setRemaining] = useState(0);
    const [expired, setExpired] = useState(false);
    const intervalRef = useRef(null);

    useEffect(() => {
        if (!expiresAt) return;
        const update = () => {
            const left = Math.max(0, expiresAt - Date.now());
            setRemaining(left);
            if (left <= 0 && !expired) {
                setExpired(true);
                onExpired?.();
            }
        };
        update();
        intervalRef.current = setInterval(update, 1000);
        return () => clearInterval(intervalRef.current);
    }, [expiresAt, expired, onExpired]);

    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    const isUrgent = remaining < 5 * 60 * 1000 && remaining > 0;
    const progress = expiresAt ? (remaining / (30 * 60 * 1000)) * 100 : 0;

    if (expired) {
        return (
            <div className="glass-card p-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: "rgba(255,68,102,0.15)" }}>
                            <span style={{ fontSize: 16 }}>⚠️</span>
                        </div>
                        <div>
                            <div className="font-mono text-xs font-semibold" style={{ color: "#ff4466" }}>SESSION EXPIRED</div>
                            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>All session data destroyed</div>
                        </div>
                    </div>
                    <button onClick={onExtend}
                        className="px-4 py-2 rounded-lg font-semibold text-xs transition-all duration-200"
                        style={{
                            background: "linear-gradient(135deg, rgba(0,255,180,0.15), rgba(0,170,255,0.15))",
                            border: "1px solid rgba(0,255,180,0.3)",
                            color: "#00ffb4",
                        }}>
                        New Session
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span style={{ fontSize: 14 }}>⏱️</span>
                    <span className="font-mono text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>SESSION</span>
                </div>
                <button onClick={onExtend}
                    className="px-3 py-1 rounded-lg text-xs transition-all duration-200 font-medium"
                    style={{
                        background: "rgba(0,255,180,0.08)",
                        border: "1px solid rgba(0,255,180,0.2)",
                        color: "#00ffb4",
                        fontSize: 10,
                    }}>
                    Extend +30m
                </button>
            </div>
            <div className="flex items-baseline gap-1">
                <span className="font-mono font-bold" style={{
                    fontSize: 28,
                    color: isUrgent ? "#ff4466" : "#fff",
                    animation: isUrgent ? "countdownUrgent 1s ease infinite" : "none",
                    letterSpacing: "-1px",
                }}>
                    {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                </span>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>remaining</span>
            </div>
            {/* Progress bar */}
            <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div className="h-full rounded-full transition-all duration-1000"
                    style={{
                        width: `${progress}%`,
                        background: isUrgent
                            ? "linear-gradient(90deg, #ff4466, #ff6688)"
                            : "linear-gradient(90deg, #00ffb4, #00ccff)",
                    }} />
            </div>
            <div className="mt-2 flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full" style={{ background: "#00ffb4" }} />
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>
                    Privacy Mode: No data stored beyond this session
                </span>
            </div>
        </div>
    );
}

/* ── Connection Monitor ── */
export function ConnectionMonitor({ metrics, connected }) {
    if (!connected || !metrics) {
        return (
            <div className="glass-card p-5">
                <div className="flex items-center gap-2 mb-4">
                    <span style={{ fontSize: 14 }}>📶</span>
                    <span className="font-semibold text-white text-sm">Connection Monitor</span>
                </div>
                <div className="space-y-3">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="flex items-center justify-between">
                            <div className="skeleton" style={{ width: 80, height: 12 }} />
                            <div className="skeleton" style={{ width: 50, height: 12 }} />
                        </div>
                    ))}
                </div>
                <div className="mt-4 text-center" style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>
                    Connect to see live metrics
                </div>
            </div>
        );
    }

    const getStrengthBars = () => {
        const s = metrics.connectionStrength;
        const count = s === "excellent" ? 4 : s === "good" ? 3 : s === "fair" ? 2 : 1;
        return Array.from({ length: 4 }, (_, i) => i < count);
    };

    const bars = getStrengthBars();
    const serverFlag = metrics.server === "DE" ? "🇩🇪" : metrics.server === "NL" ? "🇳🇱" : metrics.server === "FI" ? "🇫🇮" : metrics.server === "CH" ? "🇨🇭" : metrics.server === "SG" ? "🇸🇬" : metrics.server === "JP" ? "🇯🇵" : "🌐";
    const serverName = { DE: "Germany", NL: "Netherlands", FI: "Finland", CH: "Switzerland", SG: "Singapore", JP: "Japan" }[metrics.server] || "Unknown";

    return (
        <div className="glass-card p-5 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span style={{ fontSize: 14 }}>📶</span>
                    <span className="font-semibold text-white text-sm">Connection Monitor</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                    style={{ background: "rgba(0,255,180,0.08)", border: "1px solid rgba(0,255,180,0.15)" }}>
                    <div className="w-1.5 h-1.5 rounded-full status-dot active" style={{ background: "#00ffb4" }} />
                    <span className="font-mono" style={{ fontSize: 10, color: "#00ffb4" }}>LIVE</span>
                </div>
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Latency */}
                <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Latency</div>
                    <div className="flex items-baseline gap-1 mt-1">
                        <span className="font-mono font-bold text-white" style={{ fontSize: 20 }}>{metrics.latency}</span>
                        <span className="font-mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>ms</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                        <span style={{ fontSize: 10 }}>⚡</span>
                        <span style={{ fontSize: 9, color: metrics.latency < 50 ? "#00ffb4" : metrics.latency < 100 ? "#ffaa00" : "#ff4466" }}>
                            {metrics.latency < 50 ? "Excellent" : metrics.latency < 100 ? "Good" : "High"}
                        </span>
                    </div>
                </div>

                {/* Location */}
                <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Location</div>
                    <div className="flex items-center gap-2 mt-1">
                        <span style={{ fontSize: 22, lineHeight: 1 }}>{serverFlag}</span>
                        <span className="font-mono font-semibold text-white" style={{ fontSize: 12 }}>{serverName}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                        <span style={{ fontSize: 10 }}>📍</span>
                        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>Exit Node</span>
                    </div>
                </div>
            </div>

            {/* Connection Strength */}
            <div className="p-3 rounded-xl mb-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center justify-between">
                    <div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Signal Strength</div>
                        <span className="font-mono font-semibold" style={{
                            fontSize: 12,
                            color: metrics.connectionStrength === "excellent" ? "#00ffb4" : metrics.connectionStrength === "good" ? "#00ccff" : "#ffaa00"
                        }}>
                            {metrics.connectionStrength?.toUpperCase()}
                        </span>
                    </div>
                    <div className="flex items-end gap-1" style={{ height: 20 }}>
                        {bars.map((active, i) => (
                            <div key={i} className="strength-bar"
                                style={{
                                    height: `${(i + 1) * 5}px`,
                                    background: active ? "#00ffb4" : "rgba(255,255,255,0.1)",
                                    boxShadow: active ? "0 0 4px rgba(0,255,180,0.3)" : "none",
                                }} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Data Transferred */}
            <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center justify-between mb-2">
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Data Transferred</div>
                    <span className="font-mono px-2 py-0.5 rounded" style={{ fontSize: 8, background: "rgba(0,255,180,0.08)", color: "#00ffb4" }}>
                        SESSION ONLY
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span style={{ fontSize: 12 }}>📊</span>
                        <div>
                            <div className="font-mono font-semibold text-white" style={{ fontSize: 14 }}>
                                {metrics.dataTransferred?.download || "0"} MB
                            </div>
                            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>↓ Download</div>
                        </div>
                    </div>
                    <div className="w-px h-8" style={{ background: "rgba(255,255,255,0.06)" }} />
                    <div className="flex items-center gap-2">
                        <span style={{ fontSize: 12 }}>📤</span>
                        <div>
                            <div className="font-mono font-semibold text-white" style={{ fontSize: 14 }}>
                                {metrics.dataTransferred?.upload || "0"} MB
                            </div>
                            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>↑ Upload</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Speed */}
            <div className="mt-3 flex items-center gap-3">
                <div className="flex-1 p-2.5 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>↓ Speed</div>
                    <span className="font-mono font-semibold" style={{ fontSize: 13, color: "#00ffb4" }}>
                        {metrics.downloadSpeed} Mbps
                    </span>
                </div>
                <div className="flex-1 p-2.5 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>↑ Speed</div>
                    <span className="font-mono font-semibold" style={{ fontSize: 13, color: "#00ccff" }}>
                        {metrics.uploadSpeed} Mbps
                    </span>
                </div>
            </div>
        </div>
    );
}
