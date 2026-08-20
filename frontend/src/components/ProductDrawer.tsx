import { useState, useEffect } from 'react';
import Drawer from './Drawer';
import { Package, DollarSign, History, Pencil, Save, X as XIcon, Loader2 } from 'lucide-react';
import ProductHistoryModal from './ProductHistoryModal';
import api from '../api';

interface Product { 
  id: string | number; 
  name: string; 
  category: string; 
  sellingPrice: number; 
  costPrice: number; 
  stock: number; 
  createdAt: string; 
  updatedAt?: string; 
  saleItems?: { quantity: number; costPrice: number }[];
}

interface ProductDrawerProps {
  product: Product | null;
  onClose: () => void;
  onSaved?: () => void;
}

export default function ProductDrawer({ product, onClose, onSaved }: ProductDrawerProps) {
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [form, setForm] = useState({ name: '', category: '', sellingPrice: '', costPrice: '', stock: '', createdAt: '' });

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        category: product.category || '',
        sellingPrice: String(product.sellingPrice),
        costPrice: String(product.costPrice),
        stock: String(product.stock),
        createdAt: new Date(product.createdAt).toISOString().slice(0, 16),
      });
      setIsEditing(false);
      setShowSuccess(false);
    }
  }, [product]);

  if (!product) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/api/products/${product.id}`, {
        name: form.name.trim(),
        category: form.category.trim(),
        sellingPrice: parseFloat(form.sellingPrice),
        costPrice: parseFloat(form.costPrice),
        stock: parseInt(form.stock),
        createdAt: new Date(form.createdAt).toISOString(),
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
      name: product.name,
      category: product.category || '',
      sellingPrice: String(product.sellingPrice),
      costPrice: String(product.costPrice),
      stock: String(product.stock),
      createdAt: new Date(product.createdAt).toISOString().slice(0, 16),
    });
    setIsEditing(false);
  };

  // Use form values in edit mode, product values in view mode for calculations
  const displayCostPrice = isEditing ? parseFloat(form.costPrice) || 0 : Number(product.costPrice);
  const displaySellingPrice = isEditing ? parseFloat(form.sellingPrice) || 0 : Number(product.sellingPrice);
  const displayStock = isEditing ? parseInt(form.stock) || 0 : product.stock;

  const inventoryValue = displayCostPrice * displayStock;
  const potentialRevenue = displaySellingPrice * displayStock;
  const potentialProfit = potentialRevenue - inventoryValue;
  
  const soldStockCost = product.saleItems?.reduce((sum, item) => sum + (Number(item.costPrice) * item.quantity), 0) || 0;
  const totalInitialCost = inventoryValue + soldStockCost;

  return (
    <Drawer isOpen={!!product} onClose={onClose} title="Product Details">
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
          <div className="p-4 bg-emerald-50 rounded-2xl flex-shrink-0">
            <Package size={28} className="text-emerald-600" />
          </div>
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="form-input text-xl font-black text-gray-900 w-full"
                placeholder="Product name"
              />
            ) : (
              <h3 className="text-xl font-black text-gray-900">{product.name}</h3>
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
              <span className="badge bg-gray-100 text-gray-600 mt-1">{product.category || 'Uncategorized'}</span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setHistoryModalOpen(true)}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl font-semibold text-sm transition-colors"
            >
              <History size={16} />
              History
            </button>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-xl font-semibold text-sm transition-colors"
              >
                <Pencil size={16} />
                Edit
              </button>
            )}
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Pricing & Stock Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Stock</p>
            {isEditing ? (
              <input
                type="number"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className="form-input text-2xl font-bold text-gray-900 w-full"
                min="0"
              />
            ) : (
              <p className={`text-2xl font-bold ${product.stock > 0 ? 'text-gray-900' : 'text-rose-600'}`}>
                {product.stock} units
              </p>
            )}
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Margin</p>
            <p className="text-2xl font-bold text-emerald-600">
              ₹{(displaySellingPrice - displayCostPrice).toFixed(2)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Cost Price</p>
            {isEditing ? (
              <input
                type="number"
                value={form.costPrice}
                onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                className="form-input text-sm font-semibold w-full"
                step="0.01"
              />
            ) : (
              <p className="text-sm font-semibold text-gray-900">₹{Number(product.costPrice).toFixed(2)}</p>
            )}
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Selling Price</p>
            {isEditing ? (
              <input
                type="number"
                value={form.sellingPrice}
                onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
                className="form-input text-sm font-semibold w-full"
                step="0.01"
              />
            ) : (
              <p className="text-sm font-semibold text-gray-900">₹{Number(product.sellingPrice).toFixed(2)}</p>
            )}
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Inventory Value */}
        <div>
          <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
            <DollarSign size={16} className="text-gray-400" />
            Financials & Valuation
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
              <span className="text-sm font-medium text-amber-900">Total Invested (Initial Costs)</span>
              <span className="font-bold text-amber-700">₹{totalInitialCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg">
              <span className="text-sm font-medium text-indigo-900">Current Value (Cost)</span>
              <span className="font-bold text-indigo-700">₹{inventoryValue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-blue-900">Potential Revenue</span>
              <span className="font-bold text-blue-700">₹{potentialRevenue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
              <span className="text-sm font-medium text-emerald-900">Potential Profit</span>
              <span className="font-bold text-emerald-700">₹{potentialProfit.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Meta */}
        <div className="text-xs text-gray-400 space-y-1">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <span>Created:</span>
              <input
                type="datetime-local"
                value={form.createdAt}
                onChange={(e) => setForm({ ...form, createdAt: e.target.value })}
                className="form-input text-xs py-1 px-2"
              />
            </div>
          ) : (
            <p>Created: {new Date(product.createdAt).toLocaleString()}</p>
          )}
          {product.updatedAt && !isEditing && <p>Last Updated: {new Date(product.updatedAt).toLocaleString()}</p>}
        </div>

        {/* Edit Action Buttons */}
        {isEditing && (
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving || !form.name.trim() || !form.sellingPrice || !form.costPrice}
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

      <ProductHistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        productId={product.id}
        productName={product.name}
      />
    </Drawer>
  );
}
