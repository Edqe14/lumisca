import { Hono } from 'hono';
import { auth, db } from '../lib/firebase';
import { User } from '../lib/structures/user';

const userRoute = new Hono();

userRoute.get('/me', async (c) => {
  if (!c.user) {
    return c.json({ message: 'Unauthorized' }, 401);
  }

  const userId = c.user.uid;
  const updatedUser = await auth.getUser(userId);
  const user = await db.collection('users').doc(userId).get();

  if (!user.exists) {
    const data = {
      id: userId,
      name:
        updatedUser.displayName ?? updatedUser.email?.split('@')[0] ?? 'Anon',
      email: c.user.email!,
      profilePict: c.user.photoURL ?? null,
      level: 1,
      experience: 0,
      points: 0,
      achivements: [],
      sessionsFinished: 0,

      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } satisfies User;

    await user.ref.set(data);

    return c.json(data);
  }

  const data = {
    ...(user.data() as User),
    name: updatedUser.displayName ?? updatedUser.email?.split('@')[0] ?? 'Anon',
    profilePict: c.user.photoURL ?? null,
    updatedAt: new Date().toISOString(),
  };

  await user.ref.set(
    {
      name:
        updatedUser.displayName ?? updatedUser.email?.split('@')[0] ?? 'Anon',
      profilePict: c.user.photoURL ?? null,
    },
    { merge: true }
  );

  return c.json(data);
});

export { userRoute };
