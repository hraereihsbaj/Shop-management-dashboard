import Drawer from './Drawer';
import { Receipt, Calendar, Tag } from 'lucide-react';

interface Expense {
  id: string | number;
  title: string;
  category: string;
  amount: number;
  notes?: string | null;
  expenseDate: string;
  createdAt: string;
}

interface ExpenseDrawerProps {
  expense: Expense | null;
  onClose: () => void;
}

export default function ExpenseDrawer({ expense, onClose }: ExpenseDrawerProps) {
  if (!expense) return null;

  return (
    <Drawer isOpen={!!expense} onClose={onClose} title="Expense Details">
      <div className="space-y-6">
        
        {/* Header Info */}
        <div className="flex items-center gap-4">
          <div className="p-4 bg-rose-50 rounded-2xl">
            <Receipt size={28} className="text-rose-600" />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900">{expense.title}</h3>
            <span className="badge bg-gray-100 text-gray-600 mt-1">{expense.category || 'Uncategorized'}</span>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Totals Grid */}
        <div className="grid grid-cols-1 gap-4">
          <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-xl flex justify-between items-center">
            <p className="text-sm font-semibold text-rose-800 uppercase tracking-wider">Amount</p>
            <p className="text-3xl font-bold text-rose-600">
              ₹{Number(expense.amount).toFixed(2)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar size={16} className="text-gray-400" />
            <span className="font-medium text-gray-600">Date:</span>
            <span className="font-bold text-gray-900">{new Date(expense.expenseDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Tag size={16} className="text-gray-400" />
            <span className="font-medium text-gray-600">ID:</span>
            <span className="font-bold text-gray-900 uppercase">#{String(expense.id).slice(-6)}</span>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Notes */}
        <div>
          <h4 className="text-sm font-bold text-gray-900 mb-3">Notes</h4>
          {expense.notes ? (
            <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-700 whitespace-pre-wrap">
              {expense.notes}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No notes provided for this expense.</p>
          )}
        </div>

        {/* Meta */}
        <div className="pt-4 text-xs text-gray-400">
          <p>Logged on: {new Date(expense.createdAt).toLocaleString()}</p>
        </div>

      </div>
    </Drawer>
  );
}
