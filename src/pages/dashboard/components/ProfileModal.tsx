import { useState } from 'react';
import type { User } from '../../../types';
import { getPermissionLabel } from '../../../utils/userHelpers';
import { userUpdate } from '../../../api/userApi';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export default function ProfileModal({ isOpen, onClose, user }: ProfileModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [kisAppKey, setKisAppKey] = useState(user?.kisAppKey ?? '');
  const [kisAppSecret, setKisAppSecret] = useState(user?.kisAppSecret ?? '');
  const [kisAccountNo, setKisAccountNo] = useState(user?.kisAccountNo ?? '');
  const [kisAccountProduct, setKisAccountProduct] = useState(user?.kisAccountProduct ?? '01');
  const [kisSaving, setKisSaving] = useState(false);
  const [kisMsg, setKisMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen || !user) return null;

  const handleKisSave = async () => {
    setKisSaving(true);
    setKisMsg(null);
    try {
      const res = await userUpdate({
        userUid: user.userUid,
        kisAppKey,
        kisAppSecret,
        kisAccountNo,
        kisAccountProduct,
      });
      if (res.status < 400) {
        setKisMsg({ type: 'success', text: 'KIS 연동 정보가 저장되었습니다.' });
      } else {
        setKisMsg({ type: 'error', text: res.message || '저장에 실패했습니다.' });
      }
    } catch {
      setKisMsg({ type: 'error', text: '서버 연결에 실패했습니다.' });
    } finally {
      setKisSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-zinc-100">프로필</h2>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-zinc-500 hover:text-zinc-200 cursor-pointer rounded-lg hover:bg-zinc-800 transition-colors">
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>

          {/* 프로필 헤더 */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-20 h-20 rounded-full bg-teal-500/20 flex items-center justify-center mb-3">
              <i className="ri-user-line text-4xl text-teal-400"></i>
            </div>
            <p className="text-lg font-semibold text-zinc-100">{user.userName}</p>
            <p className="text-sm text-zinc-400 mt-1">{user.email}</p>
            <span className="mt-2 px-3 py-0.5 text-xs font-medium bg-teal-500/20 text-teal-400 rounded-full">
              {getPermissionLabel(user.permission)}
            </span>
          </div>

          {/* 기본 정보 */}
          <div className="space-y-4">
            <div>
              <label className="text-sm text-zinc-500 mb-1.5 block font-medium">이름</label>
              <div className="w-full px-4 py-2.5 text-sm bg-zinc-800 border border-zinc-700 text-zinc-500 rounded-xl cursor-not-allowed select-none">
                {user.userName}
              </div>
            </div>
            <div>
              <label className="text-sm text-zinc-500 mb-1.5 block font-medium">이메일</label>
              <div className="w-full px-4 py-2.5 text-sm bg-zinc-800 border border-zinc-700 text-zinc-500 rounded-xl cursor-not-allowed select-none">
                {user.email}
              </div>
            </div>
            {user.userPhone && (
              <div>
                <label className="text-sm text-zinc-500 mb-1.5 block font-medium">전화번호</label>
                <div className="w-full px-4 py-2.5 text-sm bg-zinc-800 border border-zinc-700 text-zinc-500 rounded-xl cursor-not-allowed select-none">
                  {user.userPhone}
                </div>
              </div>
            )}
            <div>
              <label className="text-sm text-zinc-400 mb-1.5 block font-medium">새 비밀번호</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="새 비밀번호를 입력하세요"
                className="w-full px-4 py-2.5 text-sm bg-zinc-800 border border-zinc-700 text-zinc-200 placeholder-zinc-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="text-sm text-zinc-400 mb-1.5 block font-medium">비밀번호 확인</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="비밀번호를 다시 입력하세요"
                className="w-full px-4 py-2.5 text-sm bg-zinc-800 border border-zinc-700 text-zinc-200 placeholder-zinc-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <button className="mt-5 w-full py-2.5 bg-teal-500 text-white text-sm font-semibold rounded-xl hover:bg-teal-400 transition-colors cursor-pointer whitespace-nowrap">
            비밀번호 변경
          </button>

          {/* KIS 연동 섹션 */}
          <div className="mt-6 pt-5 border-t border-zinc-800">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">한국투자증권 연동</p>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-zinc-400 mb-1.5 block font-medium">앱키 (App Key)</label>
                <input
                  type="text"
                  value={kisAppKey}
                  onChange={(e) => setKisAppKey(e.target.value)}
                  placeholder="KIS 앱키 입력"
                  className="w-full px-4 py-2.5 text-sm bg-zinc-800 border border-zinc-700 text-zinc-200 placeholder-zinc-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="text-sm text-zinc-400 mb-1.5 block font-medium">앱시크릿 (App Secret)</label>
                <input
                  type="password"
                  value={kisAppSecret}
                  onChange={(e) => setKisAppSecret(e.target.value)}
                  placeholder="KIS 앱시크릿 입력"
                  className="w-full px-4 py-2.5 text-sm bg-zinc-800 border border-zinc-700 text-zinc-200 placeholder-zinc-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="text-sm text-zinc-400 mb-1.5 block font-medium">계좌번호 (앞 8자리)</label>
                <input
                  type="text"
                  value={kisAccountNo}
                  onChange={(e) => setKisAccountNo(e.target.value)}
                  placeholder="12345678"
                  maxLength={8}
                  className="w-full px-4 py-2.5 text-sm bg-zinc-800 border border-zinc-700 text-zinc-200 placeholder-zinc-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="text-sm text-zinc-400 mb-1.5 block font-medium">계좌상품코드</label>
                <select
                  value={kisAccountProduct}
                  onChange={(e) => setKisAccountProduct(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                >
                  <option value="01">01 - 종합</option>
                </select>
              </div>
            </div>

            {kisMsg && (
              <p className={`mt-3 text-sm ${kisMsg.type === 'success' ? 'text-teal-400' : 'text-red-400'}`}>
                {kisMsg.text}
              </p>
            )}

            <button
              onClick={handleKisSave}
              disabled={kisSaving}
              className="mt-4 w-full py-2.5 bg-zinc-700 text-zinc-100 text-sm font-semibold rounded-xl hover:bg-zinc-600 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
            >
              {kisSaving ? '저장 중...' : 'KIS 연동 정보 저장'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
