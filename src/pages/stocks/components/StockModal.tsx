import { useState } from 'react';
import Modal from '../../../components/Modal';

interface StockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: { name: string; symbol: string; price: number }) => void;
}

export default function StockModal({ isOpen, onClose, onSubmit }: StockModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    price: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit({
        name: formData.name,
        symbol: formData.symbol,
        price: parseFloat(formData.price),
      });
    }
    setFormData({ name: '', symbol: '', price: '' });
    onClose();
  };

  const handleClose = () => {
    setFormData({ name: '', symbol: '', price: '' });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="주식 추가" className="max-w-md">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1">종목명</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="종목명 입력"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1">종목코드</label>
          <input
            type="text"
            value={formData.symbol}
            onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="종목코드 입력"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1">현재가</label>
          <input
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="현재가 입력"
            step="0.01"
            required
          />
        </div>
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors whitespace-nowrap cursor-pointer"
          >
            취소
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-teal-500 text-white font-semibold rounded-lg hover:bg-teal-400 transition-colors whitespace-nowrap cursor-pointer"
          >
            추가
          </button>
        </div>
      </form>
    </Modal>
  );
}