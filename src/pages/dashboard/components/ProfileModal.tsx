import { useState } from 'react';
import type { User } from '../../../types';
import { PERMISSIONS } from '../../../constants';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

const getPermissionLabel = (permission?: number) => {
  if (permission === PERMISSIONS.SUPER_ADMIN) return '최고 관리자';
  if (permission === PERMISSIONS.ADMIN) return '관리자';
  return '일반 사용자';
};

export default function ProfileModal({ isOpen, onClose, user }: ProfileModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 sm:p-10" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-semibold text-slate-800">프로필</h2>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer rounded-lg hover:bg-slate-100 transition-colors">
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 rounded-full bg-teal-100 flex items-center justify-center mb-4">
            <i className="ri-user-line text-4xl text-teal-600"></i>
          </div>
          <p className="text-lg font-semibold text-slate-800">{user?.userName ?? '-'}</p>
          <p className="text-sm text-slate-400 mt-1">{user?.email ?? '-'}</p>
          <span className="mt-2 px-3 py-0.5 text-xs font-medium bg-teal-100 text-teal-700 rounded-full">
            {getPermissionLabel(user?.permission)}
          </span>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-sm text-slate-500 mb-2 block font-medium">이름</label>
            <div className="w-full px-4 py-3 text-base bg-slate-100 border border-slate-200 text-slate-500 rounded-xl cursor-not-allowed select-none">
              {user?.userName ?? '-'}
            </div>
          </div>
          <div>
            <label className="text-sm text-slate-500 mb-2 block font-medium">이메일</label>
            <div className="w-full px-4 py-3 text-base bg-slate-100 border border-slate-200 text-slate-500 rounded-xl cursor-not-allowed select-none">
              {user?.email ?? '-'}
            </div>
          </div>
          {user?.userPhone && (
            <div>
              <label className="text-sm text-slate-500 mb-2 block font-medium">전화번호</label>
              <div className="w-full px-4 py-3 text-base bg-slate-100 border border-slate-200 text-slate-500 rounded-xl cursor-not-allowed select-none">
                {user.userPhone}
              </div>
            </div>
          )}
          <div>
            <label className="text-sm text-slate-700 mb-2 block font-medium">새 비밀번호</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="새 비밀번호를 입력하세요"
              className="w-full px-4 py-3 text-base bg-white border border-slate-200 text-slate-700 placeholder-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
            />
          </div>
          <div>
            <label className="text-sm text-slate-700 mb-2 block font-medium">비밀번호 확인</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="비밀번호를 다시 입력하세요"
              className="w-full px-4 py-3 text-base bg-white border border-slate-200 text-slate-700 placeholder-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
            />
          </div>
        </div>

        <button className="mt-8 w-full py-3 bg-teal-500 text-white text-base font-semibold rounded-xl hover:bg-teal-600 transition-colors cursor-pointer whitespace-nowrap">
          비밀번호 변경
        </button>
      </div>
    </div>
  );
}
