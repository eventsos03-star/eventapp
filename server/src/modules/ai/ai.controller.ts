import type { Request, Response } from 'express';
import { searchKnowledge } from './services/search.service.js';
import { generateAnswerStream } from './services/generation.service.js';

function startSse(res: Response): void {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
}

function sendEvent(res: Response, data: { type: string; content?: string; message?: string }): void {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export const ask = async (req: Request, res: Response): Promise<void> => {
  const { question } = req.body as { question: string };

  startSse(res);

  try {
    const results = await searchKnowledge(question);

    const stream = generateAnswerStream(question, results);
    for await (const chunk of stream) {
      sendEvent(res, { type: 'chunk', content: chunk });
    }

    sendEvent(res, { type: 'done' });
    res.end();
  } catch (error) {
    // Log the real error server-side only; never send internals to the client.
    console.error('[ai/ask] error:', error);

    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'AI service error' });
      return;
    }

    sendEvent(res, { type: 'error', message: 'AI service error' });
    res.end();
  }
};