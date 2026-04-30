import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getProjects, createProject, getClients, createClient, revokeClient } from '../services/api';
import Projects from './Projects';
import Nodes from './Nodes';
import RouteBuilder from './RouteBuilder';
import { Shield, Plus, QrCode, Trash2, ArrowRight, X, AlertTriangle, CheckCircle, Server, Activity, ArrowUpRight, ArrowDownRight, Copy, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';

export default function AdminDashboard() {
  const { token, logout } = useAuth();
  const [selectedProject, setSelectedProject] = useState(null);
  const [clients, setClients] = useState([]);
  const [toast, setToast] = useState(null);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [qrModalData, setQrModalData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    if (selectedProject) {
      fetchClients();
    }
  }, [selectedProject]);

  const fetchClients = async () => {
    try {
      const res = await getClients(selectedProject.id);
      setClients(res.clients);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    if (!newClientName) return;
    setLoading(true);
    setError(null);
    try {
      const data = await createClient(selectedProject.id, newClientName);
      setCreateModalOpen(false);
      setNewClientName('');
      setQrModalData({ config: data.config, name: data.name });
      showToast(`Client "${data.name}" provisioned`);
      fetchClients();
    } catch (err) {
      setError(err.error || 'Failed to create client');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (id) => {
    if (!window.confirm("Are you sure you want to revoke this client?")) return;
    try {
      await revokeClient(id);
      showToast('Client revoked successfully');
      fetchClients();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyConfig = () => {
    if (qrModalData?.config) {
      navigator.clipboard.writeText(qrModalData.config);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto min-h-screen">
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
            <span className="text-sm font-medium">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70"><X className="w-3 h-3" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Nexus Orchestrator</h1>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              BYOVPS Control Plane
            </div>
          </div>
        </div>
        <button onClick={logout} className="px-4 py-2 text-sm text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 rounded-lg transition-colors">
          Logout
        </button>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-3 space-y-6">
          <Projects onSelectProject={setSelectedProject} />
        </div>
        
        <div className="col-span-9 space-y-8">
          {!selectedProject ? (
            <div className="flex flex-col items-center justify-center py-32 text-slate-500 glass-panel">
              <Server size={48} className="mb-4 text-slate-700" />
              <h2 className="text-xl font-bold text-white mb-2">No Project Selected</h2>
              <p>Select or create a project from the left sidebar to start orchestrating.</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div key={selectedProject.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                
                <Nodes project={selectedProject} />
                <RouteBuilder project={selectedProject} />

                {/* Clients Section */}
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <QrCode className="text-cyan-400" />
                      Client Provisioning
                    </h2>
                    <button onClick={() => setCreateModalOpen(true)} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-white text-sm font-bold flex items-center gap-2 transition-colors">
                      <Plus size={16} /> Add Client
                    </button>
                  </div>

                  <div className="glass-panel overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-slate-400 uppercase bg-slate-900/50">
                        <tr>
                          <th className="px-6 py-4">Name</th>
                          <th className="px-6 py-4">Assigned IP</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clients.length === 0 ? (
                          <tr>
                            <td colSpan="3" className="px-6 py-8 text-center text-slate-500">
                              No clients provisioned yet.
                            </td>
                          </tr>
                        ) : (
                          clients.map((client) => (
                            <tr key={client.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                              <td className="px-6 py-4 font-bold text-white">{client.name}</td>
                              <td className="px-6 py-4 font-mono text-cyan-400">{client.assigned_ip}</td>
                              <td className="px-6 py-4 flex justify-end gap-3">
                                <button onClick={() => handleRevoke(client.id)} className="text-slate-500 hover:text-rose-400 transition-colors">
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Modals */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 w-full max-w-md relative overflow-hidden">
            <h3 className="text-xl font-bold mb-6 text-white">Provision New Client</h3>
            {error && <div className="mb-4 text-rose-400 text-sm">{error}</div>}
            <form onSubmit={handleCreateClient}>
              <input
                type="text"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="Device Name (e.g., iPhone 15)"
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-cyan-500 outline-none"
                required
              />
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setCreateModalOpen(false)} className="px-4 py-2 border border-slate-700 rounded-xl text-white">Cancel</button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-cyan-600 rounded-xl text-white">{loading ? 'Provisioning...' : 'Provision'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {qrModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-8 w-full max-w-sm flex flex-col items-center">
            <h3 className="text-xl font-bold mb-2 text-white">Client Provisioned</h3>
            <p className="text-slate-400 text-sm mb-6 text-center">Scan QR with WireGuard app</p>
            <div className="bg-white p-4 rounded-2xl shadow-xl mb-6">
              <QRCodeSVG value={qrModalData.config} size={220} level="M" />
            </div>
            <div className="flex gap-3 w-full">
              <button onClick={handleCopyConfig} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-white font-bold">{copied ? 'Copied' : 'Copy Config'}</button>
              <button onClick={() => setQrModalData(null)} className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-white font-bold">Done</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
