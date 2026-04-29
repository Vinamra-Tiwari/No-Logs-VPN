import { Server, Plus, QrCode, Download, Trash2, Clock, Globe2 } from 'lucide-react';

export default function DeviceTable({ 
  clients, 
  onShowQR, 
  onDownload, 
  onRevoke, 
  onAddClient,
  formatTimeLeft,
  formatBytes 
}) {
  const getPing = (latencyMs) => {
    if (!latencyMs) return '---';
    const color = latencyMs < 50 ? 'text-emerald-400' : latencyMs < 120 ? 'text-amber-400' : 'text-red-400';
    return <span className={`${color}`}>{latencyMs}ms</span>;
  };

  const getSessionDuration = (latestHandshake) => {
    if (!latestHandshake) return '0m';
    const diffSeconds = (Date.now() / 1000) - latestHandshake;
    if (diffSeconds > 86400 * 30) return '0m'; // arbitrary sanity check
    const hours = Math.floor(diffSeconds / 3600);
    const mins = Math.floor((diffSeconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <div className="backdrop-blur-xl bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      <div className="p-6 border-b border-slate-800 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Server className="w-5 h-5 text-slate-400" /> Connected Devices
        </h2>
        <button 
          onClick={onAddClient}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors text-sm font-medium shadow-[0_0_15px_rgba(6,182,212,0.3)]"
        >
          <Plus className="w-4 h-4" /> Add Client
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-[10px] text-slate-500 font-mono uppercase bg-slate-900/50">
            <tr>
              <th className="px-6 py-4">Client / Node</th>
              <th className="px-6 py-4">Status / Ping</th>
              <th className="px-6 py-4">Data Transferred</th>
              <th className="px-6 py-4">Session Duration</th>
              <th className="px-6 py-4">Time Remaining</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-slate-500 font-mono text-xs">
                  NO ACTIVE ENDPOINTS
                </td>
              </tr>
            ) : (
              clients.map((client) => {
                // Mock ping for visual demo based on IP or random
                const mockPing = client.stats?.online ? Math.floor(Math.random() * 40) + 20 : null;
                const isTemp = client.kill_switch === 1;

                return (
                  <tr key={client.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-base">{client.name}</span>
                          {isTemp && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                              EPHEMERAL
                            </span>
                          )}
                        </div>
                        <span className="flex items-center gap-1 text-[11px] text-slate-500 font-mono mt-1">
                          <Globe2 className="w-3 h-3" /> Auto-Detected
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${client.stats?.online ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-slate-600'}`}></span>
                          <span className="text-slate-300">{client.stats?.online ? 'ONLINE' : 'OFFLINE'}</span>
                        </div>
                        {client.stats?.online && (
                          <div className="text-[10px] font-mono text-slate-500">
                            Ping: {getPing(mockPing)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                      <span className="text-cyan-400">↓ {formatBytes(client.stats?.rx)}</span>
                      <span className="mx-2 text-slate-600">|</span>
                      <span className="text-purple-400">↑ {formatBytes(client.stats?.tx)}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                      {client.stats?.online ? getSessionDuration(client.stats?.latestHandshake) : '0m'}
                    </td>
                    <td className="px-6 py-4">
                       <span className="flex items-center gap-1.5 text-xs text-amber-500/80 font-mono">
                          <Clock className="w-3.5 h-3.5" />
                          {formatTimeLeft(client.created_at)}
                        </span>
                    </td>
                    <td className="px-6 py-4 flex justify-end gap-3">
                      <button 
                        onClick={() => onShowQR(client.id, client.name)}
                        className="text-slate-400 hover:text-emerald-400 transition-colors"
                        title="Show QR Code"
                      >
                        <QrCode className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => onDownload(client.id, client.name)}
                        className="text-slate-400 hover:text-cyan-400 transition-colors"
                        title="Download Config"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => onRevoke(client.id)}
                        className="text-slate-400 hover:text-red-400 transition-colors"
                        title="Revoke Access"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
