import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { authenticated } from './lib/middleware/authenticated';
import { userRoute } from './routes/user';

const app = new Hono();

app.use(logger());
app.use(cors());

app.use(authenticated);
app.route('/user', userRoute);

declare module 'hono' {
  interface Context {
    user?: DecodedIdToken;
  }
}

export default {
  port: 3001,
  fetch: app.fetch,
};
