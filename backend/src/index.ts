import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { authenticated } from './lib/middleware/authenticated';
import { userRoute } from './routes/user';
import { sessionRoute } from './routes/session';
import type { User } from './lib/structures/user';
import { groupRouter } from './routes/task-group';
import { taskRouter } from './routes/task';

const app = new Hono();

app.use(logger());
app.use(cors());

app.use(authenticated);

// begin api
const api = new Hono();

api.route('/user', userRoute);
api.route('/session', sessionRoute);
api.route('/task', taskRouter);
api.route('/task-groups', groupRouter);
// end api

app.route('/api', api);

declare module 'hono' {
  interface Context {
    user?: User;
  }
}

export default {
  port: 3001,
  fetch: app.fetch,
};
