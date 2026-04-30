import React, { useState, useEffect } from 'react';
import { getProjects, createProject } from '../services/api';
import { Plus, Folder } from 'lucide-react';

export default function Projects({ onSelectProject }) {
  const [projects, setProjects] = useState([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const res = await getProjects();
      setProjects(res.projects);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newProjectName) return;
    try {
      const res = await createProject(newProjectName);
      setProjects([...projects, { id: res.id, name: res.name }]);
      setNewProjectName('');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Folder className="text-indigo-400" />
          Projects
        </h2>
      </div>

      <div className="glass-panel p-6">
        <form onSubmit={handleCreate} className="flex gap-4 mb-6">
          <input
            type="text"
            placeholder="New Project Name"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
          />
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors">
            <Plus size={16} /> Create
          </button>
        </form>

        {loading ? (
          <div className="text-center text-slate-400 py-8">Loading...</div>
        ) : projects.length === 0 ? (
          <div className="text-center text-slate-500 py-8">No projects found. Create one to get started.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(p => (
              <div key={p.id} onClick={() => onSelectProject(p)} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-indigo-500/50 cursor-pointer transition-all hover:-translate-y-1">
                <div className="font-bold text-white text-lg">{p.name}</div>
                <div className="text-xs text-slate-500 font-mono mt-2">ID: {p.id.substring(0,8)}...</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
