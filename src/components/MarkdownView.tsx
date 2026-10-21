import Markdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

// 브리핑 본문(외부 자동화가 보내는 마크다운: 제목/표/굵게/인용/구분선/목록) 렌더링.
// 다크 테마에 맞춘 태그별 스타일 — @tailwindcss/typography 없이 직접 지정한다.
// 표는 열이 많아(최대 9열) 좁은 화면에서 가로 스크롤되도록 감싼다.
const components: Components = {
  h1: ({ children }) => <h1 className="text-xl sm:text-2xl font-bold text-zinc-50 mt-2 mb-4">{children}</h1>,
  h2: ({ children }) => (
    <h2 className="text-lg sm:text-xl font-bold text-zinc-100 mt-10 mb-4 pb-2 border-b border-zinc-800">{children}</h2>
  ),
  h3: ({ children }) => <h3 className="text-base sm:text-lg font-semibold text-teal-400 mt-7 mb-3">{children}</h3>,
  h4: ({ children }) => <h4 className="text-base font-semibold text-zinc-200 mt-5 mb-2">{children}</h4>,
  p:  ({ children }) => <p className="my-3 leading-7 text-zinc-300">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-zinc-50">{children}</strong>,
  em: ({ children }) => <em className="italic text-zinc-200">{children}</em>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-teal-400 underline underline-offset-2 hover:text-teal-300">
      {children}
    </a>
  ),
  ul: ({ children }) => <ul className="my-3 pl-5 list-disc space-y-1.5 text-zinc-300 marker:text-zinc-500">{children}</ul>,
  ol: ({ children }) => <ol className="my-3 pl-5 list-decimal space-y-1.5 text-zinc-300 marker:text-zinc-500">{children}</ol>,
  li: ({ children }) => <li className="leading-7 pl-1">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-4 px-4 py-1 border-l-4 border-amber-500/60 bg-amber-500/5 rounded-r-lg text-sm text-zinc-400 [&_p]:text-zinc-400">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-8 border-zinc-800" />,
  code: ({ children }) => (
    <code className="px-1.5 py-0.5 rounded bg-zinc-800 text-[0.85em] text-amber-300 font-mono">{children}</code>
  ),
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-xl border border-zinc-800">
      <table className="w-full min-w-[640px] text-sm border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-zinc-800/70">{children}</thead>,
  tr: ({ children }) => <tr className="border-b border-zinc-800 last:border-0 even:bg-zinc-800/20">{children}</tr>,
  th: ({ children }) => (
    <th className="px-3 py-2.5 text-left font-semibold text-zinc-300 whitespace-nowrap align-bottom">{children}</th>
  ),
  td: ({ children }) => <td className="px-3 py-2.5 text-zinc-300 align-top leading-6 min-w-[88px]">{children}</td>,
};

export default function MarkdownView({ content }: { content: string }) {
  return (
    <div className="text-sm sm:text-[15px] break-words">
      <Markdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </Markdown>
    </div>
  );
}
