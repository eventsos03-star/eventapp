import type { Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';
import { askDocsStream } from './ai.service.js';

export const askDocs = asyncHandler(async (req, res: Response) => {
  const { question } = req.body as { question: string };

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const write = (payload: unknown): void => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  try {
    for await (const part of askDocsStream(question)) {
      if (typeof part === 'string') {
        write({ delta: part });
      } else {
        write({ sources: part.sources });
      }
    }
    write({ done: true });
  } catch (err) {
    const message = err instanceof AppError ? err.message : 'Something went wrong while generating the answer.';
    write({ error: message });
  } finally {
    res.end();
  }
});