import { useState, useEffect } from 'react';
import Drawer from './Drawer';
import { Receipt, Calendar, Tag, Pencil, Save, X as XIcon, Loader2 } from 'lucide-react';
import api from '../api';

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
  onSaved?: () => void;
}

export default function ExpenseDrawer({ expense, onClose, onSaved }: ExpenseDrawerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [form, setForm] = useState({
    title: '',
    category: '',
    amount: '',
    notes: '',
    expenseDate: '',
  });

  useEffect(() => {
    if (expense) {
      setForm({
        title: expense.title,
        category: expense.category || '',
        amount: String(expense.amount),
        notes: expense.notes || '',
        expenseDate: new Date(expense.expenseDate).toISOString().slice(0, 16),
      });
      setIsEditing(false);
      setShowSuccess(false);
    }
  }, [expense]);

  if (!expense) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/api/expenses/${expense.id}`, {
        title: form.title.trim(),
        category: form.category.trim(),
        amount: parseFloat(form.amount),
        notes: form.notes.trim() || null,
        expenseDate: new Date(form.expenseDate).toISOString(),
      });
      setIsEditing(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2500);
      onSaved?.();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({
      title: expense.title,
      category: expense.category || '',
      amount: String(expense.amount),
      notes: expense.notes || '',
      expenseDate: new Date(expense.expenseDate).toISOString().slice(0, 16),
    });
    setIsEditing(false);
  };

  return (
    <Drawer isOpen={!!expense} onClose={onClose} title="Expense Details">
      <div className="space-y-6">
        
        {/* Success Toast */}
        {showSuccess && (
          <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-semibold animate-slide-up">
            <Save size={16} />
            Successfully saved!
          </div>
        )}

        {/* Header Info */}
        <div className="flex items-center gap-4">
          <div className="p-4 bg-rose-50 rounded-2xl flex-shrink-0">
            <Receipt size={28} className="text-rose-600" />
          </div>
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="form-input text-xl font-black text-gray-900 w-full"
                placeholder="Expense title"
              />
            ) : (
              <h3 className="text-xl font-black text-gray-900">{expense.title}</h3>
            )}
            {isEditing ? (
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="form-input text-sm mt-1 w-full"
                placeholder="Category"
              />
            ) : (
              <span className="badge bg-gray-100 text-gray-600 mt-1">{expense.category || 'Uncategorized'}</span>
            )}
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl font-semibold text-sm transition-colors"
            >
              <Pencil size={16} />
              Edit
            </button>
          )}
        </div>

        <hr className="border-gray-100" />

        {/* Amount */}
        <div className="grid grid-cols-1 gap-4">
          <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-xl flex justify-between items-center">
            <p className="text-sm font-semibold text-rose-800 uppercase tracking-wider">Amount</p>
            {isEditing ? (
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="form-input text-2xl font-bold text-rose-600 text-right w-32"
                step="0.01"
              />
            ) : (
              <p className="text-3xl font-bold text-rose-600">
                ₹{Number(expense.amount).toFixed(2)}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar size={16} className="text-gray-400" />
            <span className="font-medium text-gray-600">Date:</span>
            {isEditing ? (
              <input
                type="datetime-local"
                value={form.expenseDate}
                onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
                className="form-input text-sm font-bold text-gray-900 w-full"
              />
            ) : (
              <span className="font-bold text-gray-900">{new Date(expense.expenseDate).toLocaleDateString()}</span>
            )}
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
          {isEditing ? (
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="form-input w-full min-h-[80px] text-sm"
              placeholder="Add notes..."
            />
          ) : expense.notes ? (
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

        {/* Edit Action Buttons */}
        {isEditing && (
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving || !form.title.trim() || !form.amount}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white font-bold rounded-xl transition-colors"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
            >
              <XIcon size={18} />
            </button>
          </div>
        )}

      </div>
    </Drawer>
  );
}
