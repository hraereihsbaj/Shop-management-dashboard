import React, { useState, useRef } from 'react';
import { UploadCloud, X, FileSpreadsheet, Package, ShoppingBag, Receipt } from 'lucide-react';
import api from '../api';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

type ImportType = 'products' | 'sales' | 'expenses';

export default function BulkImportModal({ isOpen, onClose, onSuccess }: BulkImportModalProps) {
  const [importType, setImportType] = useState<ImportType>('products');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await api.post(`/api/${importType}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      onSuccess(res.data.message || 'Import successful');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to upload file';
      const detailErrors = err.response?.data?.errors?.join(', ');
      setError(msg + (detailErrors ? ': ' + detailErrors : ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-slide-up">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <FileSpreadsheet className="text-indigo-600" size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Bulk Import</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Type Selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">What are you importing?</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setImportType('products')}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  importType === 'products' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-100 hover:border-gray-200 text-gray-500'
                }`}
              >
                <Package size={24} />
                <span className="text-sm font-semibold">Products</span>
              </button>
              <button
                type="button"
                onClick={() => setImportType('sales')}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  importType === 'sales' ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-gray-100 hover:border-gray-200 text-gray-500'
                }`}
              >
                <ShoppingBag size={24} />
                <span className="text-sm font-semibold">Sales</span>
              </button>
              <button
                type="button"
                onClick={() => setImportType('expenses')}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  importType === 'expenses' ? 'border-rose-600 bg-rose-50 text-rose-700' : 'border-gray-100 hover:border-gray-200 text-gray-500'
                }`}
              >
                <Receipt size={24} />
                <span className="text-sm font-semibold">Expenses</span>
              </button>
            </div>
          </div>
          
          {/* Instructions */}
          <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-600">
            <p className="font-semibold mb-1 text-gray-800">Required Columns (Excel or CSV):</p>
            {importType === 'products' && <p>name, category, costPrice, sellingPrice, stock</p>}
            {importType === 'sales' && <p>productName, quantity, paymentMethod</p>}
            {importType === 'expenses' && <p>title, category, amount, notes</p>}
          </div>

          {/* File Picker */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Select File</label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                onChange={handleFileChange}
                ref={fileInputRef}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2.5 file:px-4
                  file:rounded-xl file:border-0
                  file:text-sm file:font-semibold
                  file:bg-indigo-50 file:text-indigo-700
                  hover:file:bg-indigo-100 cursor-pointer
                  border border-gray-200 rounded-xl
                "
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm font-medium">
              {error}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={loading || !file}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-indigo-200"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <UploadCloud size={20} />
            )}
            {loading ? 'Uploading...' : 'Import Data'}
          </button>
        </div>
        
      </div>
    </div>
  );
}
