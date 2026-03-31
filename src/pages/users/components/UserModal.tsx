import { useState } from 'react';
import type { User } from '../../../types';
import { PERMISSIONS, STATUS } from '../../../constants';
import Modal from '../../../components/Modal';

interface UserModalProps {
  user: User | null;
  onClose: () => void;
  onSave?: (user: User) => void;
}

export default function UserModal({ user, onClose, onSave }: UserModalProps) {
  const [formData, setFormData] = useState<User>(user || {
    userUid: '',
    userName: '',
    email: '',
    userPhone: '',
    permission: PERMISSIONS.USER,
    status: STATUS.ACTIVE,
    createdAt: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSave) {
      onSave(formData);
      onClose();
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="사용자 정보 수정" className="max-w-md">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">이름</label>
          <input
            type="text"
            value={formData.userName}
            onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">이메일</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">전화번호</label>
          <input
            type="tel"
            value={formData.userPhone ?? ''}
            onChange={(e) => setFormData({ ...formData, userPhone: e.target.value })}
            placeholder="010-0000-0000"
            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">권한</label>
          <select
            value={formData.permission}
            onChange={(e) => setFormData({ ...formData, permission: Number(e.target.value) })}
            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            <option value={PERMISSIONS.USER}>일반 사용자</option>
            <option value={PERMISSIONS.ADMIN}>관리자</option>
            <option value={PERMISSIONS.SUPER_ADMIN}>최고 관리자</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">상태</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: Number(e.target.value) })}
            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            <option value={STATUS.ACTIVE}>활성</option>
            <option value={STATUS.INACTIVE}>비활성</option>
            <option value={STATUS.BLOCKED}>블랙</option>
          </select>
        </div>

        {/* 한국투자증권 연동 정보 */}
        <div className="pt-2 border-t border-zinc-800">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">한국투자증권 연동</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">앱키 (App Key)</label>
              <input
                type="text"
                value={formData.kisAppKey ?? ''}
                onChange={(e) => setFormData({ ...formData, kisAppKey: e.target.value })}
                placeholder="KIS 앱키 입력"
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">앱시크릿 (App Secret)</label>
              <input
                type="password"
                value={formData.kisAppSecret ?? ''}
                onChange={(e) => setFormData({ ...formData, kisAppSecret: e.target.value })}
                placeholder="KIS 앱시크릿 입력"
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">계좌번호 (앞 8자리)</label>
              <input
                type="text"
                value={formData.kisAccountNo ?? ''}
                onChange={(e) => setFormData({ ...formData, kisAccountNo: e.target.value })}
                placeholder="12345678"
                maxLength={8}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">계좌상품코드</label>
              <select
                value={formData.kisAccountProduct ?? '01'}
                onChange={(e) => setFormData({ ...formData, kisAccountProduct: e.target.value })}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="01">01 - 종합</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors whitespace-nowrap"
          >
            취소
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-teal-500 text-white font-semibold rounded-lg hover:bg-teal-400 transition-colors whitespace-nowrap"
          >
            저장
          </button>
        </div>
      </form>
    </Modal>
  );
}
