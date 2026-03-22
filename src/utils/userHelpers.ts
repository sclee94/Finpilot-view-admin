import { PERMISSIONS, STATUS } from '../constants';

export type PermissionBadgeVariant = 'danger' | 'info' | 'default';
export type StatusBadgeVariant = 'success' | 'danger' | 'warning';

export function getPermissionLabel(permission?: number): string {
  if (permission === PERMISSIONS.SUPER_ADMIN) return '최고 관리자';
  if (permission === PERMISSIONS.ADMIN) return '관리자';
  return '일반 사용자';
}

export function getPermissionBadgeVariant(permission: number): PermissionBadgeVariant {
  if (permission === PERMISSIONS.SUPER_ADMIN) return 'danger';
  if (permission === PERMISSIONS.ADMIN) return 'info';
  return 'default';
}

export function getStatusLabel(status: number): string {
  if (status === STATUS.ACTIVE) return '활성';
  if (status === STATUS.BLOCKED) return '블랙';
  return '비활성';
}

export function getStatusBadgeVariant(status: number): StatusBadgeVariant {
  if (status === STATUS.ACTIVE) return 'success';
  if (status === STATUS.BLOCKED) return 'danger';
  return 'warning';
}
