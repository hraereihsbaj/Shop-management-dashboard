import { useState } from 'react';
import Drawer from './Drawer';
import { Package, DollarSign, History } from 'lucide-react';
import ProductHistoryModal from './ProductHistoryModal';

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
}

export default function ProductDrawer({ product, onClose }: ProductDrawerProps) {
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  if (!product) return null;

  const inventoryValue = Number(product.costPrice) * product.stock;
  const potentialRevenue = Number(product.sellingPrice) * product.stock;
  const potentialProfit = potentialRevenue - inventoryValue;
  
  const soldStockCost = product.saleItems?.reduce((sum, item) => sum + (Number(item.costPrice) * item.quantity), 0) || 0;
  const totalInitialCost = inventoryValue + soldStockCost;

  return (
    <Drawer isOpen={!!product} onClose={onClose} title="Product Details">
      <div className="space-y-6">
        
        {/* Header Info */}
        <div className="flex items-center gap-4">
          <div className="p-4 bg-emerald-50 rounded-2xl flex-shrink-0">
            <Package size={28} className="text-emerald-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-black text-gray-900">{product.name}</h3>
            <span className="badge bg-gray-100 text-gray-600 mt-1">{product.category || 'Uncategorized'}</span>
          </div>
          <button
            onClick={() => setHistoryModalOpen(true)}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl font-semibold text-sm transition-colors"
          >
            <History size={16} />
            History
          </button>
        </div>

        <hr className="border-gray-100" />

        {/* Pricing & Stock Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Stock</p>
            <p className={`text-2xl font-bold ${product.stock > 0 ? 'text-gray-900' : 'text-rose-600'}`}>
              {product.stock} units
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Margin</p>
            <p className="text-2xl font-bold text-emerald-600">
              ₹{(Number(product.sellingPrice) - Number(product.costPrice)).toFixed(2)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Cost Price</p>
            <p className="text-sm font-semibold text-gray-900">₹{Number(product.costPrice).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Selling Price</p>
            <p className="text-sm font-semibold text-gray-900">₹{Number(product.sellingPrice).toFixed(2)}</p>
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
          <p>Created: {new Date(product.createdAt).toLocaleString()}</p>
          {product.updatedAt && <p>Last Updated: {new Date(product.updatedAt).toLocaleString()}</p>}
        </div>

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
