import { useState, useEffect, useRef } from "react";

/* ── Ephemeral Node Visualization ── */
export function NodeVisualization({ nodes, connected, onRotate }) {
    const [animating, setAnimating] = useState(false);
    const canvasRef = useRef(null);

    useEffect(() => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        const W = canvas.width, H = canvas.height;
        let frameId;
        let t = 0;

        const draw = () => {
            t += 0.01;
            ctx.clearRect(0, 0, W, H);

            // Flow line
            const startX = 50, endX = W - 50, midY = H / 2;
            const entryX = W * 0.33, exitX = W * 0.66;

            // Background arc
            ctx.beginPath();
            ctx.moveTo(startX, midY);
            ctx.bezierCurveTo(entryX, midY - 30, exitX, midY - 30, endX, midY);
            ctx.strokeStyle = connected ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.04)";
            ctx.lineWidth = 2;
            ctx.stroke();

            if (connected) {
                // Animated data packets
                for (let i = 0; i < 3; i++) {
                    const pct = ((t * 0.5 + i * 0.33) % 1);
                    const x = startX + (endX - startX) * pct;
                    const yOffset = Math.sin(pct * Math.PI) * -30;
                    const y = midY + yOffset;
                    const alpha = Math.sin(pct * Math.PI);

                    ctx.beginPath();
                    ctx.arc(x, y, 2, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(16,185,129,${alpha * 0.8})`;
                    ctx.fill();

                    // Trail
                    ctx.beginPath();
                    ctx.arc(x, y, 5, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(16,185,129,${alpha * 0.15})`;
                    ctx.fill();
                }
            }

            // Nodes
            const nodePositions = [
                { x: startX, y: midY, label: "You", color: connected ? "#10B981" : "rgba(255,255,255,0.2)" },
                { x: entryX, y: midY - 15, label: "Entry", color: connected ? "#6366F1" : "rgba(255,255,255,0.15)" },
                { x: exitX, y: midY - 15, label: "Exit", color: connected ? "#8b5cf6" : "rgba(255,255,255,0.15)" },
                { x: endX, y: midY, label: "Internet", color: connected ? "#10B981" : "rgba(255,255,255,0.2)" },
            ];

            nodePositions.forEach((node, i) => {
                const pulse = (Math.sin(t * 2 + i) + 1) / 2;
                const radius = connected ? 6 + pulse * 2 : 4;

                // Glow
                if (connected) {
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, radius + 8, 0, Math.PI * 2);
                    ctx.fillStyle = node.color.replace(")", `,${0.1 + pulse * 0.1})`).replace("rgb", "rgba").replace("#", "");
                    // Use simpler glow
                    const grd = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, radius + 12);
                    grd.addColorStop(0, `${node.color}33`);
                    grd.addColorStop(1, "transparent");
                    ctx.fillStyle = grd;
                    ctx.fill();
                }

                // Node dot
                ctx.beginPath();
                ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
                ctx.fillStyle = node.color;
                ctx.fill();

                // Label
                ctx.fillStyle = connected ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)";
                ctx.font = "10px 'JetBrains Mono', monospace";
                ctx.textAlign = "center";
                ctx.fillText(node.label, node.x, node.y + 22);
            });

            frameId = requestAnimationFrame(draw);
        };

        draw();
        return () => cancelAnimationFrame(frameId);
    }, [connected, nodes]);

    const handleRotate = () => {
        setAnimating(true);
        onRotate?.();
        setTimeout(() => {
            setAnimating(false);
        }, 1200);
    };

    return (
        <div className="glass-card overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-2">
                    <span style={{ fontSize: 14 }}>🔄</span>
                    <span className="font-semibold text-white text-sm">Ephemeral Node Flow</span>
                </div>
                {connected && (
                    <button onClick={handleRotate}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                        style={{
                            background: "rgba(139,92,246,0.1)",
                            border: "1px solid rgba(139,92,246,0.25)",
                            color: "#8b5cf6",
                        }}>
                        {animating ? "Rotating…" : "Force Rotate"}
                    </button>
                )}
            </div>

            {/* Canvas visualization */}
            <div className="px-5 py-4 flex justify-center">
                <canvas ref={canvasRef} width={400} height={120}
                    style={{ width: "100%", maxWidth: 400, height: 120 }} />
            </div>

            {/* Node info cards */}
            {nodes && (
                <div className="px-5 pb-4 grid grid-cols-2 gap-3">
                    <div className={`p-3 rounded-xl transition-all duration-500 ${animating ? "opacity-0" : "opacity-100"}`}
                        style={{ background: "rgba(0,204,255,0.04)", border: "1px solid rgba(0,204,255,0.12)", animation: animating ? "nodeExit 0.6s ease forwards" : "nodeEnter 0.5s ease forwards" }}>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full" style={{ background: "#6366F1", boxShadow: "0 0 4px #6366F1" }} />
                            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>ENTRY NODE</span>
                        </div>
                        <div className="font-mono font-semibold text-white" style={{ fontSize: 11 }}>
                            {nodes.entry?.provider}
                        </div>
                        <div className="font-mono" style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>
                            {nodes.entry?.location} · {nodes.entry?.ip}
                        </div>
                    </div>
                    <div className={`p-3 rounded-xl transition-all duration-500 ${animating ? "opacity-0" : "opacity-100"}`}
                        style={{ background: "rgba(139,92,246,0.04)", border: "1px solid rgba(139,92,246,0.12)", animation: animating ? "nodeExit 0.6s ease forwards" : "nodeEnter 0.5s ease forwards", animationDelay: "0.1s" }}>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full" style={{ background: "#8b5cf6", boxShadow: "0 0 4px #8b5cf6" }} />
                            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>EXIT NODE</span>
                        </div>
                        <div className="font-mono font-semibold text-white" style={{ fontSize: 11 }}>
                            {nodes.exit?.provider}
                        </div>
                        <div className="font-mono" style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>
                            {nodes.exit?.location} · {nodes.exit?.ip}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Auto-Rotation Timer ── */
export function AutoRotation({ timeToRotation, autoRotate, onToggle }) {
    const [remaining, setRemaining] = useState(timeToRotation || 0);

    useEffect(() => {
        const interval = setInterval(() => {
            setRemaining(r => Math.max(0, r - 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [timeToRotation]);

    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);

    return (
        <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span style={{ fontSize: 14 }}>🧠</span>
                    <span className="font-semibold text-white text-sm">Smart Rotation</span>
                </div>
                {/* Toggle */}
                <button onClick={onToggle}
                    className="relative w-10 h-5 rounded-full transition-all duration-300"
                    style={{
                        background: autoRotate ? "rgba(16,185,129,0.25)" : "rgba(255,255,255,0.1)",
                        border: `1px solid ${autoRotate ? "rgba(16,185,129,0.4)" : "rgba(255,255,255,0.15)"}`,
                    }}>
                    <div className="absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300"
                        style={{
                            left: autoRotate ? "calc(100% - 18px)" : "2px",
                            background: autoRotate ? "#10B981" : "rgba(255,255,255,0.4)",
                            boxShadow: autoRotate ? "0 0 8px rgba(16,185,129,0.4)" : "none",
                        }} />
                </button>
            </div>

            <div className="flex items-center gap-3">
                <div className="flex items-baseline gap-1">
                    <span className="font-mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Next rotation in:</span>
                    <span className="font-mono font-bold" style={{
                        fontSize: 16,
                        color: autoRotate ? "#10B981" : "rgba(255,255,255,0.2)",
                    }}>
                        {autoRotate ? `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}` : "OFF"}
                    </span>
                </div>
            </div>

            {autoRotate && (
                <div className="mt-2 h-0.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <div className="h-full rounded-full transition-all duration-1000"
                        style={{
                            width: `${(remaining / (15 * 60 * 1000)) * 100}%`,
                            background: "linear-gradient(90deg, #10B981, #6366F1)",
                        }} />
                </div>
            )}

            <div className="mt-2 flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full" style={{ background: autoRotate ? "#10B981" : "rgba(255,255,255,0.15)" }} />
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>
                    {autoRotate ? "Nodes automatically rotate for security" : "Auto-rotation paused"}
                </span>
            </div>
        </div>
    );
}
