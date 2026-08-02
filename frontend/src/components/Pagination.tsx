import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}

export default function Pagination({ page, totalPages, onPrev, onNext }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
      <button
        onClick={onPrev}
        disabled={page <= 1}
        className="btn btn-ghost text-xs py-1.5 px-3"
        aria-label="Previous page"
      >
        <ChevronLeft size={14} />
        Prev
      </button>
      <span className="text-xs font-medium text-gray-400">
        Page {page} of {totalPages}
      </span>
      <button
        onClick={onNext}
        disabled={page >= totalPages}
        className="btn btn-ghost text-xs py-1.5 px-3"
        aria-label="Next page"
      >
        Next
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
