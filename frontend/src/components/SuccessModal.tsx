import { CheckCircle } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

export default function SuccessModal({ isOpen, title, message, onClose }: SuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4 animate-slide-up text-center">
        <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 mb-4">
          <CheckCircle className="text-emerald-500" size={28} />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-6">{message}</p>
        <button
          onClick={onClose}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl transition-colors"
        >
          Great!
        </button>
      </div>
    </div>
  );
}
