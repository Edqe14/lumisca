import { MiddlewareHandler } from 'hono';
import { auth } from '../firebase';
import { getCookie, setCookie } from 'hono/cookie';

export const authenticated: MiddlewareHandler = async (c, next) => {
  const token = c.req.header('Authorization')?.split(' ')?.[1];

  if (!token) {
    return c.json({ message: 'Unauthorized' }, 401);
  }

  try {
    const decoded = await auth.verifyIdToken(token, true);

    c.user = decoded;

    return next();
  } catch (err) {
    return c.json({ message: 'Unauthorized' }, 401);
  }
};
