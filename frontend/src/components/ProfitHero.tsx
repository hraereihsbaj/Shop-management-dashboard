import { BarChart3, ShoppingCart } from 'lucide-react';

interface ProfitHeroProps {
  netProfit: number;
  cogs: number;
  grossProfit: number;
}

export default function ProfitHero({ netProfit, cogs, grossProfit }: ProfitHeroProps) {
  const isPositive = netProfit >= 0;

  return (
    <div className="card p-5 sm:p-8 md:p-10 animate-slide-up" style={{ animationDelay: '0.15s' }}>
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full">
          <div className={`w-2 h-2 rounded-full ${isPositive ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`} />
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Net Profit — Live
          </span>
        </div>

        <p className={`text-3xl sm:text-5xl md:text-6xl font-black tracking-tight ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
          ₹{netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-2 max-w-sm mx-auto gap-6">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-50 rounded-lg mt-0.5">
            <ShoppingCart size={16} className="text-amber-600" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">COGS</p>
            <p className="text-sm font-bold text-gray-700 mt-0.5">₹{cogs.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-50 rounded-lg mt-0.5">
            <BarChart3 size={16} className="text-blue-600" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Gross Profit</p>
            <p className="text-sm font-bold text-gray-700 mt-0.5">₹{grossProfit.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
