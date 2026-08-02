import { useEffect, useState } from 'react';
import { X, History, PackageOpen } from 'lucide-react';
import api from '../api';

interface ProductHistoryEntry {
  id: string;
  quantityAdded: number;
  costPrice: number;
  sellingPrice: number;
  createdAt: string;
}

interface ProductHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string | number;
  productName: string;
}

export default function ProductHistoryModal({ isOpen, onClose, productId, productName }: ProductHistoryModalProps) {
  const [history, setHistory] = useState<ProductHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && productId) {
      setLoading(true);
      api.get(`/api/products/${productId}/history`)
        .then(res => {
          setHistory(res.data.data);
          setError('');
        })
        .catch(err => {
          console.error(err);
          setError('Failed to load product history.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, productId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg shadow-inner">
              <History className="text-indigo-600" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 leading-tight">Stock History</h3>
              <p className="text-sm font-medium text-gray-500">{productName}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-3">
              <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-sm font-semibold text-gray-500">Loading history...</p>
            </div>
          ) : error ? (
            <div className="text-center py-10 text-red-500 font-medium bg-red-50 rounded-xl">
              {error}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 px-4 flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <PackageOpen size={32} className="text-gray-400" />
              </div>
              <p className="text-lg font-bold text-gray-900 mb-1">No History Yet</p>
              <p className="text-sm text-gray-500 max-w-xs">
                History tracking started recently. Future stock additions for this product will appear here.
              </p>
            </div>
          ) : (
            <div className="relative border-l-2 border-indigo-100 ml-4 space-y-8 pb-4">
              {history.map((entry) => (
                <div key={entry.id} className="relative pl-6">
                  {/* Timeline dot */}
                  <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-4 border-indigo-500 shadow-sm" />
                  
                  <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 mb-2">
                          + {entry.quantityAdded} Units Added
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">
                          {new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        <p className="text-xs font-medium text-gray-400">
                          {new Date(entry.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 bg-gray-50/50 p-3 rounded-lg">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-1">Cost Price</p>
                        <p className="text-sm font-bold text-gray-900">₹{Number(entry.costPrice).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-1">Selling Price</p>
                        <p className="text-sm font-bold text-gray-900">₹{Number(entry.sellingPrice).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
