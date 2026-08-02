import { type LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  accentColor: 'indigo' | 'emerald' | 'rose' | 'amber' | 'blue';
  delay?: number;
}

const colorMap = {
  indigo: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-600',
    border: 'border-l-indigo-500',
    value: 'text-indigo-700',
  },
  emerald: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    border: 'border-l-emerald-500',
    value: 'text-emerald-700',
  },
  rose: {
    bg: 'bg-rose-50',
    text: 'text-rose-600',
    border: 'border-l-rose-500',
    value: 'text-rose-700',
  },
  amber: {
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    border: 'border-l-amber-500',
    value: 'text-amber-700',
  },
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-l-blue-500',
    value: 'text-blue-700',
  },
};

export default function MetricCard({ title, value, icon: Icon, accentColor, delay = 0 }: MetricCardProps) {
  const colors = colorMap[accentColor];

  return (
    <div
      className={`card border-l-4 ${colors.border} p-5 animate-fade-in`}
      style={{ animationDelay: `${delay * 0.08}s` }}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            {title}
          </p>
          <p className={`text-2xl font-extrabold tracking-tight ${colors.value}`}>
            {value}
          </p>
        </div>
        <div className={`p-3 rounded-xl ${colors.bg}`}>
          <Icon size={22} className={colors.text} strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}
