import React, { useState, useEffect } from 'react';
import { getNodes, createNode, testNode } from '../services/api';
import { Server, Plus, Play, CheckCircle, XCircle, Loader, Activity } from 'lucide-react';

export default function Nodes({ project }) {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', public_ip: '', ssh_private_key: '' });
  const [testing, setTesting] = useState({});

  useEffect(() => {
    if (project) loadNodes();
  }, [project]);

  const loadNodes = async () => {
    try {
      const res = await getNodes(project.id);
      setNodes(res.nodes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await createNode(project.id, formData);
      setFormData({ name: '', public_ip: '', ssh_private_key: '' });
      loadNodes();
    } catch (e) {
      console.error(e);
    }
  };

  const handleTest = async (nodeId) => {
    setTesting(prev => ({ ...prev, [nodeId]: 'testing' }));
    try {
      await testNode(nodeId);
      setTesting(prev => ({ ...prev, [nodeId]: 'success' }));
    } catch (e) {
      setTesting(prev => ({ ...prev, [nodeId]: 'failed' }));
    }
  };

  if (!project) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Server className="text-emerald-400" />
          Nodes for {project.name}
        </h2>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-4">
          <div className="glass-panel p-6">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2"><Plus size={16}/> Add Node</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400">Node Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400">Public IP</label>
                <input required type="text" value={formData.public_ip} onChange={e => setFormData({...formData, public_ip: e.target.value})} className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400">SSH Private Key</label>
                <textarea required rows={4} value={formData.ssh_private_key} onChange={e => setFormData({...formData, ssh_private_key: e.target.value})} className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"></textarea>
              </div>
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl transition-colors font-bold text-sm">
                Add Node
              </button>
            </form>
          </div>
        </div>

        <div className="col-span-8">
          <div className="glass-panel p-6">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2"><Activity size={16}/> Fleet Status</h3>
            {loading ? (
              <div className="text-slate-400">Loading...</div>
            ) : nodes.length === 0 ? (
              <div className="text-slate-500">No nodes added yet.</div>
            ) : (
              <div className="space-y-3">
                {nodes.map(n => (
                  <div key={n.id} className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-sm">{n.name}</div>
                      <div className="text-xs text-slate-400 font-mono mt-1">{n.public_ip}</div>
                      <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mt-2">Status: <span className={n.status === 'connected' ? 'text-emerald-400' : 'text-amber-400'}>{n.status}</span></div>
                    </div>
                    <div>
                      <button onClick={() => handleTest(n.id)} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold flex items-center gap-2 transition-colors">
                        {testing[n.id] === 'testing' ? <Loader size={14} className="animate-spin text-indigo-400"/> :
                         testing[n.id] === 'success' ? <CheckCircle size={14} className="text-emerald-400"/> :
                         testing[n.id] === 'failed' ? <XCircle size={14} className="text-rose-400"/> :
                         <Play size={14} className="text-indigo-400"/>}
                        Test SSH
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
