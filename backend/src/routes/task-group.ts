import { Hono } from 'hono';
import { TaskFactory } from '../lib/structures/task';
import { TaskGroupFactory } from '../lib/structures/task-group';
import {
  createTaskGroupValidator,
  createTaskValidator,
} from '../lib/validators/task';
import { z, ZodError } from 'zod';
import { taskStructuredGemini } from '../lib/gemini';
import { AchivementRegistry } from '../lib/structures/achivement';

const groupRouter = new Hono();

groupRouter
  .get('/', async (c) => {
    if (!c.user) {
      return c.json({ message: 'Unauthorized' }, 401);
    }

    const groups = await TaskGroupFactory.getAll(c.user.id);

    return c.json(groups);
  })
  .post('/', async (c) => {
    if (!c.user) {
      return c.json({ message: 'Unauthorized' }, 401);
    }

    try {
      const body = await createTaskGroupValidator
        .pick({ name: true })
        .extend({ prompt: z.string().max(256).optional() })
        .parseAsync(await c.req.json());

      const taskGroup = await TaskGroupFactory.create({
        name: body.name,
        creator: c.user.id,
      });

      if (body.prompt) {
        const prompt =
          'Generate a roadmap by the user and split it to small tasks: ' +
          body.prompt.trim();
        const { tasks } = await taskStructuredGemini.invoke(prompt);

        taskGroup.totalTasks = tasks.length;
        await taskGroup.sync();

        for (const task of tasks) {
          await TaskFactory.create({
            name: task,
            creator: c.user.id,
            groupId: taskGroup.id,
          });
        }
      }

      await AchivementRegistry.trigger({ user: c.user, taskGroup });

      return c.json(taskGroup);
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json(
          { message: 'Invalid request body', error: err.flatten().fieldErrors },
          400
        );
      }

      console.error(err);

      return c.json({ message: 'Invalid request body' }, 400);
    }
  });

const groupIdRouter = new Hono().basePath('/:id');

groupIdRouter
  .get('/', async (c) => {
    if (!c.user) {
      return c.json({ message: 'Unauthorized' }, 401);
    }

    const group = await TaskGroupFactory.get(c.req.param('id'));

    if (!group) {
      return c.json({ message: 'Task group not found' }, 404);
    }

    return c.json(group);
  })
  .put('/', async (c) => {
    if (!c.user) {
      return c.json({ message: 'Unauthorized' }, 401);
    }

    const group = await TaskGroupFactory.get(c.req.param('id'));

    if (!group) {
      return c.json({ message: 'Task group not found' }, 404);
    }

    try {
      const body = await createTaskGroupValidator
        .pick({ name: true })
        .partial()
        .parseAsync(await c.req.json());

      Object.assign(group, body);
      await group.sync();

      return c.json(group);
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

    const group = await TaskGroupFactory.get(c.req.param('id'));

    if (!group) {
      return c.json({ message: 'Task group not found' }, 404);
    }

    await group.delete();

    return c.json({ message: 'Task group deleted' });
  });

// TASKS
const tasksRouter = new Hono().basePath('/:gid/task');

tasksRouter
  .get('/', async (c) => {
    if (!c.user) {
      return c.json({ message: 'Unauthorized' }, 401);
    }

    const tasks = await TaskFactory.getAll(c.req.param('gid'));

    return c.json(tasks);
  })
  .post('/', async (c) => {
    if (!c.user) {
      return c.json({ message: 'Unauthorized' }, 401);
    }

    try {
      const group = await TaskGroupFactory.get(c.req.param('gid'));

      if (!group) {
        return c.json({ message: 'Task group not found' }, 404);
      }

      const body = await createTaskValidator
        .pick({ name: true })
        .parseAsync(await c.req.json());
      const task = await group.createTask({
        ...body,
        creator: c.user.id,
      });

      return c.json(task);
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

// end
groupRouter.route('/', tasksRouter);
groupRouter.route('/', groupIdRouter);

export { groupRouter };
