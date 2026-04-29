import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity } from 'lucide-react';

export default function NodeTelemetryMatrix({ dataHistory }) {
  // dataHistory is an array of objects: { time: string, rx: number, tx: number }
  return (
    <div className="backdrop-blur-xl bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xl p-6 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
          <Activity className="w-4 h-4 text-indigo-400" />
        </div>
        <div>
          <h3 className="font-bold text-white leading-tight">Node Telemetry</h3>
          <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Realtime Bandwidth Visualizer</p>
        </div>
      </div>
      
      <div className="flex-1 w-full min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dataHistory} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis 
              dataKey="time" 
              stroke="#475569" 
              fontSize={10} 
              tickMargin={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#475569" 
              fontSize={10}
              tickFormatter={(value) => `${value} MB`}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '0.5rem', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace' }}
              itemStyle={{ color: '#e2e8f0' }}
            />
            <Line 
              type="monotone" 
              dataKey="rx" 
              name="Download"
              stroke="#06b6d4" 
              strokeWidth={2} 
              dot={false}
              activeDot={{ r: 4, fill: '#06b6d4', stroke: '#0f172a', strokeWidth: 2 }}
            />
            <Line 
              type="monotone" 
              dataKey="tx" 
              name="Upload"
              stroke="#a855f7" 
              strokeWidth={2} 
              dot={false} 
              activeDot={{ r: 4, fill: '#a855f7', stroke: '#0f172a', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
