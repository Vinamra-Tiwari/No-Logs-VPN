import { useState, useEffect, useRef } from "react";

/* ── Globe ── */
export function Globe({ active, size = 280 }) {
    const ref = useRef(null);
    const raf = useRef(null);
    const t = useRef(0);

    useEffect(() => {
        const c = ref.current;
        const ctx = c.getContext("2d");
        const dpr = window.devicePixelRatio || 1;
        c.width = size * dpr;
        c.height = size * dpr;
        ctx.scale(dpr, dpr);

        const W = size, H = size;
        const cx = W / 2, cy = H / 2, R = W * 0.42;

        function pt(lat, lon, time) {
            const phi = (90 - lat) * (Math.PI / 180);
            const theta = (lon + time * 14) * (Math.PI / 180);
            return {
                x: cx + R * Math.sin(phi) * Math.cos(theta),
                y: cy + R * Math.cos(phi),
                z: R * Math.sin(phi) * Math.sin(theta),
            };
        }

        const hotspots = [
            { lat: 51, lon: 10, label: "DE" },
            { lat: 52, lon: 5, label: "NL" },
            { lat: 60, lon: 25, label: "FI" },
            { lat: 47, lon: 8, label: "CH" },
            { lat: 1, lon: 104, label: "SG" },
            { lat: 35, lon: 139, label: "JP" },
        ];

        function frame() {
            t.current += 0.003;
            ctx.clearRect(0, 0, W, H);

            // Atmospheric glow
            const atmo = ctx.createRadialGradient(cx, cy, R * 0.85, cx, cy, R * 1.3);
            atmo.addColorStop(0, "transparent");
            atmo.addColorStop(0.5, active ? "rgba(0,255,180,0.03)" : "rgba(60,60,160,0.02)");
            atmo.addColorStop(1, "transparent");
            ctx.beginPath(); ctx.arc(cx, cy, R * 1.3, 0, Math.PI * 2);
            ctx.fillStyle = atmo; ctx.fill();

            // Base sphere
            const bg = ctx.createRadialGradient(cx - R * 0.2, cy - R * 0.2, 0, cx, cy, R);
            bg.addColorStop(0, active ? "rgba(0,255,180,0.08)" : "rgba(60,60,160,0.06)");
            bg.addColorStop(1, "transparent");
            ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
            ctx.fillStyle = bg; ctx.fill();

            // Grid lines
            ctx.globalAlpha = active ? 0.15 : 0.06;
            const col = active ? "#00ffb4" : "#7788ee";
            for (let la = -60; la <= 60; la += 20) {
                ctx.beginPath(); let f = true;
                for (let lo = 0; lo <= 360; lo += 3) {
                    const p = pt(la, lo, t.current);
                    if (p.z < 0) { f = true; continue; }
                    f ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); f = false;
                }
                ctx.strokeStyle = col; ctx.lineWidth = 0.5; ctx.stroke();
            }
            for (let lo = 0; lo < 360; lo += 20) {
                ctx.beginPath(); let f = true;
                for (let la = -90; la <= 90; la += 3) {
                    const p = pt(la, lo, t.current);
                    if (p.z < 0) { f = true; continue; }
                    f ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); f = false;
                }
                ctx.strokeStyle = col; ctx.lineWidth = 0.5; ctx.stroke();
            }
            ctx.globalAlpha = 1;

            // Hotspots with connections
            if (active) {
                // Connection arcs between visible hotspots
                const visibleHotspots = hotspots.map(h => ({
                    ...h,
                    pos: pt(h.lat, h.lon, t.current),
                })).filter(h => h.pos.z > 0);

                for (let i = 0; i < visibleHotspots.length - 1; i++) {
                    const a = visibleHotspots[i].pos;
                    const b = visibleHotspots[i + 1].pos;
                    const pulse = (Math.sin(t.current * 1.5 + i * 0.5) + 1) / 2;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.quadraticCurveTo(
                        (a.x + b.x) / 2, (a.y + b.y) / 2 - 15,
                        b.x, b.y
                    );
                    ctx.strokeStyle = `rgba(0,255,180,${0.06 + pulse * 0.06})`;
                    ctx.lineWidth = 0.8; ctx.stroke();
                }

                hotspots.forEach((h, i) => {
                    const p = pt(h.lat, h.lon, t.current);
                    if (p.z < 0) return;
                    const pulse = (Math.sin(t.current * 2.5 + i) + 1) / 2;

                    // Outer ring
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 6 + pulse * 6, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(0,255,180,${0.08 + pulse * 0.08})`;
                    ctx.lineWidth = 0.8; ctx.stroke();

                    // Inner glow
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 3 + pulse * 2, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(0,255,180,${0.5 + pulse * 0.5})`;
                    ctx.fill();

                    // Core
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
                    ctx.fillStyle = "#00ffb4";
                    ctx.fill();
                });
            }

            // Specular highlight
            const spec = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.35, 0, cx - R * 0.2, cy - R * 0.2, R * 0.5);
            spec.addColorStop(0, "rgba(255,255,255,0.06)");
            spec.addColorStop(1, "transparent");
            ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
            ctx.fillStyle = spec; ctx.fill();

            // Edge ring
            ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
            ctx.strokeStyle = active ? "rgba(0,255,180,0.12)" : "rgba(100,100,200,0.08)";
            ctx.lineWidth = 0.8; ctx.stroke();

            raf.current = requestAnimationFrame(frame);
        }
        frame();
        return () => cancelAnimationFrame(raf.current);
    }, [active, size]);

    return (
        <canvas ref={ref}
            style={{
                width: size, height: size,
                filter: active ? "drop-shadow(0 0 40px rgba(0,255,180,0.2))" : "drop-shadow(0 0 20px rgba(60,60,180,0.12))",
                transition: "filter 1s",
            }} />
    );
}

/* ── Route Strip ── */
export function RouteStrip({ active }) {
    const hops = ["Client", "Vultr · Relay", "Hetzner · Exit", "Internet"];
    const colors = ["#00ffb4", "#00ccff", "#8b5cf6", "#00ffb4"];

    return (
        <div className="flex items-center gap-0 justify-center">
            {hops.map((h, i) => (
                <div key={i} className="flex items-center">
                    <div className="flex flex-col items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full transition-all duration-700"
                            style={{
                                background: active ? colors[i] : "rgba(255,255,255,0.12)",
                                boxShadow: active ? `0 0 10px ${colors[i]}` : "none",
                            }} />
                        <span className="font-mono" style={{
                            fontSize: 9,
                            color: active ? colors[i] : "rgba(255,255,255,0.15)",
                            whiteSpace: "nowrap",
                            transition: "color 0.7s",
                            fontWeight: active ? 600 : 400,
                        }}>
                            {h}
                        </span>
                    </div>
                    {i < hops.length - 1 && (
                        <div className="relative mx-3 flex-shrink-0" style={{ width: 40, height: 2, background: "rgba(255,255,255,0.05)", overflow: "hidden", borderRadius: 1 }}>
                            {active && (
                                <div style={{
                                    position: "absolute", top: 0, height: "100%", width: "40%",
                                    background: `linear-gradient(90deg, transparent, ${colors[i]}, transparent)`,
                                    animation: `slide ${1.2 + i * 0.2}s linear ${i * 0.3}s infinite`,
                                    borderRadius: 1,
                                }} />
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

/* ── Trust Badge ── */
export function Badge({ label, ok, icon }) {
    return (
        <div className="tooltip-container">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-500"
                style={{
                    background: ok ? "rgba(0,255,180,0.05)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${ok ? "rgba(0,255,180,0.15)" : "rgba(255,255,255,0.06)"}`,
                }}>
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all duration-500"
                    style={{
                        background: ok ? "#00ffb4" : "rgba(255,255,255,0.15)",
                        boxShadow: ok ? "0 0 5px #00ffb4" : "none",
                    }} />
                <span className="font-mono" style={{ fontSize: 10, color: ok ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)" }}>
                    {label}
                </span>
            </div>
        </div>
    );
}

/* ── Error/Status Components ── */
export function ErrorBanner({ type, message, onRetry }) {
    const configs = {
        offline: {
            icon: "🔌",
            title: "Server Unavailable",
            color: "#ff4466",
            bg: "rgba(255,68,102,0.06)",
            border: "rgba(255,68,102,0.15)",
        },
        connecting: {
            icon: "🔄",
            title: "Connecting… Retrying",
            color: "#ffaa00",
            bg: "rgba(255,170,0,0.06)",
            border: "rgba(255,170,0,0.15)",
        },
        disconnected: {
            icon: "🔴",
            title: "VPN Disconnected",
            color: "#ff4466",
            bg: "rgba(255,68,102,0.06)",
            border: "rgba(255,68,102,0.15)",
        },
    };

    const config = configs[type] || configs.offline;

    return (
        <div className="animate-fadeIn rounded-xl p-4 flex items-center gap-3"
            style={{ background: config.bg, border: `1px solid ${config.border}` }}>
            <span style={{ fontSize: 20 }}>{config.icon}</span>
            <div className="flex-1">
                <div className="font-semibold text-sm" style={{ color: config.color }}>{config.title}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
                    {message || "Please check your connection"}
                </div>
            </div>
            {onRetry && (
                <button onClick={onRetry}
                    className="px-4 py-2 rounded-lg font-mono text-xs font-semibold transition-all duration-200"
                    style={{
                        background: `${config.color}15`,
                        border: `1px solid ${config.color}40`,
                        color: config.color,
                    }}>
                    Retry
                </button>
            )}
        </div>
    );
}
