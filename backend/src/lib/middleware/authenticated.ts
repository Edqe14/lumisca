import { MiddlewareHandler } from 'hono';
import { auth } from '../firebase';
import type { UserRecord } from 'firebase-admin/auth';
import { UserFactory } from '../structures/user';

export const authenticated: MiddlewareHandler = async (c, next) => {
  const token = c.req.header('Authorization')?.split(' ')?.[1];

  if (!token) {
    return c.json({ message: 'Unauthorized' }, 401);
  }

  try {
    const decoded = await auth.verifyIdToken(token, true);

    c.user =
      (await UserFactory.get(decoded.uid)) ??
      (await UserFactory.create({
        id: decoded.uid,
        email: decoded.email!,
        name: decoded.name ?? decoded.email?.split('@')[0] ?? 'Anon',
        profilePict: decoded.picture ?? null,
      }));

    return next();
  } catch (err) {
    console.log(err);
    return c.json({ message: 'Unauthorized' }, 401);
  }
};
