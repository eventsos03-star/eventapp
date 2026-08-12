import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler } from './shared/middleware/error.js';
import { notFound } from './shared/middleware/notFound.js';
import routes from './routes/index.js';

const app = express();

// Behind a reverse proxy in production so req.ip is correct (rate limiting).
app.set('trust proxy', env.NODE_ENV === 'production');

app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }),
);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'EventOS API is running',
    data: { uptime: process.uptime() },
  });
});

app.use('/api', routes);
// app.get("/",(req,res)=>{
//   res.end("hhhh")
// })

// 404 for unknown routes, then the global error handler.
app.use(notFound);
app.use(errorHandler);

export default app;
