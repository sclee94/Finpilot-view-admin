import { briefingCategoryLabel } from '../../api/briefingApi';

const CATEGORY_BADGE: Record<string, string> = {
  MORNING:     'bg-amber-500/15 text-amber-400',
  EVENING:     'bg-indigo-500/15 text-indigo-400',
  AFTER_CLOSE: 'bg-teal-500/15 text-teal-400',
};

export default function BriefingCategoryBadge({ category }: { category: string }) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap ${CATEGORY_BADGE[category] ?? 'bg-zinc-700 text-zinc-400'}`}>
      {briefingCategoryLabel(category)}
    </span>
  );
}
