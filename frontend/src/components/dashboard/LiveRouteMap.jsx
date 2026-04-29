import { motion } from 'framer-motion';
import { Server, Globe, Lock, Activity, ShieldCheck } from 'lucide-react';

export default function LiveRouteMap({ entryNode, exitNode }) {
  return (
    <div className="backdrop-blur-xl bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xl overflow-hidden relative p-6">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-slate-900/0 to-slate-900/0 pointer-events-none"></div>
      
      <div className="flex justify-between items-center mb-8 relative z-10">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" /> 
            Node Telemetry Matrix
          </h2>
          <p className="text-sm text-slate-400 font-mono mt-1">Multi-Hop Route Integrity</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono uppercase tracking-wider">
          <div className="flex flex-col items-end">
            <span className="text-slate-500">Tunnel Status</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> ACTIVE
            </span>
          </div>
          <div className="flex flex-col items-end border-l border-slate-700 pl-4">
            <span className="text-slate-500">Encryption</span>
            <span className="text-cyan-400">ChaCha20</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between relative z-10 px-4 md:px-12 py-8">
        {/* Connecting Lines */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-800 -translate-y-1/2 -z-10">
          <motion.div 
            className="h-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent"
            animate={{ x: ['-100%', '300%'] }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          />
        </div>

        {/* Client */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 bg-slate-800 border-2 border-slate-700 rounded-xl flex items-center justify-center relative">
            <Lock className="w-6 h-6 text-slate-300" />
            <motion.div 
              className="absolute -inset-2 border border-cyan-500/30 rounded-xl"
              animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
          </div>
          <span className="text-sm font-bold text-white">Client</span>
        </div>

        {/* Latency 1 */}
        <div className="text-[10px] text-cyan-500/80 font-mono bg-slate-900 px-2 border border-slate-800 rounded">
          32ms
        </div>

        {/* Entry Node */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 bg-cyan-900/30 border-2 border-cyan-500/50 rounded-2xl flex items-center justify-center relative shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Server className="w-7 h-7 text-cyan-400" />
            <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900"></span>
          </div>
          <div className="text-center">
            <span className="text-sm font-bold text-white block">{entryNode || 'Entry Node'}</span>
            <span className="text-[10px] text-slate-500 font-mono">RELAY</span>
          </div>
        </div>

        {/* Latency 2 */}
        <div className="text-[10px] text-purple-400/80 font-mono bg-slate-900 px-2 border border-slate-800 rounded">
          148ms
        </div>

        {/* Exit Node */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 bg-purple-900/30 border-2 border-purple-500/50 rounded-2xl flex items-center justify-center relative shadow-[0_0_15px_rgba(168,85,247,0.3)]">
            <Server className="w-7 h-7 text-purple-400" />
            <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900"></span>
          </div>
          <div className="text-center">
            <span className="text-sm font-bold text-white block">{exitNode || 'Exit Node'}</span>
            <span className="text-[10px] text-slate-500 font-mono">EXIT</span>
          </div>
        </div>

        {/* Latency 3 */}
        <div className="text-[10px] text-emerald-500/80 font-mono bg-slate-900 px-2 border border-slate-800 rounded">
          12ms
        </div>

        {/* Internet */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 bg-slate-800 border-2 border-slate-700 rounded-full flex items-center justify-center">
            <Globe className="w-6 h-6 text-slate-400" />
          </div>
          <span className="text-sm font-bold text-white">Internet</span>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-slate-800/50 flex justify-between items-center text-xs font-mono text-slate-500">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          Secure Exit Validated
        </div>
        <div>
          PUBLIC IP: <span className="text-white">HIDDEN (NAT)</span>
        </div>
      </div>
    </div>
  );
}
