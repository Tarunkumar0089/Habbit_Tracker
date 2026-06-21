import ReactMarkdown from "react-markdown";

const components = {
  // eslint-disable-next-line no-unused-vars
  p: ({ node, ...props }) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
  // eslint-disable-next-line no-unused-vars
  strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />,
  // eslint-disable-next-line no-unused-vars
  em: ({ node, ...props }) => <em className="italic" {...props} />,
  // eslint-disable-next-line no-unused-vars
  ul: ({ node, ...props }) => (
    <ul className="list-disc pl-5 my-2 space-y-1" {...props} />
  ),
  // eslint-disable-next-line no-unused-vars
  ol: ({ node, ...props }) => (
    <ol className="list-decimal pl-5 my-2 space-y-1" {...props} />
  ),
  // eslint-disable-next-line no-unused-vars
  li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
  // eslint-disable-next-line no-unused-vars
  h1: ({ node, ...props }) => (
    <h3 className="font-semibold text-base mt-3 mb-1" {...props} />
  ),
  // eslint-disable-next-line no-unused-vars
  h2: ({ node, ...props }) => (
    <h3 className="font-semibold text-base mt-3 mb-1" {...props} />
  ),
  // eslint-disable-next-line no-unused-vars
  h3: ({ node, ...props }) => (
    <h3 className="font-semibold text-base mt-3 mb-1" {...props} />
  ),
  // eslint-disable-next-line no-unused-vars
  blockquote: ({ node, ...props }) => (
    <blockquote
      className="border-l-2 border-brand-500/40 pl-3 my-2 italic text-soft"
      {...props}
    />
  ),
  // eslint-disable-next-line no-unused-vars
  code: ({ node, children, className, ...props }) => {
    const isInline = !className && !String(children).includes("\n");
    return isInline ? (
      <code
        className="px-1.5 py-0.5 rounded text-[0.85em] font-mono"
        style={{ background: "var(--chip-bg)" }}
        {...props}
      >
        {children}
      </code>
    ) : (
      <code
        className={`block rounded-lg p-3 text-[0.85em] font-mono overflow-x-auto${
          className ? ` ${className}` : ""
        }`}
        style={{ background: "var(--chip-bg)" }}
        {...props}
      >
        {children}
      </code>
    );
  },
  // eslint-disable-next-line no-unused-vars
  a: ({ node, href, ...rest }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-brand-700 dark:text-brand-300 underline underline-offset-2"
      {...rest}
    />
  ),
  // eslint-disable-next-line no-unused-vars
  hr: ({ node }) => <hr className="my-3 divider" />,
};

export default function Markdown({ children, className = "" }) {
  return (
    <div className={className}>
      <ReactMarkdown components={components}>{children || ""}</ReactMarkdown>
    </div>
  );
}
