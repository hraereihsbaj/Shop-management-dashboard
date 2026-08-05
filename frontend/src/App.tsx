import { useEffect, useState } from 'react';
import api from './api';
import { TrendingUp, TrendingDown, DollarSign, CreditCard, Package, ShoppingBag, Receipt, Trash2 } from 'lucide-react';
import Header from './components/Header';
import MetricCard from './components/MetricCard';
import ProfitHero from './components/ProfitHero';
import QuickActions from './components/QuickActions';
import DataTable from './components/DataTable';
import ConfirmModal from './components/ConfirmModal';
import SuccessModal from './components/SuccessModal';
import ProductDrawer from './components/ProductDrawer';
import SaleDrawer from './components/SaleDrawer';
import ExpenseDrawer from './components/ExpenseDrawer';
import BulkImportModal from './components/BulkImportModal';
import DashboardChart from './components/DashboardChart';
import Login from './components/Login';

interface ReportData {
  totalRevenue: number;
  totalCOGS: number;
  grossProfit: number;
  totalExpenses: number;
  netProfit: number;
  totalInventoryValue: number;
  totalInitialCosts: number;
}

interface Product { 
  id: string | number; 
  name: string; 
  category: string; 
  sellingPrice: number; 
  costPrice: number; 
  stock: number; 
  createdAt: string; 
  updatedAt?: string; 
}

interface SaleItem {
  quantity: number;
  productName?: string;
  product?: { name: string };
}

interface Sale { 
  id: string | number; 
  totalAmount: number;
  paymentMethod: string; 
  items: SaleItem[]; 
  createdAt: string; 
}

interface Expense { 
  id: string | number; 
  title: string; 
  category: string; 
  amount: number; 
  notes?: string | null; 
  expenseDate: string;
  createdAt: string; 
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const PAGE_SIZE = 10;

function LoadingOverlay() {
  return (
    <div className="loading-overlay animate-fade-in">
      <div className="loading-card animate-slide-up">
        <div className="w-10 h-10 border-4 border-gray-100 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-sm font-bold text-gray-700 tracking-wide">Processing...</p>
      </div>
    </div>
  );
}

export default function App() {
  const [data, setData] = useState<ReportData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('shop_admin_token'));
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [successModal, setSuccessModal] = useState({
    isOpen: false,
    title: '',
    message: '',
  });
  const [bulkImportModalOpen, setBulkImportModalOpen] = useState(false);

  const [selectedProductForDrawer, setSelectedProductForDrawer] = useState<Product | null>(null);
  const [selectedSaleForDrawer, setSelectedSaleForDrawer] = useState<Sale | null>(null);
  const [selectedExpenseForDrawer, setSelectedExpenseForDrawer] = useState<Expense | null>(null);
  
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]); // for datalist
  const [salesList, setSalesList] = useState<Sale[]>([]);
  const [expensesList, setExpensesList] = useState<Expense[]>([]);

  const [productsPagination, setProductsPagination] = useState<PaginationInfo>({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
  const [salesPagination, setSalesPagination] = useState<PaginationInfo>({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
  const [expensesPagination, setExpensesPagination] = useState<PaginationInfo>({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });

  const [expenseForm, setExpenseForm] = useState({ title: '', category: '', amount: '', notes: '' });
  const [saleForm, setSaleForm] = useState({ productName: '', quantity: '', paymentMethod: 'UPI', isCustom: false, customPrice: '' });
  const [productForm, setProductForm] = useState({ name: '', category: '', sellingPrice: '', costPrice: '', stock: '' });

  const [selectedMonth, setSelectedMonth] = useState<string>(''); // '' = All Time
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedDate, setSelectedDate] = useState<string>(''); // e.g. '2026-08-02'

  const [chartData, setChartData] = useState<any[]>([]);
  const [chartPeriod, setChartPeriod] = useState<string>('week');
  const [chartLoading, setChartLoading] = useState<boolean>(false);

  const fetchReport = (m = selectedMonth, y = selectedYear, d = selectedDate) => {
    let query = '';
    if (d) query = `?date=${d}`;
    else if (m) query = `?month=${m}&year=${y}`;

    return api.get(`/api/reports/profit${query}`)
      .then((res) => {
        const reportPayload = res.data?.data ?? res.data;
        const normalizedData = {
          totalRevenue: Number(reportPayload?.totalRevenue ?? 0),
          totalCOGS: Number(reportPayload?.totalCOGS ?? 0),
          grossProfit: Number(reportPayload?.grossProfit ?? 0),
          totalExpenses: Number(reportPayload?.totalExpenses ?? 0),
          netProfit: Number(reportPayload?.netProfit ?? 0),
          totalInventoryValue: Number(reportPayload?.totalInventoryValue ?? 0),
          totalInitialCosts: Number(reportPayload?.totalInitialCosts ?? 0)
        };

        if (reportPayload && reportPayload.totalRevenue !== undefined) {
          setError('');
          setData(normalizedData);
        } else {
          setError('Backend connected, but returned empty data.');
        }
      })
      .catch((err) => {
        console.error(err);
        setError('Could not connect to backend API.');
      });
  };

  const fetchProducts = (page = 1, m = selectedMonth, y = selectedYear, sort = sortOrder, d = selectedDate) => {
    let query = `?page=${page}&limit=${PAGE_SIZE}&sort=${sort}`;
    if (d) query += `&date=${d}`;
    else if (m) query += `&month=${m}&year=${y}`;

    return api.get(`/api/products${query}`).then(res => {
      if (res.data?.data) setProductsList(res.data.data);
      if (res.data?.pagination) setProductsPagination(res.data.pagination);
    }).catch(err => console.error(err));
  };

  const fetchAllProductsForDatalist = () => {
    return api.get('/api/products').then(res => {
      if (res.data?.data) setAllProducts(res.data.data);
    }).catch(err => console.error(err));
  };

  const fetchSales = (page = 1, m = selectedMonth, y = selectedYear, sort = sortOrder, d = selectedDate) => {
    let query = `?page=${page}&limit=${PAGE_SIZE}&sort=${sort}`;
    if (d) query += `&date=${d}`;
    else if (m) query += `&month=${m}&year=${y}`;

    return api.get(`/api/sales${query}`).then(res => {
      if (res.data?.data) setSalesList(res.data.data);
      if (res.data?.pagination) setSalesPagination(res.data.pagination);
    }).catch(err => console.error(err));
  };

  const fetchExpenses = (page = 1, m = selectedMonth, y = selectedYear, sort = sortOrder, d = selectedDate) => {
    let query = `?page=${page}&limit=${PAGE_SIZE}&sort=${sort}`;
    if (d) query += `&date=${d}`;
    else if (m) query += `&month=${m}&year=${y}`;

    return api.get(`/api/expenses${query}`).then(res => {
      if (res.data?.data) setExpensesList(res.data.data);
      if (res.data?.pagination) setExpensesPagination(res.data.pagination);
    }).catch(err => console.error(err));
  };

  const fetchChartData = (period = chartPeriod) => {
    setChartLoading(true);
    return api.get(`/api/reports/chart?period=${period}`)
      .then(res => setChartData(res.data?.data || []))
      .catch(err => console.error(err))
      .finally(() => setChartLoading(false));
  };

  const fetchAllData = async (m = selectedMonth, y = selectedYear, sort = sortOrder, d = selectedDate) => {
    setLoading(true);
    try {
      await Promise.all([
        fetchReport(m, y, d),
        fetchProducts(1, m, y, sort, d),
        fetchAllProductsForDatalist(),
        fetchSales(1, m, y, sort, d),
        fetchExpenses(1, m, y, sort, d),
        fetchChartData(chartPeriod),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const refreshDataPreservingPagination = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchReport(selectedMonth, selectedYear, selectedDate),
        fetchProducts(productsPagination.page, selectedMonth, selectedYear, sortOrder, selectedDate),
        fetchAllProductsForDatalist(),
        fetchSales(salesPagination.page, selectedMonth, selectedYear, sortOrder, selectedDate),
        fetchExpenses(expensesPagination.page, selectedMonth, selectedYear, sortOrder, selectedDate),
        fetchChartData(chartPeriod),
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchAllData();
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) fetchChartData(chartPeriod);
  }, [chartPeriod, isAuthenticated]);

  useEffect(() => {
    const handleUnauthorized = () => setIsAuthenticated(false);
    window.addEventListener('auth_unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth_unauthorized', handleUnauthorized);
  }, []);

  const executeDeleteProduct = async (id: string | number) => {
    setLoading(true);
    try {
      await api.delete(`/api/products/${id}`);
      await fetchAllData();
    } catch (err: any) {
      alert(`Failed to delete product: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = (id: string | number, name: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Product',
      message: `Are you sure you want to delete product "${name}"? This action cannot be undone.`,
      onConfirm: () => executeDeleteProduct(id),
    });
  };

  const executeDeleteSale = async (id: string | number) => {
    setLoading(true);
    try {
      await api.delete(`/api/sales/${id}`);
      await fetchAllData();
    } catch (err: any) {
      alert(`Failed to delete sale: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSale = (id: string | number) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Sale',
      message: `Are you sure you want to delete sale ID "${id}"? This will restore product stock.`,
      onConfirm: () => executeDeleteSale(id),
    });
  };

  const executeDeleteExpense = async (id: string | number) => {
    setLoading(true);
    try {
      await api.delete(`/api/expenses/${id}`);
      await fetchAllData();
    } catch (err: any) {
      alert(`Failed to delete expense: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = (id: string | number, title: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Expense',
      message: `Are you sure you want to delete expense "${title}"?`,
      onConfirm: () => executeDeleteExpense(id),
    });
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      title: expenseForm.title.trim(),
      category: expenseForm.category.trim(),
      amount: Number(expenseForm.amount),
      notes: expenseForm.notes.trim() || undefined
    };

    if (!payload.title || !payload.category || Number.isNaN(payload.amount) || payload.amount <= 0) {
      alert('Please fill out all required fields (title, category, and amount > 0).');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/expenses', payload);
      setExpenseForm({ title: '', category: '', amount: '', notes: '' });
      await fetchAllData();
      setSuccessModal({
        isOpen: true,
        title: 'Expense Added',
        message: 'The expense was logged successfully.',
      });
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to add expense.';
      alert(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSale = async (e: React.FormEvent) => {
    e.preventDefault();

    const productName = saleForm.productName.trim();
    const quantity = Number(saleForm.quantity);
    const isCustom = saleForm.isCustom;
    const customPrice = Number(saleForm.customPrice);

    if (!productName || !saleForm.quantity) {
      alert('Please fill out all required fields (Product Name and Quantity).');
      return;
    }

    if (isCustom && (!saleForm.customPrice || customPrice < 0 || Number.isNaN(customPrice))) {
      alert('Please provide a valid non-negative selling price for the custom item.');
      return;
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      alert('Please enter a valid positive quantity.');
      return;
    }

    let payload: any;

    if (isCustom) {
      payload = {
        paymentMethod: saleForm.paymentMethod,
        totalAmount: customPrice * quantity,
        items: [{
          productName: productName,
          quantity,
          costPrice: 0,
          sellingPrice: customPrice
        }]
      };
    } else {
      const selectedProduct = allProducts.find((p) => p.name.toLowerCase() === productName.toLowerCase());

      if (!selectedProduct) {
        alert(`Product "${productName}" not found. Please choose an existing product or toggle 'Custom Item'.`);
        return;
      }

      payload = {
        paymentMethod: saleForm.paymentMethod,
        totalAmount: Number(selectedProduct.sellingPrice) * quantity,
        items: [{
          productId: String(selectedProduct.id),
          quantity,
          costPrice: Number(selectedProduct.costPrice),
          sellingPrice: Number(selectedProduct.sellingPrice)
        }]
      };
    }

    setLoading(true);
    try {
      await api.post('/api/sales', payload);
      setSaleForm({ productName: '', quantity: '', paymentMethod: 'UPI', isCustom: false, customPrice: '' });
      await fetchAllData();
      setSuccessModal({
        isOpen: true,
        title: 'Sale Logged',
        message: 'The sale was recorded successfully.',
      });
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to log sale.';
      alert(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: productForm.name.trim(),
      category: productForm.category.trim(),
      costPrice: Number(productForm.costPrice),
      sellingPrice: Number(productForm.sellingPrice),
      stock: Number(productForm.stock)
    };

    if (!productForm.name.trim() || !productForm.category.trim() || !productForm.sellingPrice || !productForm.costPrice || productForm.stock === '') {
      alert('Please fill out all product fields (Name, Category, Sell Price, Cost Price, and Stock).');
      return;
    }

    if (Number.isNaN(payload.costPrice) || payload.costPrice < 0 || Number.isNaN(payload.sellingPrice) || payload.sellingPrice < 0 || Number.isNaN(payload.stock) || payload.stock < 0) {
      alert('Prices and stock must be valid non-negative numbers.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/products', payload);
      setProductForm({ name: '', category: '', sellingPrice: '', costPrice: '', stock: '' });
      await fetchAllData();
      setSuccessModal({
        isOpen: true,
        title: 'Product Created',
        message: 'The product was added to your inventory.',
      });
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to add product.';
      alert(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  // ─── Error State ───
  if (error) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-6">
        <div className="card max-w-md w-full p-8 text-center border-l-4 border-l-rose-500">
          <div className="p-3 bg-rose-50 rounded-xl w-fit mx-auto mb-4">
            <TrendingDown size={24} className="text-rose-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Connection Error</h2>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  // ─── Authentication State ───
  if (!isAuthenticated) {
    return (
      <Login 
        onLogin={(token) => {
          localStorage.setItem('shop_admin_token', token);
          setIsAuthenticated(true);
        }}
      />
    );
  }

  // ─── Loading State ───
  if (!data) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-[3px] border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-sm font-medium text-gray-400 tracking-wide animate-pulse">Syncing with database...</p>
      </div>
    );
  }

  // ─── Main Dashboard ───
  return (
    <div className="min-h-screen bg-[var(--color-bg)] font-sans">
      {loading && <LoadingOverlay />}
      <SuccessModal
        isOpen={successModal.isOpen}
        title={successModal.title}
        message={successModal.message}
        onClose={() => setSuccessModal({ ...successModal, isOpen: false })}
      />
      <ProductDrawer
        product={selectedProductForDrawer}
        onClose={() => setSelectedProductForDrawer(null)}
      />
      <SaleDrawer
        sale={selectedSaleForDrawer}
        onClose={() => setSelectedSaleForDrawer(null)}
      />
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Header + Filters */}
        <Header
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          onRefresh={() => fetchAllData()}
          fetchAllData={fetchAllData}
          onLogout={() => {
            localStorage.removeItem('shop_admin_token');
            setIsAuthenticated(false);
          }}
        />

        {/* Financial Chart */}
        <DashboardChart 
          data={chartData} 
          period={chartPeriod}
          onPeriodChange={setChartPeriod}
          loading={chartLoading}
        />

        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <MetricCard
            title="Total Revenue"
            value={`₹${data.totalRevenue.toFixed(2)}`}
            icon={TrendingUp}
            accentColor="emerald"
            delay={1}
          />
          <MetricCard
            title="Total Expenses"
            value={`₹${data.totalExpenses.toFixed(2)}`}
            icon={TrendingDown}
            accentColor="rose"
            delay={2}
          />
          <MetricCard
            title="COGS"
            value={`₹${data.totalCOGS.toFixed(2)}`}
            icon={CreditCard}
            accentColor="amber"
            delay={3}
          />
          <MetricCard
            title="Gross Profit"
            value={`₹${data.grossProfit.toFixed(2)}`}
            icon={DollarSign}
            accentColor="blue"
            delay={4}
          />
          <MetricCard
            title="Total Invested"
            value={`₹${data.totalInitialCosts.toFixed(2)}`}
            icon={Package}
            accentColor="indigo"
            delay={5}
          />
          <MetricCard
            title="Current Inv"
            value={`₹${data.totalInventoryValue.toFixed(2)}`}
            icon={Package}
            accentColor="indigo"
            delay={6}
          />
        </div>

        {/* Net Profit Hero */}
        <ProfitHero
          netProfit={data.netProfit}
          cogs={data.totalCOGS}
          grossProfit={data.grossProfit}
        />

        {/* Quick Action Forms */}
        <QuickActions
          saleForm={saleForm}
          setSaleForm={setSaleForm}
          handleAddSale={handleAddSale}
          allProducts={allProducts}
          expenseForm={expenseForm}
          setExpenseForm={setExpenseForm}
          handleAddExpense={handleAddExpense}
          productForm={productForm}
          setProductForm={setProductForm}
          handleAddProduct={handleAddProduct}
          onOpenBulkImport={() => setBulkImportModalOpen(true)}
        />

        {/* Data Tables */}
        <div className="space-y-6">

          {/* Products Table */}
          <DataTable
            title="Products Inventory"
            icon={Package}
            total={productsPagination.total}
            headers={['Name', 'Category', 'Sell Price', 'Cost Price', 'Stock', 'Created', 'Updated', 'Action']}
            isEmpty={productsList.length === 0}
            emptyMessage="No products found."
            pagination={productsPagination}
            onPrev={() => fetchProducts(productsPagination.page - 1)}
            onNext={() => fetchProducts(productsPagination.page + 1)}
            delay={1}
          >
            {productsList.map((p) => (
              <tr 
                key={p.id} 
                onClick={() => setSelectedProductForDrawer(p)}
                className="cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <td className="font-medium text-gray-900">{p.name}</td>
                <td>
                  <span className="badge bg-gray-100 text-gray-600">{p.category || '—'}</span>
                </td>
                <td className="font-semibold text-emerald-600">₹{Number(p.sellingPrice).toFixed(2)}</td>
                <td className="font-semibold text-amber-600">₹{Number(p.costPrice).toFixed(2)}</td>
                <td>
                  <span className={`badge ${p.stock > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    {p.stock}
                  </span>
                </td>
                <td className="text-gray-400 text-xs">{new Date(p.createdAt).toLocaleDateString()}</td>
                <td className="text-gray-400 text-xs">{p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : '—'}</td>
                <td>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProduct(p.id, p.name);
                    }}
                    className="btn-danger-ghost"
                    title="Delete Product"
                    aria-label={`Delete product ${p.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </DataTable>

          {/* Sales Table */}
          <DataTable
            title="Recent Sales"
            icon={ShoppingBag}
            total={salesPagination.total}
            headers={['Items', 'Qty', 'Total', 'Payment', 'Date', 'Action']}
            isEmpty={salesList.length === 0}
            emptyMessage="No sales recorded."
            pagination={salesPagination}
            onPrev={() => fetchSales(salesPagination.page - 1)}
            onNext={() => fetchSales(salesPagination.page + 1)}
            delay={2}
          >
            {salesList.map((s) => {
              const itemNames = s.items?.map(i => i.productName || i.product?.name).filter(Boolean).join(', ') || 'Item';
              return (
                <tr 
                  key={s.id}
                  onClick={() => setSelectedSaleForDrawer(s)}
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <td className="font-medium text-gray-900">{itemNames}</td>
                  <td>
                    <span className="badge bg-indigo-50 text-indigo-700">
                      {s.items?.reduce((sum, i) => sum + i.quantity, 0)}
                    </span>
                  </td>
                  <td className="font-semibold text-indigo-600">₹{Number(s.totalAmount).toFixed(2)}</td>
                  <td>
                    <span className="badge bg-gray-100 text-gray-600">{s.paymentMethod}</span>
                  </td>
                  <td className="text-gray-400 text-xs">{new Date(s.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSale(s.id);
                      }}
                      className="btn-danger-ghost"
                      title="Delete Sale & Restore Stock"
                      aria-label={`Delete sale ${s.id}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </DataTable>

          {/* Expenses Table */}
          <DataTable
            title="Recent Expenses"
            icon={Receipt}
            total={expensesPagination.total}
            headers={['Title', 'Category', 'Amount', 'Date', 'Action']}
            isEmpty={expensesList.length === 0}
            emptyMessage="No expenses recorded."
            pagination={expensesPagination}
            onPrev={() => fetchExpenses(expensesPagination.page - 1)}
            onNext={() => fetchExpenses(expensesPagination.page + 1)}
            delay={3}
          >
            {expensesList.map((e) => (
              <tr 
                key={e.id}
                onClick={() => setSelectedExpenseForDrawer(e)}
                className="cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <td className="font-medium text-gray-900">{e.title}</td>
                <td>
                  <span className="badge bg-gray-100 text-gray-600">{e.category || '—'}</span>
                </td>
                <td className="font-semibold text-rose-600">₹{Number(e.amount).toFixed(2)}</td>
                <td className="text-gray-400 text-xs">{new Date(e.createdAt).toLocaleDateString()}</td>
                <td>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDeleteExpense(e.id, e.title);
                    }}
                    className="btn-danger-ghost"
                    title="Delete Expense"
                    aria-label={`Delete expense ${e.title}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </DataTable>

        </div>

      </div>

      <ProductDrawer 
        product={selectedProductForDrawer} 
        onClose={() => setSelectedProductForDrawer(null)}
        onSaved={refreshDataPreservingPagination}
      />
      <SaleDrawer
        sale={selectedSaleForDrawer}
        onClose={() => setSelectedSaleForDrawer(null)}
        onSaved={refreshDataPreservingPagination}
      />
      <ExpenseDrawer
        expense={selectedExpenseForDrawer}
        onClose={() => setSelectedExpenseForDrawer(null)}
        onSaved={refreshDataPreservingPagination}
      />
      
      <BulkImportModal
        isOpen={bulkImportModalOpen}
        onClose={() => setBulkImportModalOpen(false)}
        onSuccess={(msg) => {
          fetchAllData();
          setSuccessModal({ isOpen: true, title: 'Import Successful', message: msg });
        }}
      />
    </div>
  );
}