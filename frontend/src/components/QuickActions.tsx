import { ShoppingBag, Receipt, Package, Plus } from 'lucide-react';

interface Product {
  id: string | number;
  name: string;
}

interface QuickActionsProps {
  // Sale form
  saleForm: { productName: string; quantity: string; paymentMethod: string };
  setSaleForm: (f: { productName: string; quantity: string; paymentMethod: string }) => void;
  handleAddSale: (e: React.FormEvent) => void;
  allProducts: Product[];

  // Expense form
  expenseForm: { title: string; category: string; amount: string; notes: string };
  setExpenseForm: (f: { title: string; category: string; amount: string; notes: string }) => void;
  handleAddExpense: (e: React.FormEvent) => void;

  productForm: { name: string; category: string; sellingPrice: string; costPrice: string; stock: string };
  setProductForm: (f: { name: string; category: string; sellingPrice: string; costPrice: string; stock: string }) => void;
  handleAddProduct: (e: React.FormEvent) => void;

  onOpenBulkImport: () => void;
}

export default function QuickActions({
  saleForm,
  setSaleForm,
  handleAddSale,
  allProducts,
  expenseForm,
  setExpenseForm,
  handleAddExpense,
  productForm,
  setProductForm,
  handleAddProduct,
  onOpenBulkImport,
}: QuickActionsProps) {
  return (
    <div className="space-y-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
        <button
          onClick={onOpenBulkImport}
          className="btn bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-semibold py-2 px-4 shadow-sm"
        >
          Upload CSV / Excel
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Sale Form */}
        <div className="card p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <ShoppingBag size={16} className="text-indigo-600" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">Log a Sale</h3>
          </div>
          <form onSubmit={handleAddSale} className="space-y-3">
            <div>
              <label htmlFor="sale-product" className="block text-xs font-medium text-gray-500 mb-1.5">Product</label>
              <input
                id="sale-product"
                list="product-options"
                type="text"
                required
                placeholder="Search products..."
                className="form-input"
                value={saleForm.productName}
                onChange={(e) => setSaleForm({ ...saleForm, productName: e.target.value })}
              />
              <datalist id="product-options">
                {allProducts.map((product) => (
                  <option key={product.id} value={product.name} />
                ))}
              </datalist>
            </div>
            <div className="grid grid-cols-5 gap-3">
              <div className="col-span-2">
                <label htmlFor="sale-qty" className="block text-xs font-medium text-gray-500 mb-1.5">Qty</label>
                <input
                  id="sale-qty"
                  type="number"
                  required
                  placeholder="1"
                  min="1"
                  className="form-input"
                  value={saleForm.quantity}
                  onChange={(e) => setSaleForm({ ...saleForm, quantity: e.target.value })}
                />
              </div>
              <div className="col-span-3">
                <label htmlFor="sale-payment" className="block text-xs font-medium text-gray-500 mb-1.5">Payment</label>
                <select
                  id="sale-payment"
                  className="form-select w-full py-2.5"
                  value={saleForm.paymentMethod}
                  onChange={(e) => setSaleForm({ ...saleForm, paymentMethod: e.target.value })}
                >
                  <option value="UPI">UPI</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={!saleForm.productName.trim() || !saleForm.quantity || Number(saleForm.quantity) <= 0}
              className="btn btn-primary w-full mt-2"
            >
              <Plus size={15} />
              Submit Sale
            </button>
          </form>
        </div>

        {/* Expense Form */}
        <div className="card p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="p-2 bg-rose-50 rounded-lg">
              <Receipt size={16} className="text-rose-600" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">Log an Expense</h3>
          </div>
          <form onSubmit={handleAddExpense} className="space-y-3">
            <div>
              <label htmlFor="expense-title" className="block text-xs font-medium text-gray-500 mb-1.5">Title</label>
              <input
                id="expense-title"
                type="text"
                required
                placeholder="e.g. Paper"
                className="form-input"
                value={expenseForm.title}
                onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="expense-category" className="block text-xs font-medium text-gray-500 mb-1.5">Category</label>
              <input
                id="expense-category"
                type="text"
                required
                placeholder="e.g. Stationery"
                className="form-input"
                value={expenseForm.category}
                onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="expense-amount" className="block text-xs font-medium text-gray-500 mb-1.5">Amount (₹)</label>
              <input
                id="expense-amount"
                type="number"
                required
                placeholder="0"
                min="1"
                className="form-input"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="expense-notes" className="block text-xs font-medium text-gray-500 mb-1.5">Notes</label>
              <input
                id="expense-notes"
                type="text"
                placeholder="Optional notes..."
                className="form-input"
                value={expenseForm.notes}
                onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
              />
            </div>
            <button
              type="submit"
              disabled={!expenseForm.title.trim() || !expenseForm.category.trim() || !expenseForm.amount || Number(expenseForm.amount) <= 0}
              className="btn btn-expense w-full mt-2"
            >
              <Plus size={15} />
              Submit Expense
            </button>
          </form>
        </div>

        {/* Product Form */}
        <div className="card p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <Package size={16} className="text-emerald-600" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">Add Product</h3>
          </div>
          <form onSubmit={handleAddProduct} className="space-y-3">
            <div>
              <label htmlFor="product-name" className="block text-xs font-medium text-gray-500 mb-1.5">Name</label>
              <input
                id="product-name"
                type="text"
                required
                placeholder="Product Name"
                className="form-input"
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="product-category" className="block text-xs font-medium text-gray-500 mb-1.5">Category</label>
              <input
                id="product-category"
                type="text"
                required
                placeholder="e.g. Ice"
                className="form-input"
                value={productForm.category}
                onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="product-sp" className="block text-xs font-medium text-gray-500 mb-1.5">Sell Price</label>
                <input
                  id="product-sp"
                  type="number"
                  required
                  placeholder="₹0"
                  min="0"
                  step="0.01"
                  className="form-input"
                  value={productForm.sellingPrice}
                  onChange={(e) => setProductForm({ ...productForm, sellingPrice: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="product-cp" className="block text-xs font-medium text-gray-500 mb-1.5">Cost Price</label>
                <input
                  id="product-cp"
                  type="number"
                  required
                  placeholder="₹0"
                  min="0"
                  step="0.01"
                  className="form-input"
                  value={productForm.costPrice}
                  onChange={(e) => setProductForm({ ...productForm, costPrice: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label htmlFor="product-stock" className="block text-xs font-medium text-gray-500 mb-1.5">Initial Stock</label>
              <input
                id="product-stock"
                type="number"
                required
                placeholder="0"
                min="0"
                className="form-input"
                value={productForm.stock}
                onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
              />
            </div>
            <button
              type="submit"
              disabled={!productForm.name.trim() || !productForm.category.trim() || !productForm.sellingPrice || !productForm.costPrice || productForm.stock === ''}
              className="btn btn-revenue w-full mt-2"
            >
              <Plus size={15} />
              Create Product
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
