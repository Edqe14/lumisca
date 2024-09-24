import { Hono } from 'hono';
import { auth, db } from '../lib/firebase';
import { UserData } from '../lib/structures/user';

const userRoute = new Hono();

userRoute.get('/me', async (c) => {
  if (!c.user) {
    return c.json({ message: 'Unauthorized' }, 401);
  }

  const userRecord = await auth.getUser(c.user.id);
  const lastUpdatedAt = new Date(c.user.updatedAt);

  //check lastUpdatedAt already passed 1 hour interval
  if (new Date().getTime() - lastUpdatedAt.getTime() > 3600000) {
    const data = {
      name: userRecord.displayName ?? userRecord.email?.split('@')[0] ?? 'Anon',
      profilePict: userRecord.photoURL ?? null,
      updatedAt: new Date().toISOString(),
    } satisfies Partial<UserData>;

    Object.assign(c.user, data);
    await c.user.sync();
  }

  return c.json(c.user);
});

export { userRoute };
