export interface DocChunk {
  source: string;
  section: string;
  text: string;
}

const HEADING_RE = /^#{1,6}\s+/;
const MAX_CHUNK_LINES = 40;

export function chunkMarkdown(source: string, markdown: string): DocChunk[] {
  const chunks: DocChunk[] = [];
  let section = source;
  let buffer: string[] = [];

  const flush = (): void => {
    const text = buffer.join('\n').trim();
    if (text) {
      chunks.push({ source, section, text });
    }
    buffer = [];
  };

  const lines = markdown.split(/\r?\n/);
  for (const line of lines) {
    if (HEADING_RE.test(line)) {
      flush();
      section = line.replace(HEADING_RE, '').trim();
    } else if (buffer.length >= MAX_CHUNK_LINES) {
      flush();
      buffer.push(line);
    } else {
      buffer.push(line);
    }
  }
  flush();

  return chunks.filter((chunk) => chunk.text.length > 0);
}