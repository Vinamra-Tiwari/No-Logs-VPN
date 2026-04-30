import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Shield, Clock, Zap, Lock, Activity, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const features = [
  {
    icon: <Lock className="w-6 h-6 text-emerald-400" />,
    title: "Zero-Log Architecture",
    description: "The platform operates strictly with in-memory routing and a persistent-less traffic state. Absolutely no browsing histories, DNS queries, or session IPs are written to disk. The backend SQLite layer only manages atomic, necessary configuration metadata.",
    borderColor: "border-emerald-500/20",
    bgGlow: "group-hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.15)]",
    iconBg: "bg-emerald-500/10"
  },
  {
    icon: <Clock className="w-6 h-6 text-cyan-400" />,
    title: "Ephemeral Peers",
    description: "To ensure an immutable state of security, client sessions are strictly time-bound. Automated cron-jobs enforce 15-minute or 24-hour peer pruning, forcing the system to self-destruct inactive or expired configurations automatically.",
    borderColor: "border-cyan-500/20",
    bgGlow: "group-hover:shadow-[0_0_30px_-5px_rgba(6,182,212,0.15)]",
    iconBg: "bg-cyan-500/10"
  },
  {
    icon: <Key className="w-6 h-6 text-purple-400" />,
    title: "Perfect Forward Secrecy",
    description: "Cryptographic exposure is severely mitigated through automated, hourly key rotation. The daemon continuously cycles WireGuard public and private keys, guaranteeing that the compromise of one session does not expose past or future traffic.",
    borderColor: "border-purple-500/20",
    bgGlow: "group-hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.15)]",
    iconBg: "bg-purple-500/10"
  },
  {
    icon: <Zap className="w-6 h-6 text-amber-400" />,
    title: "WireGuard Protocol",
    description: "Built natively on modern WireGuard architecture. This guarantees state-of-the-art cryptography (Noise framework, Curve25519, ChaCha20) coupled with an exceptionally small codebase, yielding ultra-high throughput and near-zero latency.",
    borderColor: "border-amber-500/20",
    bgGlow: "group-hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.15)]",
    iconBg: "bg-amber-500/10"
  },
  {
    icon: <Shield className="w-6 h-6 text-rose-400" />,
    title: "Kill Switch Engine",
    description: "Strict iptables and network namespace policies isolate traffic on the device level. If the secure tunnel ever drops or stutters, the local interface is instantaneously locked down to prevent any packet leakage to the unencrypted internet.",
    borderColor: "border-rose-500/20",
    bgGlow: "group-hover:shadow-[0_0_30px_-5px_rgba(244,63,94,0.15)]",
    iconBg: "bg-rose-500/10"
  },
  {
    icon: <Activity className="w-6 h-6 text-blue-400" />,
    title: "Node Telemetry",
    description: "A continuous, localized monitoring matrix tracking byte-level transmission and tunnel stability across ingress and egress nodes. Advanced diagnostics enable immediate identification of latency spikes or unauthorized payload behaviors.",
    borderColor: "border-blue-500/20",
    bgGlow: "group-hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.15)]",
    iconBg: "bg-blue-500/10"
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function Documentation() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#060911] text-slate-300 font-sans p-4 md:p-8 relative overflow-hidden">
      {/* Background Glow Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-[1400px] mx-auto space-y-8 relative z-10">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4 backdrop-blur-xl"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
              <BookOpen className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-wide">SYSTEM<span className="font-light text-cyan-400">DOCUMENTATION</span></h1>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)] animate-pulse"></span>
                TERMINOLOGY & ARCHITECTURE
              </div>
            </div>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 text-xs font-mono text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 rounded-lg transition-colors uppercase tracking-wider bg-slate-800/50"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Gateway
          </button>
        </motion.div>

        {/* Intro Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-3xl"
        >
          <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">Platform Capabilities</h2>
          <p className="text-slate-400 text-lg leading-relaxed">
            NEXUS GATEWAY is engineered with a hyper-focus on security, privacy, and performance. 
            Below is a technical breakdown of the core architectural features and terminology utilized across the platform.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              className={`group bg-slate-900/40 border ${feature.borderColor} rounded-2xl p-6 backdrop-blur-xl transition-all duration-300 hover:bg-slate-800/60 ${feature.bgGlow}`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${feature.iconBg} border border-white/5`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-3 tracking-wide">{feature.title}</h3>
              <p className="text-slate-400 leading-relaxed text-sm">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
