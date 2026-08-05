import { useEffect } from 'react';

/**
 * 커스텀 확인/취소(또는 예/아니오) 팝업이 열려있는 동안 Enter 키로 확인(onConfirm)을
 * 실행할 수 있게 한다. (네이티브 window.confirm/alert은 브라우저가 이미 Enter를
 * 기본 지원하므로 이 훅이 필요 없음 — 커스텀 모달/팝업 전용)
 *
 * isOpen이 false거나 onConfirm이 없으면(예: 아직 선택값이 없어 확인 버튼이 비활성인 경우)
 * 아무 동작도 하지 않는다.
 */
export function useEnterConfirm(isOpen: boolean, onConfirm: (() => void) | null | undefined) {
  useEffect(() => {
    if (!isOpen || !onConfirm) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onConfirm]);
}
