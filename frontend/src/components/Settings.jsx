import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Shield,
    RefreshCw,
    Globe,
    Lock,
    Bell,
    Clock,
    Moon,
    Sun,
    Cpu,
    ChevronDown,
    Info
} from 'lucide-react';
import { mockApi, servers } from '../services/mockApi';

const Toggle = ({ enabled, onChange, label, subLabel }) => (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
        <div>
            <div className="text-sm font-bold text-white">{label}</div>
            <div className="text-[10px] text-slate-500 font-medium">{subLabel}</div>
        </div>
        <button
            onClick={() => onChange(!enabled)}
            className={`w-12 h-6 rounded-full relative transition-colors ${enabled ? 'bg-indigo-600' : 'bg-slate-700'}`}
        >
            <motion.div
                animate={{ x: enabled ? 26 : 2 }}
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
            />
        </button>
    </div>
);

const Select = ({ label, value, options, onChange, icon: Icon }) => (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                <Icon size={16} className="text-slate-400" />
            </div>
            <div className="text-sm font-bold text-white">{label}</div>
        </div>
        <div className="relative">
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="appearance-none bg-slate-900 border border-white/10 rounded-xl px-4 py-2 pr-10 text-xs font-bold text-white focus:outline-none focus:border-indigo-500/50"
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        </div>
    </div>
);

export default function Settings() {
    const [settings, setSettings] = useState(null);

    useEffect(() => {
        const fetch = async () => {
            const data = await mockApi.getSettings();
            setSettings(data);
        };
        fetch();
    }, []);

    const update = async (key, val) => {
        const newSettings = { ...settings, [key]: val };
        setSettings(newSettings);
        await mockApi.updateSettings(newSettings);
    };

    const updateNested = async (parent, key, val) => {
        const newSettings = {
            ...settings,
            [parent]: { ...settings[parent], [key]: val }
        };
        setSettings(newSettings);
        await mockApi.updateSettings(newSettings);
    };

    if (!settings) return <div className="animate-pulse space-y-4">
        {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 bg-white/5 rounded-2xl" />)}
    </div>;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto space-y-8"
        >
            {/* Security Section */}
            <section className="space-y-4">
                <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] px-2">Security & Privacy</h3>
                <div className="grid gap-3">
                    <Toggle
                        label="Kill Switch"
                        subLabel="Block internet if VPN disconnects"
                        enabled={settings.killSwitch}
                        onChange={(val) => update('killSwitch', val)}
                    />
                    <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between group relative cursor-help">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                <Lock size={16} className="text-emerald-400" />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-emerald-400">Privacy Mode</div>
                                <div className="text-[10px] text-emerald-500/60 font-medium">Strict zero-logs policy active</div>
                            </div>
                        </div>
                        <Info size={16} className="text-emerald-500/40" />
                        <div className="tooltip">Nexus VPN never stores activity, IP, or DNS logs.</div>
                    </div>
                </div>
            </section>

            {/* Connection Section */}
            <section className="space-y-4">
                <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] px-2">Connection Protocol</h3>
                <div className="grid gap-3">
                    <Toggle
                        label="Auto-Rotation"
                        subLabel="Periodically shift ephemeral nodes"
                        enabled={settings.autoRotate}
                        onChange={(val) => update('autoRotate', val)}
                    />
                    {settings.autoRotate && (
                        <Select
                            label="Rotation Interval"
                            icon={RefreshCw}
                            value={settings.rotationInterval}
                            onChange={(val) => update('rotationInterval', val)}
                            options={[
                                { label: '10 Minutes', value: '10m' },
                                { label: '30 Minutes', value: '30m' },
                                { label: '1 Hour', value: '1h' },
                            ]}
                        />
                    )}
                    <Select
                        label="Default Server"
                        icon={Globe}
                        value={settings.defaultServer}
                        onChange={(val) => update('defaultServer', val)}
                        options={[
                            { label: 'Fastest Available', value: 'fastest' },
                            ...servers.map(s => ({ label: `${s.flag} ${s.country}`, value: s.id }))
                        ]}
                    />
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                                <Cpu size={16} className="text-indigo-400" />
                            </div>
                            <div className="text-sm font-bold text-white">Protocol</div>
                        </div>
                        <div className="flex gap-2">
                            {['WireGuard', 'OpenVPN', 'IKEv2'].map(p => (
                                <button
                                    key={p}
                                    disabled={p !== 'WireGuard'}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${p === 'WireGuard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-white/5 text-slate-600 cursor-not-allowed'
                                        }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Preferences Section */}
            <section className="space-y-4">
                <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] px-2">Preferences</h3>
                <div className="grid gap-3">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                        <div className="flex items-center gap-3 mb-4">
                            <Bell size={16} className="text-slate-400" />
                            <div className="text-sm font-bold text-white">Notifications</div>
                        </div>
                        <div className="space-y-3 pl-11">
                            {[
                                { key: 'qrGenerated', label: 'QR Code Generated' },
                                { key: 'connectionSuccess', label: 'Connection Successful' },
                                { key: 'sessionExpiry', label: 'Session Expiry Warning' },
                            ].map(n => (
                                <div key={n.key} className="flex items-center justify-between">
                                    <span className="text-xs text-slate-400 font-medium">{n.label}</span>
                                    <button
                                        onClick={() => updateNested('notifications', n.key, !settings.notifications[n.key])}
                                        className={`w-8 h-4 rounded-full relative transition-colors ${settings.notifications[n.key] ? 'bg-indigo-600' : 'bg-slate-700'}`}
                                    >
                                        <motion.div
                                            animate={{ x: settings.notifications[n.key] ? 18 : 2 }}
                                            className="absolute top-0.5 w-3 h-3 bg-white rounded-full"
                                        />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                    <Select
                        label="Session Timeout"
                        icon={Clock}
                        value={settings.sessionTimeout}
                        onChange={(val) => update('sessionTimeout', val)}
                        options={[
                            { label: '30 Minutes', value: '30m' },
                            { label: '1 Hour', value: '1h' },
                            { label: '4 Hours', value: '4h' },
                        ]}
                    />
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                {settings.theme === 'dark' ? <Moon size={16} className="text-indigo-400" /> : <Sun size={16} className="text-amber-400" />}
                            </div>
                            <div className="text-sm font-bold text-white">Theme</div>
                        </div>
                        <div className="flex p-1 rounded-xl bg-slate-900 border border-white/10">
                            {['light', 'dark'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => update('theme', t)}
                                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${settings.theme === t ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'
                                        }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </motion.div>
    );
}
