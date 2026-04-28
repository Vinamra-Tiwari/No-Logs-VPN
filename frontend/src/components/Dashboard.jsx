import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Globe,
  Zap,
  Activity,
  Smartphone,
  Settings as SettingsIcon,
  Lock,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  Power,
  Clock,
  Cpu,
  Database,
  Copy,
  CheckCircle2,
  X
} from 'lucide-react';
import { mockApi, servers } from '../services/mockApi';
import { QRCodeSVG } from 'qrcode.react';
import Settings from './Settings';
import ServerList from './ServerList';

// --- Toast Component ---
const Toast = ({ message, type = "success", onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: 50, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    className={`fixed bottom-8 right-8 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border ${type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
      }`}
  >
    <CheckCircle2 size={18} />
    <span className="text-sm font-bold">{message}</span>
    <button onClick={onClose} className="ml-2 hover:opacity-70 transition-opacity">
      <X size={14} />
    </button>
  </motion.div>
);

// --- Sub-Components ---

const StatCard = ({ icon: Icon, label, value, subValue, color = "indigo" }) => (
  <motion.div
    whileHover={{ y: -2 }}
    className="glass-panel p-4 flex flex-col gap-1"
  >
    <div className="flex items-center gap-2 text-slate-400 mb-1">
      <Icon size={14} className={`text-${color}-400`} />
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </div>
    <div className="text-xl font-bold text-white font-mono">{value}</div>
    <div className="text-[10px] text-slate-500 font-medium">{subValue}</div>
  </motion.div>
);

const NodeFlow = ({ connected, nodes }) => {
  const hops = [
    { id: 'user', label: 'Your Device', icon: Smartphone, color: '#F8FAFC' },
    { id: 'entry', label: nodes?.entry?.provider || 'Entry Node', icon: Cpu, color: '#6366F1' },
    { id: 'exit', label: nodes?.exit?.provider || 'Exit Node', icon: Database, color: '#8B5CF6' },
    { id: 'web', label: 'Internet', icon: Globe, color: '#10B981' },
  ];

  return (
    <div className="glass-panel p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <Activity size={16} className="text-indigo-400" />
          Multi-Hop Visualization
        </h3>
        {connected && (
          <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
            <div className="status-pulse">
              <span className="status-pulse-dot bg-indigo-400"></span>
              <span className="status-pulse-core bg-indigo-500"></span>
            </div>
            <span className="text-[10px] font-bold text-indigo-400 uppercase">Encrypted Path</span>
          </div>
        )}
      </div>

      <div className="relative flex items-center justify-between px-4 py-8">
        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/5 -translate-y-1/2 z-0" />
        {connected && (
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            className="absolute top-1/2 left-0 w-full h-[2px] bg-gradient-to-r from-indigo-500 via-violet-400 to-emerald-500 -translate-y-1/2 z-0 origin-left"
          />
        )}

        {hops.map((hop, i) => (
          <div key={hop.id} className="relative z-10 flex flex-col items-center gap-3">
            <motion.div
              animate={connected ? {
                boxShadow: [`0 0 0px ${hop.color}00`, `0 0 20px ${hop.color}44`, `0 0 0px ${hop.color}00`],
              } : {}}
              transition={{ repeat: Infinity, duration: 3, delay: i * 0.5 }}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors duration-500 ${connected ? 'bg-slate-900 border-2' : 'bg-slate-900/50 border border-white/5'
                }`}
              style={{ borderColor: connected ? hop.color : 'rgba(255,255,255,0.05)' }}
            >
              <hop.icon size={20} style={{ color: connected ? hop.color : '#475569' }} />
            </motion.div>
            <div className="flex flex-col items-center">
              <span className={`text-[10px] font-bold uppercase tracking-tight ${connected ? 'text-white' : 'text-slate-600'}`}>
                {hop.label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const QRPanel = ({ onGenerate, qrData, setQrData, loading, setLoading, addToast }) => {
  const [deviceName, setDeviceName] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    let timer;
    if (qrData && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [qrData, timeLeft]);

  const handleGenerate = async (name) => {
    setLoading(true);
    try {
      const data = await onGenerate(name);
      setQrData(data);
      setTimeLeft(120); // 2 minutes
      addToast("QR Config Generated Successfully");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (qrData?.config) {
      navigator.clipboard.writeText(qrData.config);
      addToast("Config Copied to Clipboard");
    }
  };

  const isExpired = timeLeft <= 0 && qrData;

  return (
    <div className="glass-panel p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <Smartphone size={16} className="text-purple-400" />
          QR Provisioning
        </h3>
      </div>

      {!qrData ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/5">
            <p className="text-xs text-slate-400 leading-relaxed">
              Generate a temporary WireGuard configuration for your mobile device. No logs are stored beyond this session.
            </p>
          </div>
          <input
            type="text"
            placeholder="Device Name (e.g. iPhone 15)"
            value={deviceName}
            onChange={(e) => setDeviceName(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
          />
          <button
            onClick={() => handleGenerate(deviceName)}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition-all disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate Config"}
          </button>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4">
          <div className={`relative p-3 bg-white rounded-2xl shadow-2xl transition-all duration-500 ${isExpired ? 'blur-md opacity-30 grayscale pointer-events-none' : 'shadow-purple-500/20'}`}>
            <QRCodeSVG value={qrData.config} size={160} level="H" />
            {isExpired && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Lock className="text-slate-900" size={48} />
              </div>
            )}
          </div>

          <div className="text-center">
            {isExpired ? (
              <div className="text-xs font-bold text-rose-400 uppercase tracking-widest">Config Expired</div>
            ) : (
              <div className="flex items-center gap-2">
                <Shield size={12} className="text-emerald-400" />
                <span className="text-xs font-mono text-white">Active Session Config</span>
              </div>
            )}
          </div>

          <div className="flex gap-2 w-full">
            {!isExpired ? (
              <button
                onClick={handleCopy}
                className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-wider hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                <Copy size={12} />
                Copy Config
              </button>
            ) : (
              <button
                onClick={() => handleGenerate(deviceName)}
                className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold uppercase tracking-wider transition-all"
              >
                Regenerate QR
              </button>
            )}
            <button
              onClick={() => { setQrData(null); setTimeLeft(0); }}
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-wider hover:bg-white/10 transition-all"
            >
              Reset
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// --- Main Dashboard ---

export default function Dashboard() {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [session, setSession] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [nodes, setNodes] = useState(null);
  const [selectedServer, setSelectedServer] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rotationTimer, setRotationTimer] = useState(900);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success") => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  useEffect(() => {
    const init = async () => {
      const sess = await mockApi.createSession();
      setSession(sess);
    };
    init();
  }, []);

  useEffect(() => {
    let interval;
    if (connected) {
      interval = setInterval(async () => {
        const m = await mockApi.getMetrics();
        setMetrics(m);
        setRotationTimer(prev => (prev > 0 ? prev - 1 : 900));
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [connected]);

  const handleConnect = async (server) => {
    if (connecting) return;
    setError(null);

    // If clicking the same server while connected, disconnect
    if (connected && selectedServer?.id === server.id) {
      await mockApi.disconnect();
      setConnected(false);
      setMetrics(null);
      addToast("Disconnected from VPN", "info");
      return;
    }

    setSelectedServer(server);
    setConnecting(true);
    try {
      const res = await mockApi.connect(server.id);
      setConnected(true);
      setNodes(res.nodes);
      addToast(`Connected to ${server.country}`);
      setActiveTab('dashboard');
    } catch (err) {
      setError(err.message);
      addToast(err.message, "error");
    } finally {
      setConnecting(false);
    }
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const rs = s % 60;
    return `${m}:${rs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-mesh flex">
      <div className="bg-grid fixed inset-0 opacity-20 pointer-events-none" />

      {/* Toast Container */}
      <AnimatePresence>
        {toasts.map(t => (
          <Toast key={t.id} {...t} onClose={() => setToasts(prev => prev.filter(x => x.id !== t.id))} />
        ))}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 p-6 flex flex-col gap-8 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Shield className="text-white" size={20} />
          </div>
          <div>
            <div className="font-black text-lg tracking-tighter italic">NEXUS</div>
            <div className="text-[8px] font-bold text-indigo-400 uppercase tracking-[0.2em] -mt-1">Secure Tunnel</div>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Activity },
            { id: 'audit', label: 'Privacy Audit', icon: Shield },
            { id: 'devices', label: 'Devices', icon: Smartphone },
            { id: 'settings', label: 'Settings', icon: SettingsIcon },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:bg-white/5'
                }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto">
          <div className="glass-panel p-4 group cursor-help relative">
            <div className="flex items-center gap-2 mb-2">
              <Lock size={14} className="text-emerald-400" />
              <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">Privacy Mode</span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium leading-relaxed">
              No activity, IP, or DNS logs are stored in this session.
            </div>
            <div className="tooltip">Strict Zero-Logs Policy Active</div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 z-10 overflow-y-auto">
        <header className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-2xl font-black tracking-tight">
              {activeTab === 'dashboard' ? 'Network Overview' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h1>
            <p className="text-slate-500 text-sm font-medium">Ephemeral Node Infrastructure v2.5.0</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Session ID</div>
              <div className="text-xs font-mono text-white">{session?.id || 'Initializing...'}</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10B981]" />
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-12 gap-6"
            >
              <div className="col-span-8 space-y-6">
                <div className="glass-panel p-8 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-600 via-violet-400 to-emerald-500 opacity-50" />
                  <div className="flex items-center justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${connected ? 'bg-emerald-500 shadow-[0_0_15px_#10B981]' : 'bg-rose-500 shadow-[0_0_15px_#F43F5E]'}`} />
                        <span className="text-lg font-black uppercase tracking-tighter">
                          {connecting ? "Establishing Tunnel..." : connected ? "Protected" : "Unprotected"}
                        </span>
                      </div>
                      <div className="flex items-center gap-6">
                        <div>
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Current Server</div>
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{selectedServer?.flag || "🌐"}</span>
                            <span className="text-lg font-bold">{selectedServer?.country || "Not Connected"}</span>
                          </div>
                        </div>
                        <div className="w-px h-10 bg-white/5" />
                        <div>
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Virtual IP</div>
                          <div className="text-lg font-mono font-bold text-indigo-400">{metrics?.ip || "---.---.---.---"}</div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleConnect(selectedServer || { id: 'in-1' })}
                      disabled={connecting}
                      className={`w-24 h-24 rounded-full flex flex-col items-center justify-center gap-1 transition-all duration-500 ${connected
                        ? 'bg-emerald-500/10 border-2 border-emerald-500 text-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.2)]'
                        : 'bg-indigo-600 border-2 border-indigo-500 text-white shadow-[0_0_30px_rgba(0,102,255,0.3)] hover:scale-105'
                        }`}
                    >
                      <Power size={32} className={connecting ? 'animate-spin' : ''} />
                      <span className="text-[10px] font-black uppercase">{connected ? "ON" : "OFF"}</span>
                    </button>
                  </div>
                  {error && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="mt-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-rose-400">
                      <AlertTriangle size={18} />
                      <span className="text-xs font-bold">{error}</span>
                    </motion.div>
                  )}
                </div>
                <NodeFlow connected={connected} nodes={nodes} />
                <div className="grid grid-cols-3 gap-4">
                  <StatCard icon={Zap} label="Latency" value={metrics ? `${metrics.latency} ms` : "---"} subValue={metrics?.latency < 50 ? "Excellent" : "Average"} color="violet" />
                  <StatCard icon={RefreshCw} label="Rotation" value={formatTime(rotationTimer)} subValue="Next Node Shift" color="purple" />
                  <StatCard icon={Lock} label="Encryption" value="AES-256-GCM" subValue="Quantum Resistant" color="emerald" />
                </div>

                {/* Privacy Features List */}
                <div className="glass-panel p-6">
                  <h3 className="text-sm font-bold mb-6 flex items-center gap-2">
                    <Shield size={16} className="text-emerald-400" />
                    Advanced Privacy Features
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: "RAM-Only Infrastructure", desc: "No data ever touches a hard drive", icon: Cpu, active: true },
                      { label: "DNS Leak Protection", desc: "Private DNS queries only", icon: Globe, active: true },
                      { label: "Perfect Forward Secrecy", desc: "New keys for every session", icon: Lock, active: true },
                      { label: "Obfuscated Traffic", desc: "Bypasses deep packet inspection", icon: Zap, active: true },
                    ].map((feat, i) => (
                      <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                          <feat.icon size={16} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white mb-1">{feat.label}</div>
                          <div className="text-[10px] text-slate-500 leading-tight">{feat.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="col-span-4 space-y-6">
                <QRPanel
                  onGenerate={mockApi.generateConfig}
                  qrData={qrData}
                  setQrData={setQrData}
                  loading={qrLoading}
                  setLoading={setQrLoading}
                  addToast={addToast}
                />
                <div className="glass-panel p-6">
                  <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                    <Globe size={16} className="text-indigo-400" />
                    Quick Connect
                  </h3>
                  <div className="space-y-2">
                    {servers.map(s => (
                      <button
                        key={s.id}
                        onClick={() => handleConnect(s)}
                        className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{s.flag}</span>
                          <div className="text-left">
                            <div className="text-xs font-bold text-white">{s.country}</div>
                            <div className="text-[10px] text-slate-500">{s.city}</div>
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-slate-600 group-hover:text-white transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'audit' && (
            <motion.div key="audit" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 space-y-6">
                  <div className="glass-panel p-8">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                      <Shield className="text-emerald-400" size={24} />
                      Real-Time Security Audit
                    </h2>
                    <div className="space-y-4">
                      {[
                        { label: "IP Masking", status: connected ? "Active" : "Inactive", desc: connected ? `Your real IP is hidden behind ${metrics?.ip}` : "Real IP is currently exposed", active: connected },
                        { label: "DNS Encryption", status: "Active", desc: "DNS queries are routed through encrypted Nexus resolvers", active: true },
                        { label: "Traffic Obfuscation", status: "Active", desc: "VPN traffic is masked as standard HTTPS web traffic", active: true },
                        { label: "RAM-Only Verification", status: "Verified", desc: "Server nodes confirmed running on volatile memory only", active: true },
                        { label: "Quantum Resistance", status: "Enabled", desc: "Post-quantum cryptographic layer is active", active: true },
                      ].map((item, i) => (
                        <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                          <div>
                            <div className="text-sm font-bold text-white">{item.label}</div>
                            <div className="text-xs text-slate-500">{item.desc}</div>
                          </div>
                          <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${item.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                            {item.status}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="glass-panel p-6 bg-indigo-600/10 border-indigo-500/20">
                    <h3 className="text-sm font-bold mb-4 text-indigo-400">Audit Score</h3>
                    <div className="text-5xl font-black text-white mb-2">{connected ? "98" : "42"}<span className="text-lg text-slate-500">/100</span></div>
                    <div className="text-xs text-slate-400 leading-relaxed">
                      {connected ? "Your connection is highly secure. All privacy layers are active and verified." : "Warning: Your connection is currently unprotected. Connect to a server to enable privacy layers."}
                    </div>
                  </div>
                  <div className="glass-panel p-6">
                    <h3 className="text-sm font-bold mb-4">Session Integrity</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        <span>Encryption Strength</span>
                        <span className="text-white">256-bit</span>
                      </div>
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="w-full h-full bg-indigo-500" />
                      </div>
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        <span>Anonymity Level</span>
                        <span className="text-white">{connected ? "High" : "Low"}</span>
                      </div>
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full bg-emerald-500 transition-all duration-1000 ${connected ? 'w-full' : 'w-1/3'}`} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Settings />
            </motion.div>
          )}

          {activeTab === 'devices' && (
            <motion.div key="devices" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="text-center py-20">
              <Smartphone size={48} className="mx-auto text-slate-700 mb-4" />
              <h3 className="text-lg font-bold text-white">Device Manager</h3>
              <p className="text-sm text-slate-500">Manage your connected devices here.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
