import { Hono } from 'hono';
import { TaskFactory } from '../lib/structures/task';
import { ZodError } from 'zod';
import { createTaskValidator } from '../lib/validators/task';

const taskRouter = new Hono();

taskRouter
  .get('/', async (c) => {
    if (!c.user) {
      return c.json({ message: 'Unauthorized' }, 401);
    }

    const allTasks = await TaskFactory.getAll(c.user.id);

    return c.json(allTasks);
  })
  .get('/:id', async (c) => {
    if (!c.user) {
      return c.json({ message: 'Unauthorized' }, 401);
    }

    const task = await TaskFactory.get(c.req.param('id'));

    if (!task) {
      return c.json({ message: 'Task not found' }, 404);
    }

    return c.json(task);
  })
  .put('/:id', async (c) => {
    if (!c.user) {
      return c.json({ message: 'Unauthorized' }, 401);
    }

    const task = await TaskFactory.get(c.req.param('id'));

    if (!task) {
      return c.json({ message: 'Task not found' }, 404);
    }

    try {
      const body = await createTaskValidator
        .pick({ name: true })
        .parseAsync(await c.req.json());

      Object.assign(task, body);
      await task.sync();

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
  })
  .delete('/:id', async (c) => {
    if (!c.user) {
      return c.json({ message: 'Unauthorized' }, 401);
    }

    const task = await TaskFactory.get(c.req.param('id'));

    if (!task) {
      return c.json({ message: 'Task not found' }, 404);
    }

    await task.delete();

    return c.json({ message: 'Task deleted' });
  });

export { taskRouter };
