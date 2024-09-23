import { MiddlewareHandler } from 'hono';
import { auth } from '../firebase';
import { UserRecord } from 'firebase-admin/auth';

export const userCache = new Map<string, UserRecord>();

export const authenticated: MiddlewareHandler = async (c, next) => {
  const token = c.req.header('Authorization')?.split(' ')?.[1];

  if (!token) {
    return c.json({ message: 'Unauthorized' }, 401);
  }

  try {
    const decoded = await auth.verifyIdToken(token, true);

    c.user = userCache.get(decoded.uid) ?? (await auth.getUser(decoded.uid));

    return next();
  } catch (err) {
    return c.json({ message: 'Unauthorized' }, 401);
  }
};
