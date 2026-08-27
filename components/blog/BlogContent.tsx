import type { ReactNode } from 'react';

type TextBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading2'; text: string }
  | { type: 'heading3'; text: string }
  | { type: 'bullets'; items: string[] }
  | { type: 'numbers'; items: string[] };

function parseContent(content: string): TextBlock[] {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const blocks: TextBlock[] = [];
  let paragraph: string[] = [];
  let bullets: string[] = [];
  let numbers: string[] = [];

  const flush = () => {
    if (paragraph.length) {
      blocks.push({ type: 'paragraph', text: paragraph.join(' ') });
      paragraph = [];
    }
    if (bullets.length) {
      blocks.push({ type: 'bullets', items: bullets });
      bullets = [];
    }
    if (numbers.length) {
      blocks.push({ type: 'numbers', items: numbers });
      numbers = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flush();
    } else if (line.startsWith('## ')) {
      flush();
      blocks.push({ type: 'heading2', text: line.slice(3).trim() });
    } else if (line.startsWith('### ')) {
      flush();
      blocks.push({ type: 'heading3', text: line.slice(4).trim() });
    } else if (line.startsWith('- ')) {
      if (paragraph.length || numbers.length) flush();
      bullets.push(line.slice(2).trim());
    } else if (/^\d+\.\s/.test(line)) {
      if (paragraph.length || bullets.length) flush();
      numbers.push(line.replace(/^\d+\.\s*/, '').trim());
    } else {
      if (bullets.length || numbers.length) flush();
      paragraph.push(line);
    }
  }
  flush();
  return blocks;
}

export default function BlogContent({ content }: { content: string }) {
  const blocks = parseContent(content);

  return (
    <div className="space-y-6 text-[1.0625rem] leading-8 text-slate-700">
      {blocks.map((block, index): ReactNode => {
        if (block.type === 'heading2') {
          return <h2 key={index} className="pt-4 text-3xl font-bold tracking-tight text-slate-900">{block.text}</h2>;
        }
        if (block.type === 'heading3') {
          return <h3 key={index} className="pt-2 text-2xl font-semibold text-slate-900">{block.text}</h3>;
        }
        if (block.type === 'bullets') {
          return (
            <ul key={index} className="list-disc space-y-2 pl-6">
              {block.items.map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}
            </ul>
          );
        }
        if (block.type === 'numbers') {
          return (
            <ol key={index} className="list-decimal space-y-2 pl-6">
              {block.items.map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}
            </ol>
          );
        }
        return <p key={index}>{block.text}</p>;
      })}
    </div>
  );
}
