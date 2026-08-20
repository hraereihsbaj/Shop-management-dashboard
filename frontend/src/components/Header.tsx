import { CalendarDays, ArrowUpDown, RefreshCw, X, LogOut } from 'lucide-react';

interface HeaderProps {
  selectedDate: string;
  setSelectedDate: (d: string) => void;
  sortOrder: 'desc' | 'asc';
  setSortOrder: (s: 'desc' | 'asc') => void;
  selectedMonth: string;
  setSelectedMonth: (m: string) => void;
  selectedYear: string;
  setSelectedYear: (y: string) => void;
  onRefresh: () => void;
  fetchAllData: (m: string, y: string, sort: 'desc' | 'asc', d: string) => void;
  onLogout?: () => void;
}

export default function Header({
  selectedDate,
  setSelectedDate,
  sortOrder,
  setSortOrder,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  onRefresh,
  fetchAllData,
  onLogout,
}: HeaderProps) {
  return (
    <div className="animate-fade-in space-y-6">
      {/* Title */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">
            Financial Overview
          </h1>
          <p className="text-gray-400 mt-1.5 text-sm">
            Real-time metrics from your Telegram Bot & Web UI.
          </p>
        </div>
        {onLogout && (
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-100"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="card px-3 sm:px-4 py-2.5 sm:py-3">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Date Picker */}
          <div className="flex items-center gap-2">
            <CalendarDays size={15} className="text-gray-400 shrink-0" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                const d = e.target.value;
                setSelectedDate(d);
                fetchAllData(selectedMonth, selectedYear, sortOrder, d);
              }}
              className="form-select text-xs py-1.5 min-w-[130px]"
              aria-label="Filter by specific date"
            />
            {selectedDate && (
              <button
                onClick={() => {
                  setSelectedDate('');
                  fetchAllData(selectedMonth, selectedYear, sortOrder, '');
                }}
                className="btn-danger-ghost p-1 rounded"
                title="Clear date filter"
                aria-label="Clear date filter"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="w-px h-6 bg-gray-200 hidden sm:block" />

          {/* Sort */}
          <div className="flex items-center gap-2">
            <ArrowUpDown size={15} className="text-gray-400 shrink-0" />
            <select
              value={sortOrder}
              onChange={(e) => {
                const sort = e.target.value as 'desc' | 'asc';
                setSortOrder(sort);
                fetchAllData(selectedMonth, selectedYear, sort, selectedDate);
              }}
              className="form-select text-xs py-1.5"
              aria-label="Sort order"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>

          <div className="w-px h-6 bg-gray-200 hidden sm:block" />

          {/* Month */}
          <div className="flex items-center gap-2">
            <select
              value={selectedMonth}
              disabled={Boolean(selectedDate)}
              onChange={(e) => {
                const m = e.target.value;
                setSelectedMonth(m);
                fetchAllData(m, selectedYear, sortOrder, selectedDate);
              }}
              className="form-select text-xs py-1.5"
              aria-label="Filter by month"
            >
              <option value="">All Time</option>
              <option value="1">January</option>
              <option value="2">February</option>
              <option value="3">March</option>
              <option value="4">April</option>
              <option value="5">May</option>
              <option value="6">June</option>
              <option value="7">July</option>
              <option value="8">August</option>
              <option value="9">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>

            {selectedMonth && !selectedDate && (
              <select
                value={selectedYear}
                onChange={(e) => {
                  const y = e.target.value;
                  setSelectedYear(y);
                  fetchAllData(selectedMonth, y, sortOrder, selectedDate);
                }}
                className="form-select text-xs py-1.5"
                aria-label="Filter by year"
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
            )}
          </div>

          {/* Spacer */}
          <div className="flex-grow" />

          {/* Refresh */}
          <button
            onClick={onRefresh}
            className="btn btn-ghost text-xs py-1.5 px-3"
            aria-label="Refresh all data"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}
