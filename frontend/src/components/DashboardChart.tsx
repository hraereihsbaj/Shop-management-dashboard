import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ChartDataPoint {
  date: string;
  rawDate: string;
  revenue: number;
  invested: number;
  profit: number;
}

interface DashboardChartProps {
  data: ChartDataPoint[];
  period: string;
  onPeriodChange: (period: string) => void;
  loading: boolean;
}

export default function DashboardChart({ data, period, onPeriodChange, loading }: DashboardChartProps) {
  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `₹${(value / 1000).toFixed(1)}k`;
    }
    return `₹${value}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-100 shadow-xl rounded-2xl">
          <p className="font-bold text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 text-sm mt-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-gray-600 capitalize">{entry.name}</span>
              </div>
              <span className="font-bold text-gray-900">₹{Number(entry.value).toFixed(2)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-8 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-lg font-black text-gray-900">Financial Trends</h2>
          <p className="text-sm text-gray-500 mt-1">Revenue, total investment, and net profit</p>
        </div>

        {/* Period Selector */}
        <div className="flex bg-gray-50 p-1 rounded-xl">
          {['week', 'month', 'year'].map((p) => (
            <button
              key={p}
              onClick={() => onPeriodChange(p)}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                period === p
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {p === 'week' ? '7 Days' : p === 'month' ? '30 Days' : '12 Months'}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Area */}
      <div className="h-[350px] w-full">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-sm text-gray-400 font-medium">Loading trends...</p>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-gray-400 text-sm font-medium">No data available for this period</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e11d48" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#e11d48" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                tickFormatter={formatCurrency}
                dx={-10}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="circle"
                wrapperStyle={{ fontSize: '13px', fontWeight: 600, color: '#4b5563' }}
              />
              
              <Area 
                type="monotone" 
                dataKey="revenue" 
                name="Revenue"
                stroke="#4f46e5" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
              />
              <Area 
                type="monotone" 
                dataKey="invested" 
                name="Invested (COGS + Exp)"
                stroke="#e11d48" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorInvested)" 
              />
              <Area 
                type="monotone" 
                dataKey="profit" 
                name="Net Profit"
                stroke="#10b981" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorProfit)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
