import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageLayout from '../../components/PageLayout';
import { getBriefing } from '../../api/briefingApi';
import type { Briefing } from '../../api/briefingApi';
import BriefingCategoryBadge from './BriefingCategoryBadge';
import MarkdownView from '../../components/MarkdownView';

// 브리핑 상세 (읽기 전용) — 본문은 외부 자동화가 보낸 마크다운을 렌더링해서 보여준다.
export default function BriefingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item,    setItem]    = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    const briefingId = Number(id);
    if (!briefingId) {
      setError('잘못된 게시글 주소입니다.');
      setLoading(false);
      return;
    }
    setLoading(true);
    getBriefing(briefingId)
      .then(res => {
        if (res.status >= 400 || !res.data) setError(res.message || '브리핑을 불러오지 못했습니다.');
        else setItem(res.data);
      })
      .catch(() => setError('서버 연결에 실패했습니다.'))
      .finally(() => setLoading(false));
  }, [id]);

  // 목록에서 들어왔으면 history 뒤로(보던 카테고리/페이지 유지), 주소로 바로 들어왔으면 목록 첫 페이지로
  const goBack = () => {
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate('/briefing');
  };

  return (
    <PageLayout>
      <div className="space-y-4 max-w-5xl">
        <button
          onClick={goBack}
          className="flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
        >
          <i className="ri-arrow-left-line"></i>
          목록으로
        </button>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <i className="ri-loader-4-line animate-spin text-teal-400 text-3xl"></i>
          </div>
        ) : error || !item ? (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-300">
            <i className="ri-error-warning-line shrink-0"></i>
            {error || '브리핑을 불러오지 못했습니다.'}
          </div>
        ) : (
          <article className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <header className="px-6 py-5 border-b border-zinc-800">
              <div className="flex items-center gap-2 mb-2">
                <BriefingCategoryBadge category={item.category} />
                <span className="text-xs text-zinc-500">{item.briefingDate}</span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-zinc-100 break-words">{item.title}</h1>
              <p className="text-xs text-zinc-500 mt-1.5">등록 {item.createdAt}</p>
            </header>
            <div className="px-4 sm:px-6 py-5">
              <MarkdownView content={item.content ?? ''} />
            </div>
          </article>
        )}
      </div>
    </PageLayout>
  );
}
