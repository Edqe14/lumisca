import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import type { UserRecord } from 'firebase-admin/auth';
import { authenticated } from './lib/middleware/authenticated';
import { userRoute } from './routes/user';
import { sessionRoute } from './routes/session';

const app = new Hono();

app.use(logger());
app.use(cors());

app.use(authenticated);

// begin api
const api = new Hono();

api.route('/user', userRoute);
api.route('/session', sessionRoute);
// end api

app.route('/api', api);

declare module 'hono' {
  interface Context {
    user?: UserRecord;
  }
}

export default {
  port: 3001,
  fetch: app.fetch,
};
