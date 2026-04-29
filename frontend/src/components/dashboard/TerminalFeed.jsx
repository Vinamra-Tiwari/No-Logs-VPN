import { useState, useEffect, useRef } from 'react';
import { Terminal as TerminalIcon } from 'lucide-react';

export default function TerminalFeed({ clients }) {
  const [logs, setLogs] = useState([]);
  const bottomRef = useRef(null);
  
  // Seed initial logs
  useEffect(() => {
    setLogs([
      { id: 1, time: new Date().toLocaleTimeString('en-US', { hour12: false }), text: 'System initialized. Ephemeral mode active.' },
      { id: 2, time: new Date().toLocaleTimeString('en-US', { hour12: false }), text: 'Tunnel route synced with remote nodes.' }
    ]);
  }, []);

  // Simulate traffic events
  useEffect(() => {
    const interval = setInterval(() => {
      const events = [
        'Traffic spike detected',
        'Exit node routing verified',
        'Handshake state optimal',
        'Node telemetry synced',
        'Packet relay active'
      ];
      const randomEvent = events[Math.floor(Math.random() * events.length)];
      
      setLogs(prev => {
        const newLogs = [...prev, { 
          id: Date.now(), 
          time: new Date().toLocaleTimeString('en-US', { hour12: false }), 
          text: randomEvent 
        }];
        return newLogs.slice(-20); // Keep last 20
      });
    }, 8000); // Every 8 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Hook into client changes
  const prevClientsRef = useRef(clients);
  useEffect(() => {
    if (!prevClientsRef.current) {
      prevClientsRef.current = clients;
      return;
    }
    
    if (clients.length > prevClientsRef.current.length) {
      const newClient = clients.find(c => !prevClientsRef.current.some(pc => pc.id === c.id));
      if (newClient) {
        setLogs(prev => [...prev, {
          id: Date.now(),
          time: new Date().toLocaleTimeString('en-US', { hour12: false }),
          text: `Peer connected: ${newClient.name}`
        }].slice(-20));
      }
    }
    prevClientsRef.current = clients;
  }, [clients]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="backdrop-blur-xl bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xl p-6 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-800/50">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
          <TerminalIcon className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <h3 className="font-bold text-white leading-tight">Terminal Feed</h3>
          <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Live System Logs</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto font-mono text-[11px] sm:text-xs leading-relaxed space-y-2 pr-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {logs.map(log => (
          <div key={log.id} className="text-emerald-400/90 flex gap-3">
            <span className="text-slate-500 shrink-0">[{log.time}]</span>
            <span>{log.text}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
