import React from 'react';

/**
 * Renders article text as clean reading typography. Content is stored as
 * plain text; this adds light structure without ever injecting raw HTML:
 *   blank line  → new paragraph
 *   "# "/"## "  → headings
 *   "> "        → pull-quote
 *   "- " / "* " → bullet list
 */
export default function ArticleBody({ content, rtl }: { content: string; rtl: boolean }) {
  const blocks = content.replace(/\r\n/g, '\n').split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  let firstParagraph = true;

  return (
    <div className="article-prose" dir={rtl ? 'rtl' : undefined}>
      {blocks.map((block, i) => {
        if (/^#{1,2}\s/.test(block)) {
          const level = block.startsWith('##') ? 3 : 2;
          const text = block.replace(/^#{1,2}\s+/, '');
          return level === 2 ? <h2 key={i}>{text}</h2> : <h3 key={i}>{text}</h3>;
        }
        if (block.startsWith('>')) {
          return <blockquote key={i}>{block.split('\n').map((l) => l.replace(/^>\s?/, '')).join(' ')}</blockquote>;
        }
        const lines = block.split('\n');
        if (lines.every((l) => /^[-*•]\s+/.test(l.trim()))) {
          return (
            <ul key={i}>
              {lines.map((l, j) => <li key={j}>{l.trim().replace(/^[-*•]\s+/, '')}</li>)}
            </ul>
          );
        }
        const isFirst = firstParagraph;
        firstParagraph = false;
        return (
          <p key={i} className={isFirst && !rtl ? 'has-dropcap' : undefined}>
            {lines.map((l, j) => (
              <React.Fragment key={j}>
                {j > 0 && <br />}
                {l}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
