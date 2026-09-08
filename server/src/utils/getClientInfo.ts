import type { Request } from 'express';
import { UAParser } from 'ua-parser-js';

export interface ClientInfo {
  browser: string;
  ip: string;
  userAgent: string;
}

export function getClientInfo(req: Request): ClientInfo {
  const raw = req.headers['user-agent'] || 'unknown';
  const parser = new UAParser(raw);
  const browser = parser.getBrowser();
  const browserName =
    `${browser.name || 'Unknown'} ${browser.version || ''}`.trim();

  return {
    browser: browserName,
    ip: req.ip || req.socket.remoteAddress || '',
    userAgent: raw,
  };
}
