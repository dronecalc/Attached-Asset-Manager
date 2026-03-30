import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from "recharts";
import type { TrajectoryPoint } from "@workspace/api-client-react";

interface TrajectoryChartProps {
  data: TrajectoryPoint[];
}

export function TrajectoryChart({ data }: TrajectoryChartProps) {
  if (!data || data.length === 0) return null;

  return (
    <div className="w-full h-[400px] mt-6 p-4 rounded-lg bg-zinc-950/50 border border-border">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          
          <XAxis 
            dataKey="range" 
            stroke="#71717a" 
            tick={{ fill: '#a1a1aa', fontFamily: 'JetBrains Mono', fontSize: 12 }}
            tickMargin={10}
            label={{ value: 'Range (yards)', position: 'insideBottom', offset: -10, fill: '#71717a', fontSize: 12 }}
          />
          
          <YAxis 
            yAxisId="drop"
            stroke="#71717a" 
            tick={{ fill: '#a1a1aa', fontFamily: 'JetBrains Mono', fontSize: 12 }}
            tickFormatter={(val) => `${val}"`}
            label={{ value: 'Drop (in)', angle: -90, position: 'insideLeft', fill: '#71717a', fontSize: 12 }}
          />
          
          <YAxis 
            yAxisId="wind"
            orientation="right"
            stroke="#71717a" 
            tick={{ fill: '#a1a1aa', fontFamily: 'JetBrains Mono', fontSize: 12 }}
            tickFormatter={(val) => `${val}"`}
            label={{ value: 'Wind Drift (in)', angle: 90, position: 'insideRight', fill: '#71717a', fontSize: 12 }}
          />

          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#09090b', 
              borderColor: '#27272a',
              borderRadius: '6px',
              fontFamily: 'JetBrains Mono',
              fontSize: '13px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
            }}
            itemStyle={{ color: '#e4e4e7' }}
            labelStyle={{ color: '#a1a1aa', marginBottom: '8px', borderBottom: '1px solid #27272a', paddingBottom: '4px' }}
            formatter={(value: number, name: string) => [
              `${value.toFixed(2)} in`, 
              name === 'drop' ? 'Bullet Drop' : 'Wind Drift'
            ]}
            labelFormatter={(label) => `Range: ${label} yd`}
          />
          
          <ReferenceLine y={0} yAxisId="drop" stroke="#52525b" strokeDasharray="3 3" />
          
          <Line 
            yAxisId="drop"
            type="monotone" 
            dataKey="drop" 
            stroke="#ff9d00" 
            strokeWidth={3} 
            dot={false}
            activeDot={{ r: 6, fill: '#ff9d00', stroke: '#09090b', strokeWidth: 2 }}
            animationDuration={1500}
          />
          
          <Line 
            yAxisId="wind"
            type="monotone" 
            dataKey="windDrift" 
            stroke="#3b82f6" 
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            animationDuration={1500}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
