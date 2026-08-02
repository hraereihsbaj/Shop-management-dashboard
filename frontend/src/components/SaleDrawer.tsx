import Drawer from './Drawer';
import { ShoppingBag, CreditCard, Box, TrendingUp } from 'lucide-react';

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
}

export default function SaleDrawer({ sale, onClose }: SaleDrawerProps) {
  if (!sale) return null;

  const totalQuantity = sale.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;
  
  // Calculate profit for this specific sale if costPrice is available in the sale items
  const totalCost = sale.items?.reduce((sum, i) => sum + ((i.costPrice || 0) * i.quantity), 0) || 0;
  const saleProfit = Number(sale.totalAmount) - totalCost;

  return (
    <Drawer isOpen={!!sale} onClose={onClose} title="Sale Details">
      <div className="space-y-6">
        
        {/* Header Info */}
        <div className="flex items-center gap-4">
          <div className="p-4 bg-indigo-50 rounded-2xl">
            <ShoppingBag size={28} className="text-indigo-600" />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900">Sale #{String(sale.id).slice(-6)}</h3>
            <span className="badge bg-gray-100 text-gray-600 mt-1">{new Date(sale.createdAt).toLocaleString()}</span>
          </div>
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
            <span className="font-bold text-gray-900">{sale.paymentMethod}</span>
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

      </div>
    </Drawer>
  );
}
