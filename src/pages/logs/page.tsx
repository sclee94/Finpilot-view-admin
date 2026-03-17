import LogTable from './components/LogTable';
import PageLayout from '../../components/PageLayout';
import { MOCK_LOGS } from '../../mocks/logs';

export default function Logs() {
  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <h1 className="text-2xl font-bold text-white">시스템 로그</h1>
          <button className="px-4 py-2 bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-lg hover:bg-zinc-700 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer">
            <i className="ri-download-line"></i>
            로그 내보내기
          </button>
        </div>

        <LogTable logs={MOCK_LOGS} />
      </div>
    </PageLayout>
  );
}
