import React, { useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, Tooltip, XAxis } from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';
import { FarmVisitRecord } from '../types/poultry';

interface VisitTrendSparklineProps {
  visits: FarmVisitRecord[];
  className?: string;
}

export const VisitTrendSparkline: React.FC<VisitTrendSparklineProps> = ({ visits, className = '' }) => {
  const { trendData, totalPast7Days, peakDay } = useMemo(() => {
    const data: { dateKey: string; dateFormatted: string; dayLabel: string; visits: number }[] = [];
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dateFormatted = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

      const count = visits.filter((v) => {
        try {
          const recDate = new Date(v.recordedAt);
          const recKey = `${recDate.getFullYear()}-${String(recDate.getMonth() + 1).padStart(2, '0')}-${String(recDate.getDate()).padStart(2, '0')}`;
          return recKey === dateKey;
        } catch {
          return false;
        }
      }).length;

      data.push({
        dateKey,
        dateFormatted,
        dayLabel: i === 0 ? 'Today' : dayLabel,
        visits: count,
      });
    }

    const total = data.reduce((acc, curr) => acc + curr.visits, 0);
    const peak = [...data].sort((a, b) => b.visits - a.visits)[0];

    return { trendData: data, totalPast7Days: total, peakDay: peak };
  }, [visits]);

  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs ${className}`}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <TrendingUp className="h-3.5 w-3.5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              7-Day Visit Trend
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-black text-blue-700 tabular-nums">
            {totalPast7Days} visit{totalPast7Days === 1 ? '' : 's'}
          </span>
          <span className="text-[10px] text-slate-400 block">past 7 days</span>
        </div>
      </div>

      {/* Mini Sparkline Chart */}
      <div className="h-14 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trendData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="sparklineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="dayLabel"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 9, fill: '#64748b', fontWeight: 600 }}
              interval={0}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] shadow-md">
                      <p className="font-semibold text-slate-600">{item.dateFormatted} ({item.dayLabel})</p>
                      <p className="font-bold text-blue-700">
                        {item.visits} {item.visits === 1 ? 'farm visit' : 'farm visits'}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="visits"
              stroke="#1d4ed8"
              strokeWidth={2}
              fill="url(#sparklineGradient)"
              dot={{ r: 2.5, fill: '#1d4ed8', strokeWidth: 1, stroke: '#ffffff' }}
              activeDot={{ r: 4.5, fill: '#1e40af' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
