import { useState, useCallback } from 'react';
import type { User } from '../../../types';
import { ROLES, STATUS } from '../../../constants';
import SearchInput from '../../../components/SearchInput';
import Badge from '../../../components/Badge';
import Modal from '../../../components/Modal';
import Pagination from '../../../components/Pagination';
import UserModal from './UserModal';
import { useTableFilter } from '../../../hooks/useTableFilter';

interface UserTableProps {
  users: User[];
  onUpdateUser: (user: User) => void;
  onDeleteUser: (id: number) => void;
}

export default function UserTable({ users, onUpdateUser, onDeleteUser }: UserTableProps) {
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const filterFn = useCallback((user: User) => {
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesRole && matchesStatus;
  }, [roleFilter, statusFilter]);

  const {
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    paginatedData: paginatedUsers,
    totalPages,
  } = useTableFilter({
    data: users,
    searchFields: ['name', 'email'],
    filterFn,
    itemsPerPage: 10,
  });

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleSave = (updatedUser: User) => {
    onUpdateUser(updatedUser);
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleDeleteClick = (user: User) => {
    setDeleteTarget(user);
  };

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      onDeleteUser(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    return role === ROLES.ADMIN ? 'info' : 'default';
  };

  const getStatusBadgeVariant = (status: string): 'success' | 'danger' | 'warning' => {
    if (status === STATUS.ACTIVE) return 'success';
    if (status === STATUS.BLOCKED) return 'danger';
    return 'warning';
  };

  const getRoleLabel = (role: string) => {
    return role === ROLES.ADMIN ? '관리자' : '일반 사용자';
  };

  const getStatusLabel = (status: string) => {
    if (status === STATUS.ACTIVE) return '활성';
    if (status === STATUS.BLOCKED) return '차단';
    return '비활성';
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="이름 또는 이메일 검색..."
          className="flex-1 min-w-[200px]"
        />

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        >
          <option value="all">모든 역할</option>
          <option value={ROLES.ADMIN}>관리자</option>
          <option value={ROLES.USER}>일반 사용자</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        >
          <option value="all">모든 상태</option>
          <option value={STATUS.ACTIVE}>활성</option>
          <option value={STATUS.INACTIVE}>비활성</option>
          <option value={STATUS.BLOCKED}>차단</option>
        </select>
      </div>

      <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-zinc-800/60 border-b border-zinc-800">
                <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">이름</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">이메일</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">역할</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">상태</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">가입일</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {paginatedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-zinc-500">{user.id}</td>
                  <td className="px-6 py-4 text-sm font-medium text-zinc-200">{user.name}</td>
                  <td className="px-6 py-4 text-sm text-zinc-400">{user.email}</td>
                  <td className="px-6 py-4">
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {getRoleLabel(user.role)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={getStatusBadgeVariant(user.status)}>
                      {getStatusLabel(user.status)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-400">{user.joinDate}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="w-8 h-8 flex items-center justify-center text-teal-400 hover:bg-teal-500/15 rounded-lg transition-colors cursor-pointer"
                        title="수정"
                      >
                        <i className="ri-edit-line"></i>
                      </button>
                      <button
                        onClick={() => handleDeleteClick(user)}
                        className="w-8 h-8 flex items-center justify-center text-red-400 hover:bg-red-500/15 rounded-lg transition-colors cursor-pointer"
                        title="삭제"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {isModalOpen && selectedUser && (
        <UserModal
          user={selectedUser}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedUser(null);
          }}
          onSave={handleSave}
        />
      )}

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        className="max-w-sm"
      >
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-red-500/15 text-red-400">
              <i className="ri-user-unfollow-line text-xl"></i>
            </div>
            <h2 className="text-lg font-semibold text-zinc-100">회원 탈퇴</h2>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed">
            <span className="text-zinc-200 font-medium">{deleteTarget?.name}</span> 회원을 탈퇴시키겠습니까?<br />
            이 작업은 되돌릴 수 없습니다.
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setDeleteTarget(null)}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              취소
            </button>
            <button
              onClick={handleDeleteConfirm}
              className="px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              탈퇴 처리
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
