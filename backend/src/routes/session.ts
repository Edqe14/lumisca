import { Hono } from 'hono';
import { createSessionValidator } from '../lib/validators/session';
import { SessionFactory } from '../lib/structures/session';
import { ZodError } from 'zod';

const sessionRoute = new Hono();

sessionRoute
  .get('/', async (c) => {
    if (!c.user) {
      return c.json({ message: 'Unauthorized' }, 401);
    }

    const session = await SessionFactory.getAll(c.user.uid);

    return c.json(session);
  })
  .post('/', async (c) => {
    if (!c.user) {
      return c.json({ message: 'Unauthorized' }, 401);
    }

    try {
      const body = await createSessionValidator.parseAsync(await c.req.json());

      const newSession = await SessionFactory.create({
        ...body,
        creator: c.user.uid,
      });

      return c.json(newSession);
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json(
          { message: 'Invalid request body', error: err.flatten().fieldErrors },
          400
        );
      }

      return c.json({ message: 'Invalid request body' }, 400);
    }
  });

const sessionIdRoute = new Hono()
  .basePath('/:id')
  .get('/', async (c) => {
    if (!c.user) {
      return c.json({ message: 'Unauthorized' }, 401);
    }

    const session = await SessionFactory.get(c.req.param('id'));

    if (!session) {
      return c.json({ message: 'Session not found' }, 404);
    }

    return c.json(session);
  })
  .put('/', async (c) => {
    if (!c.user) {
      return c.json({ message: 'Unauthorized' }, 401);
    }

    try {
      const body = await createSessionValidator
        .partial()
        .parseAsync(await c.req.json());
      const session = await SessionFactory.get(c.req.param('id'));

      if (!session) {
        return c.json({ message: 'Session not found' }, 404);
      }

      Object.assign(session, body);
      await session.sync();

      return c.json(session);
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json(
          { message: 'Invalid request body', error: err.flatten().fieldErrors },
          400
        );
      }

      return c.json({ message: 'Invalid request body' }, 400);
    }
  })
  .delete('/', async (c) => {
    if (!c.user) {
      return c.json({ message: 'Unauthorized' }, 401);
    }

    const session = await SessionFactory.get(c.req.param('id'));

    if (!session) {
      return c.json({ message: 'Session not found' }, 404);
    }

    await session.delete();

    return c.json({ message: 'Session deleted' });
  });

// channel control
sessionIdRoute
  .post('/join', async (c) => {
    if (!c.user) {
      return c.json({ message: 'Unauthorized' }, 401);
    }

    const session = await SessionFactory.get(c.req.param('id'));

    if (!session) {
      return c.json({ message: 'Session not found' }, 404);
    }

    const token = session.channel.generateUserToken(
      c.user.uid,
      session.creator === c.user.uid
    );
    await session.addMember(c.user.uid, {
      id: c.user.uid,
      name: c.user.displayName ?? c.user.email?.split('@')?.[0] ?? 'Anon',
      profilePict: c.user.photoURL ?? null,
    });

    return c.json({ message: 'Joined the session', token });
  })
  .post('/leave', async (c) => {
    if (!c.user) {
      return c.json({ message: 'Unauthorized' }, 401);
    }

    const session = await SessionFactory.get(c.req.param('id'));

    if (!session) {
      return c.json({ message: 'Session not found' }, 404);
    }

    await session.removeMember(c.user.uid);

    return c.json({ message: 'Left the session' });
  });

sessionRoute.route('/', sessionIdRoute);

export { sessionRoute };
