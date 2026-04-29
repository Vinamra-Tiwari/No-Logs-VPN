import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Plus, Trash2, QrCode, Download, Activity, Users, ArrowUpRight, ArrowDownRight, Server, X, AlertTriangle, Copy, CheckCircle, Clock } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';

import LiveRouteMap from './dashboard/LiveRouteMap';
import NodeTelemetryMatrix from './dashboard/NodeTelemetryMatrix';
import TerminalFeed from './dashboard/TerminalFeed';
import ConnectionThreatPanel from './dashboard/ConnectionThreatPanel';
import DeviceTable from './dashboard/DeviceTable';

export default function AdminDashboard() {
  const { token, logout } = useAuth();
  const [clients, setClients] = useState([]);
  const [stats, setStats] = useState({ totalClients: 0, activeClients: 0, totalRx: 0, totalTx: 0, entryNode: 'Singapore', exitNode: 'Germany' });
  const [dataHistory, setDataHistory] = useState([]);
  const [ephemeralHours, setEphemeralHours] = useState(24);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [killSwitch, setKillSwitch] = useState(false);
  const [qrModalData, setQrModalData] = useState(null); // { config, name }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients);
        if (data.ephemeralHours) setEphemeralHours(data.ephemeralHours);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false });
        setDataHistory(prev => {
          const rxMB = parseFloat((data.totalRx / 1024 / 1024).toFixed(2)) || 0;
          const txMB = parseFloat((data.totalTx / 1024 / 1024).toFixed(2)) || 0;
          const newHistory = [...prev, { time: timeStr, rx: rxMB, tx: txMB }];
          return newHistory.slice(-15);
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchClients();
    fetchStats();
    const interval = setInterval(() => {
      fetchClients();
      fetchStats();
    }, 10000);
    return () => clearInterval(interval);
  }, [token]);

  const handleCreateClient = async (e) => {
    e.preventDefault();
    if (!newClientName) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newClientName, killSwitch })
      });
      const data = await res.json();
      if (res.ok) {
        setCreateModalOpen(false);
        setNewClientName('');
        setKillSwitch(false);
        setQrModalData({ config: data.config, name: data.name });
        showToast(`Client "${data.name}" created successfully`);
        fetchClients();
        fetchStats();
      } else {
        setError(data.error || 'Failed to create client');
        showToast(data.error || 'Failed to create client', 'error');
      }
    } catch (err) {
      console.error(err);
      setError('Network error: Could not reach the server');
      showToast('Network error: Could not reach the server', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (id) => {
    if (!window.confirm("Are you sure you want to revoke this client?")) return;
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('Client revoked successfully');
        fetchClients();
        fetchStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleShowQR = async (id, name) => {
    try {
      const res = await fetch(`/api/clients/${id}/config`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setQrModalData({ config: data.config, name });
      } else {
        showToast('Failed to fetch client config', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error', 'error');
    }
  };

  const handleDownload = async (id, name) => {
    try {
      const res = await fetch(`/api/clients/${id}/config`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([data.config], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${name.replace(/\s+/g, '_')}.conf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast(`Config downloaded for ${name}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyConfig = () => {
    if (qrModalData?.config) {
      navigator.clipboard.writeText(qrModalData.config);
      setCopied(true);
      showToast('Config copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  const formatTimeLeft = (createdAt) => {
    if (!createdAt) return '';
    // SQLite stores in UTC
    const createdDate = new Date(createdAt + 'Z'); 
    const expiryDate = new Date(createdDate.getTime() + ephemeralHours * 60 * 60 * 1000);
    const now = new Date();
    const diffMs = expiryDate - now;
    
    if (diffMs <= 0) return 'Expired';
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${mins}m left`;
  };

  return (
    <div className="min-h-screen bg-[#060911] text-slate-300 font-sans p-4 md:p-8">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.95 }}
            className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border backdrop-blur-xl ${
              toast.type === 'error' 
                ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            }`}
          >
            {toast.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            <span className="text-sm font-medium font-mono">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70">
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
              <Shield className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-wide">NEXUS<span className="font-light text-cyan-400">GATEWAY</span></h1>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"></span>
                SECURE ADMIN SESSION
              </div>
            </div>
          </div>
          <button 
            onClick={logout}
            className="px-4 py-2 text-xs font-mono text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 rounded-lg transition-colors uppercase tracking-wider"
          >
            Disconnect
          </button>
        </div>

        {/* Centerpiece Map */}
        <LiveRouteMap entryNode={stats.entryNode} exitNode={stats.exitNode} />

        {/* Telemetry Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 h-[360px]">
            <ConnectionThreatPanel />
          </div>
          <div className="lg:col-span-1 h-[360px]">
            <NodeTelemetryMatrix dataHistory={dataHistory} />
          </div>
          <div className="lg:col-span-1 h-[360px]">
            <TerminalFeed clients={clients} />
          </div>
        </div>

        {/* Connected Devices Table */}
        <DeviceTable 
          clients={clients}
          onShowQR={handleShowQR}
          onDownload={handleDownload}
          onRevoke={handleRevoke}
          onAddClient={() => { setCreateModalOpen(true); setError(null); }}
          formatTimeLeft={formatTimeLeft}
          formatBytes={formatBytes}
        />
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 w-full max-w-md relative overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">New Connection Profile</h3>
                <button onClick={() => { setCreateModalOpen(false); setError(null); }} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400 text-sm"
                >
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              <form onSubmit={handleCreateClient}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Device Name</label>
                    <input
                      type="text"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      placeholder="e.g., iPhone 15 Pro, MacBook"
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none text-white placeholder-slate-600"
                      required
                      autoFocus
                    />
                  </div>
                  <label className="flex items-center gap-3 p-3 mt-2 rounded-xl border border-slate-800 bg-slate-900 cursor-pointer hover:border-cyan-500/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={killSwitch}
                      onChange={(e) => setKillSwitch(e.target.checked)}
                      className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-500 bg-slate-800 border-slate-700 cursor-pointer"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-white">Enable Kill Switch</span>
                      <span className="text-xs text-slate-400">Blocks local/non-VPN traffic (Linux clients only).</span>
                    </div>
                  </label>
                </div>
                <div className="mt-8 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => { setCreateModalOpen(false); setError(null); }}
                    className="px-4 py-2 border border-slate-700 hover:bg-slate-800 rounded-xl transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-white transition-colors text-sm font-medium shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                  >
                    {loading ? 'Provisioning...' : 'Create Profile'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QR Code Modal */}
      <AnimatePresence>
        {qrModalData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-8 w-full max-w-sm relative flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                <QrCode className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Profile Ready</h3>
              <p className="text-slate-400 text-sm mb-6">
                Scan this QR code with the <strong className="text-cyan-400">WireGuard app</strong> on <strong className="text-white">{qrModalData.name}</strong> to connect.
              </p>
              
              <div className="bg-white p-4 rounded-2xl shadow-xl shadow-cyan-500/10 mb-6">
                <QRCodeSVG value={qrModalData.config} size={220} level="M" />
              </div>

              <p className="text-[11px] text-slate-500 mb-6 leading-relaxed max-w-[280px]">
                Open WireGuard → Tap "+" → "Scan from QR code" → Point camera at this code
              </p>

              <div className="flex gap-3 w-full">
                <button
                  onClick={handleCopyConfig}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-white transition-colors text-sm font-medium"
                >
                  {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy Config'}
                </button>
                <button
                  onClick={() => setQrModalData(null)}
                  className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-white transition-colors font-medium text-sm shadow-lg shadow-cyan-500/20"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
