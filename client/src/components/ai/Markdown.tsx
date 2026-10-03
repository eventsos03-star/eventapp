import type { ReactNode } from "react";

/**
 * Lightweight markdown renderer used only AFTER a stream finishes, so it never
 * runs during streaming. Handles headings, bullet/numbered lists, code fences,
 * **bold** and `inline code`. Every other line falls through as plain text.
 */
export default function Markdown({ text }: { text: string }) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    if (line.trim().startsWith("```")) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        code.push(lines[i]);
        i++;
      }
      i++;
      blocks.push(
        <pre
          key={key++}
          className="mt-3 overflow-x-auto rounded-lg border border-ink-line bg-ink/70 p-4 font-mono text-[13px] leading-relaxed text-paper-dim/90"
        >
          {code.join("\n")}
        </pre>
      );
      continue;
    }

    const heading = line.match(/^#{1,3}\s+(.*)$/);
    if (heading) {
      blocks.push(
        <h2
          key={key++}
          className="mt-5 font-display text-lg font-semibold text-paper"
        >
          {inline(heading[1])}
        </h2>
      );
      i++;
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ""));
        i++;
      }
      blocks.push(
        <ul key={key++} className="mt-3 list-disc space-y-1.5 pl-5">
          {items.map((item, idx) => (
            <li key={idx}>{inline(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push(
        <ol key={key++} className="mt-3 list-decimal space-y-1.5 pl-5">
          {items.map((item, idx) => (
            <li key={idx}>{inline(item)}</li>
          ))}
        </ol>
      );
      continue;
    }

    const paragraph: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,3}\s|\d+\.\s|[-*]\s|```)/.test(lines[i].trim())
    ) {
      paragraph.push(lines[i]);
      i++;
    }
    blocks.push(
      <p key={key++} className="mt-3 leading-relaxed">
        {paragraph.map((paraLine, idx) => (
          <span key={idx}>
            {inline(paraLine)}
            {idx < paragraph.length - 1 ? <br /> : null}
          </span>
        ))}
      </p>
    );
  }

  return <div>{blocks}</div>;
}

function inline(line: string): ReactNode[] {
  const parts = line.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={idx}
          className="rounded border border-ink-line bg-ink/60 px-1 py-0.5 font-mono text-[0.85em] text-amber"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={idx} className="font-semibold text-paper">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}