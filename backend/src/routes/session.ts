import { Hono } from 'hono';
import {
  createSessionValidator,
  SessionMemberRTState,
  updateSessionStateValidator,
} from '../lib/validators/session';
import { SessionFactory } from '../lib/structures/session';
import { ZodError } from 'zod';
import { Experience } from '../lib/structures/experience';

const sessionRoute = new Hono();

sessionRoute
  .get('/', async (c) => {
    if (!c.user) {
      return c.json({ message: 'Unauthorized' }, 401);
    }

    const session = await SessionFactory.getAll(
      c.user.id,
      c.req.query('deleted') == '1'
    );

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
        creator: c.user.id,
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

    await session.channel.ensureRoom();

    const token = await session.channel.generateUserToken(
      c.user.id,
      session.creator === c.user.id
    );

    const addMember = await session.addMember(c.user.id, {
      id: c.user.id,
      name: c.user.name,
      profilePict: c.user.profilePict ?? null,
    });

    // give member experience
    c.user.grantExperience(Experience.XP_JOIN_SESSION);

    return c.json({
      message: 'Joined the session',
      token,
      roomId: session.channel.roomId,
      state: addMember?.state,
    });
  })
  .post('/leave', async (c) => {
    if (!c.user) {
      return c.json({ message: 'Unauthorized' }, 401);
    }

    const session = await SessionFactory.get(c.req.param('id'));

    if (!session) {
      return c.json({ message: 'Session not found' }, 404);
    }

    await session.removeMember(c.user.id);

    return c.json({ message: 'Left the session' });
  })
  .put('/updateState', async (c) => {
    if (!c.user) {
      return c.json({ message: 'Unauthorized' }, 401);
    }

    try {
      const body = await updateSessionStateValidator.parseAsync(
        await c.req.json()
      );
      const session = await SessionFactory.get(c.req.param('id'));

      if (!session) {
        return c.json({ message: 'Session not found' }, 404);
      }

      if (!(await session.updateMemberState(c.user.id, body))) {
        return c.json({ message: 'Request cannot be fulfilled' }, 400);
      }

      return c.json({ message: 'State updated' });
    } catch {
      return c.json({ message: 'Invalid request body' }, 400);
    }
  })
  .put('/start', async (c) => {
    if (!c.user) {
      return c.json({ message: 'Unauthorized' }, 401);
    }

    const session = await SessionFactory.get(c.req.param('id'));

    if (!session) {
      return c.json({ message: 'Session not found' }, 404);
    }

    await session.startTimer();

    return c.json({ message: 'Timer started' });
  })
  .put('/pause', async (c) => {
    if (!c.user) {
      return c.json({ message: 'Unauthorized' }, 401);
    }

    const session = await SessionFactory.get(c.req.param('id'));

    if (!session) {
      return c.json({ message: 'Session not found' }, 404);
    }

    await session.pauseTimer();

    return c.json({ message: 'Timer started' });
  });

sessionRoute.route('/', sessionIdRoute);

export { sessionRoute };
