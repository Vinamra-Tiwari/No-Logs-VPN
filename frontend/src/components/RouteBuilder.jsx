import React, { useState, useEffect } from 'react';
import { getNodes, saveRoute, deployProject } from '../services/api';
import { Network, ArrowRight, Save, Rocket, Server, AlertTriangle } from 'lucide-react';

export default function RouteBuilder({ project }) {
  const [nodes, setNodes] = useState([]);
  const [sequence, setSequence] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [message, setMessage] = useState(null);

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

  const addToSequence = (node) => {
    if (!sequence.find(n => n.id === node.id)) {
      setSequence([...sequence, node]);
    }
  };

  const removeFromSequence = (nodeId) => {
    setSequence(sequence.filter(n => n.id !== nodeId));
  };

  const handleSaveRoute = async () => {
    if (sequence.length === 0) return;
    try {
      await saveRoute(project.id, sequence.map(n => n.id));
      setMessage({ type: 'success', text: 'Route saved successfully' });
    } catch (e) {
      setMessage({ type: 'error', text: 'Failed to save route' });
    }
  };

  const handleDeploy = async () => {
    if (sequence.length === 0) return;
    setDeploying(true);
    setMessage(null);
    try {
      // Auto-save route first
      await saveRoute(project.id, sequence.map(n => n.id));
      const res = await deployProject(project.id);
      setMessage({ type: 'success', text: `Deployment successful across ${res.nodes} nodes!` });
      loadNodes();
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: e.error || 'Deployment failed. Check logs.' });
    } finally {
      setDeploying(false);
    }
  };

  if (!project) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Network className="text-violet-400" />
          Route Builder
        </h2>
        <div className="flex gap-2">
          <button onClick={handleSaveRoute} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
            <Save size={16}/> Save Route
          </button>
          <button onClick={handleDeploy} disabled={deploying || sequence.length === 0} className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-all">
            {deploying ? <Rocket size={16} className="animate-bounce" /> : <Rocket size={16}/>}
            {deploying ? 'Deploying...' : 'Deploy to Network'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
          {message.type === 'error' ? <AlertTriangle size={18}/> : <Rocket size={18}/>}
          <span className="text-sm font-bold">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-4 space-y-4">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Available Nodes</div>
          {nodes.filter(n => !sequence.find(sn => sn.id === n.id)).map(n => (
            <div key={n.id} onClick={() => addToSequence(n)} className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-violet-500/50 cursor-pointer flex items-center gap-3 transition-colors">
              <Server size={16} className="text-slate-400" />
              <div>
                <div className="text-sm font-bold text-white">{n.name}</div>
                <div className="text-xs text-slate-500 font-mono">{n.public_ip}</div>
              </div>
            </div>
          ))}
          {nodes.length === 0 && !loading && (
            <div className="text-sm text-slate-500 p-4 border border-dashed border-white/10 rounded-xl">No available nodes. Add nodes first.</div>
          )}
        </div>

        <div className="col-span-8">
          <div className="glass-panel p-6 min-h-[300px]">
             <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Multi-Hop Sequence</div>
             
             {sequence.length === 0 ? (
               <div className="text-center text-slate-500 py-12">Click available nodes to build your tunnel path.</div>
             ) : (
               <div className="flex flex-wrap items-center gap-4">
                 {sequence.map((n, i) => (
                   <React.Fragment key={n.id}>
                     <div onClick={() => removeFromSequence(n.id)} className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all hover:scale-105 ${i === 0 ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : i === sequence.length - 1 ? 'bg-violet-500/10 border-violet-500/50 shadow-[0_0_15px_rgba(139,92,246,0.1)]' : 'bg-indigo-500/10 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.1)]'}`}>
                       <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 px-2 text-[10px] font-black uppercase tracking-widest rounded-full border border-white/10">
                         {i === 0 ? 'Entry' : i === sequence.length - 1 ? 'Exit' : 'Relay'}
                       </div>
                       <div className="text-center mt-2">
                         <div className="font-bold text-white text-sm">{n.name}</div>
                         <div className="text-[10px] text-slate-400 font-mono mt-1">{n.public_ip}</div>
                       </div>
                     </div>
                     {i < sequence.length - 1 && (
                       <ArrowRight className="text-slate-600" />
                     )}
                   </React.Fragment>
                 ))}
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
