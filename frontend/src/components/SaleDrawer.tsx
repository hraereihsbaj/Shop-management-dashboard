import { useState, useEffect } from 'react';
import Drawer from './Drawer';
import { ShoppingBag, CreditCard, Box, TrendingUp, Pencil, Save, X as XIcon, Loader2 } from 'lucide-react';
import api from '../api';

interface SaleItem {
  quantity: number;
  costPrice?: number;
  sellingPrice?: number;
  product?: { name: string; category?: string };
}

interface Sale { 
  id: string | number; 
  totalAmount: number;
  paymentMethod: string; 
  items: SaleItem[]; 
  createdAt: string; 
}

interface SaleDrawerProps {
  sale: Sale | null;
  onClose: () => void;
  onSaved?: () => void;
}

export default function SaleDrawer({ sale, onClose, onSaved }: SaleDrawerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [form, setForm] = useState({ paymentMethod: '' });

  useEffect(() => {
    if (sale) {
      setForm({ paymentMethod: sale.paymentMethod });
      setIsEditing(false);
      setShowSuccess(false);
    }
  }, [sale]);

  if (!sale) return null;

  const totalQuantity = sale.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;
  const totalCost = sale.items?.reduce((sum, i) => sum + ((i.costPrice || 0) * i.quantity), 0) || 0;
  const saleProfit = Number(sale.totalAmount) - totalCost;

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/api/sales/${sale.id}`, {
        paymentMethod: form.paymentMethod,
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
    setForm({ paymentMethod: sale.paymentMethod });
    setIsEditing(false);
  };

  return (
    <Drawer isOpen={!!sale} onClose={onClose} title="Sale Details">
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
          <div className="p-4 bg-indigo-50 rounded-2xl flex-shrink-0">
            <ShoppingBag size={28} className="text-indigo-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-black text-gray-900">Sale #{String(sale.id).slice(-6)}</h3>
            <span className="badge bg-gray-100 text-gray-600 mt-1">{new Date(sale.createdAt).toLocaleString()}</span>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-3 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-xl font-semibold text-sm transition-colors"
            >
              <Pencil size={16} />
              Edit
            </button>
          )}
        </div>

        <hr className="border-gray-100" />

        {/* Totals Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Amount</p>
            <p className="text-2xl font-bold text-indigo-600">
              ₹{Number(sale.totalAmount).toFixed(2)}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Items Sold</p>
            <p className="text-2xl font-bold text-gray-900">
              {totalQuantity}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <CreditCard size={16} className="text-gray-400" />
            <span className="font-medium text-gray-600">Payment:</span>
            {isEditing ? (
              <select
                value={form.paymentMethod}
                onChange={(e) => setForm({ paymentMethod: e.target.value })}
                className="form-select text-sm font-bold py-1"
              >
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Other">Other</option>
              </select>
            ) : (
              <span className="font-bold text-gray-900">{sale.paymentMethod}</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp size={16} className="text-gray-400" />
            <span className="font-medium text-gray-600">Profit:</span>
            <span className="font-bold text-emerald-600">₹{saleProfit.toFixed(2)}</span>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Items List */}
        <div>
          <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
            <Box size={16} className="text-gray-400" />
            Items in this Sale
          </h4>
          <div className="space-y-3">
            {sale.items?.map((item, idx) => {
              const itemTotal = (item.sellingPrice || 0) * item.quantity;
              
              return (
                <div key={idx} className="flex justify-between items-center p-4 bg-white border border-gray-100 shadow-sm rounded-xl">
                  <div>
                    <p className="font-bold text-gray-900">{item.product?.name || 'Unknown Product'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {item.quantity} x ₹{Number(item.sellingPrice || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-indigo-600">₹{itemTotal.toFixed(2)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Edit Action Buttons */}
        {isEditing && (
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
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
