import { useState, useEffect } from 'react';
import type { User } from '../../../types';
import { getPermissionLabel } from '../../../utils/userHelpers';
import { getUser, userUpdate } from '../../../api/userApi';
import { authStorage } from '../../../utils/auth';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export default function ProfileModal({ isOpen, onClose, user }: ProfileModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [kisAppKey, setKisAppKey] = useState('');
  const [kisAppSecret, setKisAppSecret] = useState('');
  const [kisAccountNo, setKisAccountNo] = useState('');
  const [kisAccountProduct, setKisAccountProduct] = useState('01');
  const [kisPaperAppKey, setKisPaperAppKey] = useState('');
  const [kisPaperAppSecret, setKisPaperAppSecret] = useState('');
  const [kisPaperAccountNo, setKisPaperAccountNo] = useState('');
  const [kisPaperAccountProduct, setKisPaperAccountProduct] = useState('01');
  const [kisSaving, setKisSaving] = useState(false);
  const [kisMsg, setKisMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setNewPassword('');
    setConfirmPassword('');
    setPwMsg(null);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !user) return;
    getUser({ userUid: user.userUid }).then((res) => {
      if (res.status < 400 && res.data) {
        const u = res.data;
        setKisAppKey(u.kisAppKey ?? '');
        setKisAppSecret(u.kisAppSecret ?? '');
        setKisAccountNo(u.kisAccountNo ?? '');
        setKisAccountProduct(u.kisAccountProduct ?? '01');
        setKisPaperAppKey(u.kisPaperAppKey ?? '');
        setKisPaperAppSecret(u.kisPaperAppSecret ?? '');
        setKisPaperAccountNo(u.kisPaperAccountNo ?? '');
        setKisPaperAccountProduct(u.kisPaperAccountProduct ?? '01');
        const stored = authStorage.get();
        if (stored) authStorage.save({ ...stored, kisAppKey: u.kisAppKey, kisAppSecret: u.kisAppSecret, kisAccountNo: u.kisAccountNo, kisAccountProduct: u.kisAccountProduct, kisPaperAppKey: u.kisPaperAppKey, kisPaperAppSecret: u.kisPaperAppSecret, kisPaperAccountNo: u.kisPaperAccountNo, kisPaperAccountProduct: u.kisPaperAccountProduct });
      }
    }).catch(() => {
      setKisAppKey(user.kisAppKey ?? '');
      setKisAppSecret(user.kisAppSecret ?? '');
      setKisAccountNo(user.kisAccountNo ?? '');
      setKisAccountProduct(user.kisAccountProduct ?? '01');
      setKisPaperAppKey(user.kisPaperAppKey ?? '');
      setKisPaperAppSecret(user.kisPaperAppSecret ?? '');
      setKisPaperAccountNo(user.kisPaperAccountNo ?? '');
      setKisPaperAccountProduct(user.kisPaperAccountProduct ?? '01');
    });
  }, [isOpen, user?.userUid]);

  if (!isOpen || !user) return null;

  const handlePasswordChange = async () => {
    if (!newPassword || !confirmPassword) {
      setPwMsg({ type: 'error', text: '새 비밀번호를 입력해주세요.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwMsg({ type: 'error', text: '비밀번호가 일치하지 않습니다.' });
      return;
    }
    setPwSaving(true);
    setPwMsg(null);
    try {
      const res = await userUpdate({ userUid: user.userUid, password: newPassword });
      if (res.status < 400) {
        setPwMsg({ type: 'success', text: '비밀번호가 변경되었습니다.' });
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPwMsg({ type: 'error', text: res.message || '변경에 실패했습니다.' });
      }
    } catch {
      setPwMsg({ type: 'error', text: '서버 연결에 실패했습니다.' });
    } finally {
      setPwSaving(false);
    }
  };

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
        kisPaperAppKey,
        kisPaperAppSecret,
        kisPaperAccountNo,
        kisPaperAccountProduct,
      });
      if (res.status < 400) {
        setKisMsg({ type: 'success', text: 'KIS 연동 정보가 저장되었습니다.' });
        const stored = authStorage.get();
        if (stored) {
          authStorage.save({ ...stored, kisAppKey, kisAppSecret, kisAccountNo, kisAccountProduct, kisPaperAppKey, kisPaperAppSecret, kisPaperAccountNo, kisPaperAccountProduct });
        }
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

          {pwMsg && (
            <p className={`mt-3 text-sm ${pwMsg.type === 'success' ? 'text-teal-400' : 'text-red-400'}`}>
              {pwMsg.text}
            </p>
          )}

          <button
            onClick={handlePasswordChange}
            disabled={pwSaving}
            className="mt-5 w-full py-2.5 bg-teal-500 text-white text-sm font-semibold rounded-xl hover:bg-teal-400 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
          >
            {pwSaving ? '변경 중...' : '비밀번호 변경'}
          </button>

          {/* 카카오 알림 연동 섹션 */}
          <div className="mt-6 pt-5 border-t border-zinc-800">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">카카오 알림 연동</p>
            <p className="text-xs text-zinc-500 mb-4">카카오 계정을 연동하면 매매 체결 시 카카오톡으로 알림을 받을 수 있습니다.</p>
            <button
              type="button"
              onClick={() => { window.location.href = `${window.location.origin}/finpilot/admin/oauth/kakao/authorize?userUid=${user.userUid}`; }}
              className="w-full py-2.5 bg-[#FEE500] text-[#3C1E1E] text-sm font-semibold rounded-xl hover:bg-[#f5dc00] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#3C1E1E" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3C6.48 3 2 6.72 2 11.28c0 2.88 1.68 5.4 4.2 6.96l-1.08 4.02 4.68-3.06c.72.12 1.44.18 2.2.18 5.52 0 10-3.72 10-8.28C22 6.72 17.52 3 12 3z"/>
              </svg>
              카카오 알림 연동하기
            </button>
          </div>

          {/* KIS 연동 섹션 */}
          <div className="mt-6 pt-5 border-t border-zinc-800">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">한국투자증권 연동</p>
            <div className="space-y-4">
              <p className="text-xs text-zinc-500 font-medium">— 실전투자</p>
              <div>
                <label className="text-sm text-zinc-400 mb-1.5 block font-medium">앱키 (App Key)</label>
                <input
                  type="password"
                  value={kisAppKey}
                  onChange={(e) => setKisAppKey(e.target.value)}
                  placeholder="KIS 실전 앱키 입력"
                  className="w-full px-4 py-2.5 text-sm bg-zinc-800 border border-zinc-700 text-zinc-200 placeholder-zinc-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="text-sm text-zinc-400 mb-1.5 block font-medium">앱시크릿 (App Secret)</label>
                <input
                  type="password"
                  value={kisAppSecret}
                  onChange={(e) => setKisAppSecret(e.target.value)}
                  placeholder="KIS 실전 앱시크릿 입력"
                  className="w-full px-4 py-2.5 text-sm bg-zinc-800 border border-zinc-700 text-zinc-200 placeholder-zinc-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>
              <p className="text-xs text-zinc-500 font-medium pt-1">— 모의투자</p>
              <div>
                <label className="text-sm text-zinc-400 mb-1.5 block font-medium">모의 앱키 (Paper App Key)</label>
                <input
                  type="password"
                  value={kisPaperAppKey}
                  onChange={(e) => setKisPaperAppKey(e.target.value)}
                  placeholder="KIS 모의투자 앱키 입력"
                  className="w-full px-4 py-2.5 text-sm bg-zinc-800 border border-zinc-700 text-zinc-200 placeholder-zinc-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="text-sm text-zinc-400 mb-1.5 block font-medium">모의 앱시크릿 (Paper App Secret)</label>
                <input
                  type="password"
                  value={kisPaperAppSecret}
                  onChange={(e) => setKisPaperAppSecret(e.target.value)}
                  placeholder="KIS 모의투자 앱시크릿 입력"
                  className="w-full px-4 py-2.5 text-sm bg-zinc-800 border border-zinc-700 text-zinc-200 placeholder-zinc-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="text-sm text-zinc-400 mb-1.5 block font-medium">실전 계좌번호 (앞 8자리)</label>
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
                <label className="text-sm text-zinc-400 mb-1.5 block font-medium">실전 계좌상품코드</label>
                <select
                  value={kisAccountProduct}
                  onChange={(e) => setKisAccountProduct(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                >
                  <option value="01">01 - 종합</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-zinc-400 mb-1.5 block font-medium">모의투자 계좌번호 (앞 8자리)</label>
                <input
                  type="text"
                  value={kisPaperAccountNo}
                  onChange={(e) => setKisPaperAccountNo(e.target.value)}
                  placeholder="12345678"
                  maxLength={8}
                  className="w-full px-4 py-2.5 text-sm bg-zinc-800 border border-zinc-700 text-zinc-200 placeholder-zinc-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="text-sm text-zinc-400 mb-1.5 block font-medium">모의투자 계좌상품코드</label>
                <select
                  value={kisPaperAccountProduct}
                  onChange={(e) => setKisPaperAccountProduct(e.target.value)}
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
