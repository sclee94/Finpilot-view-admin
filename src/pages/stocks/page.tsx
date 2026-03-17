import { useState } from 'react';
import StockList from './components/StockList';
import StockModal from './components/StockModal';
import PageLayout from '../../components/PageLayout';
import { MOCK_STOCKS } from '../../mocks/stocks';

export default function Stocks() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleAddStock = (data: { name: string; symbol: string; price: number }) => {
    console.log('New stock:', data);
  };

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <h1 className="text-2xl font-bold text-white">주식 관리</h1>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-amber-500 text-zinc-950 font-semibold rounded-lg hover:bg-amber-400 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer"
          >
            <i className="ri-add-line"></i>
            주식 추가
          </button>
        </div>

        <StockList stocks={MOCK_STOCKS} />

        <StockModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddStock}
        />
      </div>
    </PageLayout>
  );
}