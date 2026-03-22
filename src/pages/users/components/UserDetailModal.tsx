import type { User } from '../../../types';
import Modal from '../../../components/Modal';
import Badge from '../../../components/Badge';
import { getPermissionLabel, getPermissionBadgeVariant, getStatusLabel, getStatusBadgeVariant } from '../../../utils/userHelpers';

interface UserDetailModalProps {
  user: User | null;
  onClose: () => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

export default function UserDetailModal({ user, onClose, onEdit, onDelete }: UserDetailModalProps) {
  if (!user) return null;

  return (
    <Modal isOpen={true} onClose={onClose} title="사용자 상세 정보" className="max-w-md">
      <div className="p-6 space-y-5">

        {/* 프로필 헤더 */}
        <div className="flex items-center gap-4 pb-4 border-b border-zinc-800">
          <div className="w-14 h-14 rounded-full bg-teal-500/20 flex items-center justify-center shrink-0">
            <i className="ri-user-line text-2xl text-teal-400"></i>
          </div>
          <div className="min-w-0">
            <p className="text-lg font-semibold text-zinc-100 truncate">{user.userName}</p>
            <p className="text-sm text-zinc-400 truncate">{user.email}</p>
            <div className="flex gap-2 mt-1.5">
              <Badge variant={getPermissionBadgeVariant(user.permission)}>
                {getPermissionLabel(user.permission)}
              </Badge>
              <Badge variant={getStatusBadgeVariant(user.status)}>
                {getStatusLabel(user.status)}
              </Badge>
            </div>
          </div>
        </div>

        {/* 상세 정보 */}
        <div className="space-y-3">
          <InfoRow label="UID" value={user.userUid} />
          <InfoRow label="이름" value={user.userName} />
          <InfoRow label="이메일" value={user.email} />
          <InfoRow label="전화번호" value={user.userPhone ?? '-'} />
          <InfoRow label="가입일" value={user.createdAt ?? '-'} />
          <InfoRow label="최근 로그인" value={user.loginDate ?? '-'} />
        </div>

        {/* 버튼 */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm bg-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            닫기
          </button>
          <button
            onClick={() => { onEdit(user); onClose(); }}
            className="flex-1 px-4 py-2 text-sm bg-teal-500 text-white font-semibold hover:bg-teal-400 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-edit-line mr-1"></i>수정
          </button>
          <button
            onClick={() => { onDelete(user); onClose(); }}
            className="flex-1 px-4 py-2 text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-delete-bin-line mr-1"></i>삭제
          </button>
        </div>
      </div>
    </Modal>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-zinc-500 w-24 shrink-0">{label}</span>
      <span className="text-sm text-zinc-300 truncate">{value}</span>
    </div>
  );
}
