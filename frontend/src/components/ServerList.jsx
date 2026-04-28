import React, { useState, useEffect, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
    Search,
    Filter,
    Zap,
    Activity,
    ChevronRight,
    Globe,
    ArrowRight,
    Shield
} from 'lucide-react';
import { mockApi } from '../services/mockApi';

const ServerCard = ({ server, isSelected, onSelect, onConnect }) => {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -2 }}
            className={`glass-panel p-5 cursor-pointer transition-all border-2 ${isSelected ? 'border-blue-500 bg-blue-500/5 shadow-lg shadow-blue-500/10' : 'border-transparent hover:border-white/10'
                }`}
            onClick={() => onSelect(server)}
        >
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                    <span className="text-4xl">{server.flag}</span>
                    <div>
                        <div className="text-lg font-bold text-white leading-tight">{server.country}</div>
                        <div className="text-xs text-slate-500 font-medium">{server.city}</div>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${server.latency < 50 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                        }`}>
                        <Zap size={10} />
                        {server.latency}ms
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                    <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Server Load</div>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${server.load}%` }}
                                className={`h-full ${server.load > 70 ? 'bg-rose-500' : 'bg-blue-500'}`}
                            />
                        </div>
                        <span className="text-[10px] font-mono font-bold text-slate-400">{server.load}%</span>
                    </div>
                </div>
                <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                    <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Protocol</div>
                    <div className="text-[10px] font-bold text-white">WireGuard</div>
                </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-4">
                {server.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                        {tag}
                    </span>
                ))}
            </div>

            <AnimatePresence>
                {isSelected && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="pt-4 border-t border-white/5 space-y-4">
                            <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                                <div className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-2">Multi-Hop Preview</div>
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-bold">YOU</div>
                                    </div>
                                    <ArrowRight size={12} className="text-slate-600" />
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="w-6 h-6 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-[10px] font-bold text-blue-400">R</div>
                                        <span className="text-[8px] text-slate-500">Relay</span>
                                    </div>
                                    <ArrowRight size={12} className="text-slate-600" />
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-[10px] font-bold text-emerald-400">E</div>
                                        <span className="text-[8px] text-slate-500">Exit</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); onConnect(server); }}
                                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-lg shadow-blue-600/20"
                            >
                                Connect to {server.country}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default function ServerList({ onConnect }) {
    const [servers, setServers] = useState([]);
    const [search, setSearch] = useState("");
    const [region, setRegion] = useState("All");
    const [selectedId, setSelectedId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            const data = await mockApi.getServers();
            setServers(data);
            setLoading(false);
        };
        fetch();
    }, []);

    const filteredServers = useMemo(() => {
        return servers.filter(s => {
            const matchesSearch = s.country.toLowerCase().includes(search.toLowerCase()) ||
                s.city.toLowerCase().includes(search.toLowerCase());
            const matchesRegion = region === "All" || s.region === region;
            return matchesSearch && matchesRegion;
        });
    }, [servers, search, region]);

    const regions = ["All", "Europe", "North America", "Asia Pacific"];

    if (loading) return (
        <div className="grid grid-cols-2 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-64 bg-white/5 rounded-2xl animate-pulse" />)}
        </div>
    );

    return (
        <div className="space-y-8">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search country or city..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                    />
                </div>
                <div className="flex gap-2 p-1 rounded-2xl bg-white/5 border border-white/10">
                    {regions.map(r => (
                        <button
                            key={r}
                            onClick={() => setRegion(r)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${region === r ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            {r}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {filteredServers.map(server => (
                        <ServerCard
                            key={server.id}
                            server={server}
                            isSelected={selectedId === server.id}
                            onSelect={(s) => setSelectedId(selectedId === s.id ? null : s.id)}
                            onConnect={onConnect}
                        />
                    ))}
                </AnimatePresence>
            </div>

            {filteredServers.length === 0 && (
                <div className="text-center py-20">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                        <Globe size={32} className="text-slate-700" />
                    </div>
                    <h3 className="text-lg font-bold text-white">No servers found</h3>
                    <p className="text-sm text-slate-500">Try adjusting your search or filters</p>
                </div>
            )}
        </div>
    );
}
