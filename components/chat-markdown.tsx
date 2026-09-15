"use client";

import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

/**
 * Renders assistant markdown (headings, bold/italic, lists, tables, code,
 * links, blockquotes) with styles matched to the assistant chat bubbles.
 * Raw HTML is never rendered, so model output stays safe by default.
 */
export function ChatMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkBreaks]}
      components={{
        h1: ({ children }) => (
          <h1 className="mt-5 mb-3 border-b border-[#dcd7ec] pb-1.5 text-xl font-black tracking-tight first:mt-0">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="mt-5 mb-2.5 text-lg font-black tracking-tight first:mt-0">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="mt-4 mb-2 text-base font-extrabold first:mt-0">{children}</h3>
        ),
        h4: ({ children }) => (
          <h4 className="mt-3.5 mb-1.5 text-sm font-extrabold uppercase tracking-wide first:mt-0">
            {children}
          </h4>
        ),
        p: ({ children }) => <p className="my-2.5 first:mt-0 last:mb-0">{children}</p>,
        strong: ({ children }) => <strong className="font-extrabold">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        del: ({ children }) => <del className="opacity-60">{children}</del>,
        a: ({ children, href, title }) => (
          <a
            href={href}
            title={title}
            target="_blank"
            rel="noreferrer"
            className="font-bold text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
          >
            {children}
          </a>
        ),
        ul: ({ children }) => (
          <ul className="my-2.5 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="my-2.5 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="pl-1 leading-7 marker:text-primary">{children}</li>
        ),
        blockquote: ({ children }) => (
          <blockquote className="my-3 border-l-4 border-primary/40 bg-accent/60 py-1.5 pr-2 pl-3 text-[0.92em] font-semibold text-accent-foreground last:mb-0 [&>p]:my-1">
            {children}
          </blockquote>
        ),
        hr: () => <hr className="my-4 border-[#dcd7ec]" />,
        code: ({ className, children }) =>
          className ? (
            <code className={`${className} font-mono text-[0.9em]`}>{children}</code>
          ) : (
            <code className="rounded-md bg-accent px-1.5 py-0.5 font-mono text-[0.85em] font-bold text-accent-foreground">
              {children}
            </code>
          ),
        pre: ({ children }) => (
          <pre className="scrollbar-thin my-3 overflow-x-auto rounded-xl bg-[#201a38] p-3.5 text-[0.85em] leading-6 text-[#f8f6ff] last:mb-0 [&_code]:text-inherit">
            {children}
          </pre>
        ),
        table: ({ children }) => (
          <div className="scrollbar-thin my-3 overflow-x-auto rounded-xl border border-[#dcd7ec] last:mb-0">
            <table className="w-full border-collapse text-[0.86em]">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-accent/70">{children}</thead>,
        th: ({ children, style }) => (
          <th
            style={style}
            className="border-b border-[#dcd7ec] px-3 py-2 text-left text-xs font-black uppercase tracking-wide"
          >
            {children}
          </th>
        ),
        td: ({ children, style }) => (
          <td style={style} className="border-b border-[#dcd7ec]/70 px-3 py-2 align-top">
            {children}
          </td>
        ),
        tr: ({ children }) => (
          <tr className="even:bg-accent/30 last:[&>td]:border-b-0">{children}</tr>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
