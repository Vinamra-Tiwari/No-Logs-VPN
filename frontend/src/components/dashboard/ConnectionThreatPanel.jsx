import { ShieldAlert, ToggleLeft, ToggleRight } from 'lucide-react';
import { useState } from 'react';

export default function ConnectionThreatPanel() {
  const [toggles, setToggles] = useState({
    killSwitch: true,
    ephemeral: true,
    noLogs: true,
    rotateKeys: false,
    dnsHardening: true
  });

  const handleToggle = (key) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const ToggleItem = ({ label, active, toggleKey }) => (
    <div className="flex items-center justify-between py-2 border-b border-slate-800/50 last:border-0">
      <span className="text-xs text-slate-300">{label}</span>
      <button onClick={() => handleToggle(toggleKey)} className="outline-none">
        {active ? (
          <ToggleRight className="w-5 h-5 text-cyan-400" />
        ) : (
          <ToggleLeft className="w-5 h-5 text-slate-600" />
        )}
      </button>
    </div>
  );

  return (
    <div className="backdrop-blur-xl bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xl p-6 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
          <ShieldAlert className="w-4 h-4 text-red-400" />
        </div>
        <div>
          <h3 className="font-bold text-white leading-tight">Threat Matrix</h3>
          <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Security Posture</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-6 flex-1">
        <div>
          <h4 className="text-[10px] text-slate-500 font-mono mb-3">ACTIVE DEFENSES</h4>
          <div className="space-y-1 font-mono text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">DNS Leak:</span>
              <span className="text-emerald-400">None</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">IPv6 Leak:</span>
              <span className="text-emerald-400">None</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Kill Switch:</span>
              <span className={toggles.killSwitch ? "text-emerald-400" : "text-red-400"}>
                {toggles.killSwitch ? 'Armed' : 'Disarmed'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Logs Stored:</span>
              <span className="text-cyan-400">0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Routing Mode:</span>
              <span className="text-purple-400">Multi-Hop</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-[10px] text-slate-500 font-mono mb-3">TACTICAL TOGGLES</h4>
          <div>
            <ToggleItem label="Global Kill Switch" active={toggles.killSwitch} toggleKey="killSwitch" />
            <ToggleItem label="Ephemeral Clients" active={toggles.ephemeral} toggleKey="ephemeral" />
            <ToggleItem label="No Logs Mode" active={toggles.noLogs} toggleKey="noLogs" />
            <ToggleItem label="Rotate Keys (1h)" active={toggles.rotateKeys} toggleKey="rotateKeys" />
            <ToggleItem label="DNS Hardening" active={toggles.dnsHardening} toggleKey="dnsHardening" />
          </div>
        </div>
      </div>
    </div>
  );
}
