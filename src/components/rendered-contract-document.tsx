import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Reveal } from "@/components/reveal";

export function RenderedContractDocument({
  body,
  actionSlot,
  signatureSlot,
}: {
  body: string;
  actionSlot?: ReactNode;
  signatureSlot?: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-none px-6 py-10 sm:px-12 sm:py-14">
      {actionSlot ? (
        <div className="mb-8 flex flex-wrap items-center gap-3 print:hidden">{actionSlot}</div>
      ) : null}

      <Reveal>
        <div className="contract-markdown text-ink">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            skipHtml
            components={{
              h1: ({ children }) => (
                <h1 className="mb-7 font-serif text-4xl font-medium leading-none sm:text-5xl">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="mb-3 mt-10 break-after-avoid font-serif text-3xl font-medium leading-none first:mt-0">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="mb-2 mt-7 break-after-avoid font-serif text-2xl font-medium leading-tight">{children}</h3>
              ),
              p: ({ children }) => <p className="my-3 text-[15px] leading-[1.7] text-ink/78">{children}</p>,
              ul: ({ children }) => (
                <ul className="my-4 list-disc space-y-2 pl-6 text-[15px] leading-[1.7] text-ink/78">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="my-4 list-decimal space-y-2 pl-6 text-[15px] leading-[1.7] text-ink/78">
                  {children}
                </ol>
              ),
              li: ({ children }) => <li className="pl-1">{children}</li>,
              strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
              hr: () => <hr className="my-9 border-0 border-t border-ink/15" />,
              table: ({ children }) => (
                <table className="my-5 block w-full min-w-[560px] overflow-x-auto border-collapse text-left text-sm sm:table">
                  {children}
                </table>
              ),
              th: ({ children }) => (
                <th className="border-b border-ink/25 bg-white/45 px-3 py-2 font-semibold text-ink">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="border-b border-ink/12 px-3 py-2.5 align-top leading-6 text-ink/78">
                  {children}
                </td>
              ),
              a: ({ children, href }) => (
                <a href={href} className="underline decoration-ink/30 underline-offset-2">
                  {children}
                </a>
              ),
            }}
          >
            {body}
          </ReactMarkdown>
        </div>
      </Reveal>

      {signatureSlot ? <Reveal delay={0.05}>{signatureSlot}</Reveal> : null}
    </article>
  );
}
