
export interface DocumentChunk {
  content: string;
  source: string;
  section: string;
}

const MAX_CHUNK_SIZE = 1500;

function getSectionPath(
  sections: { level: number; title: string }[]
): string {
  return sections.map((section) => section.title).join(" > ");
}

export function chunkMarkdown(
  markdown: string,
  source: string
): DocumentChunk[] {
  const lines = markdown.split(/\r?\n/);

  const chunks: DocumentChunk[] = [];
  const sections: { level: number; title: string }[] = [];

  let content = "";
  let heading = "";

  const saveChunk = () => {
    const text = content.trim();

    if (!text) return;

    chunks.push({
      content: heading ? `${heading}\n\n${text}` : text,
      source,
      section: sections.length
        ? getSectionPath(sections)
        : source,
    });

    content = "";
  };

  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)$/);

    if (match) {
      saveChunk();

      const level = match[1].length;
      const title = match[2].trim();

      while (
        sections.length &&
        sections[sections.length - 1].level >= level
      ) {
        sections.pop();
      }

      sections.push({ level, title });

      heading = line.trim();
      continue;
    }

    if (line.trim()) {
      if (
        content.length + line.length > MAX_CHUNK_SIZE
      ) {
        saveChunk();
      }

      content += `${line}\n`;
    }
  }

  saveChunk();

  return chunks;
}
