import { z } from 'zod';

export const taskValidator = z.object({
  id: z.string(),
  name: z.string().describe('Short description of the task'),
  groupId: z.string(),

  creator: z.string(),

  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
});

export const taskGroupValidator = z.object({
  id: z.string(),
  name: z.string(),

  creator: z.string(),
  totalTasks: z.number(),
  totalCompletedTasks: z.number(),

  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
});

export const createTaskGroupValidator = taskGroupValidator.pick({
  name: true,
  creator: true,
});

export const createTaskValidator = taskValidator.pick({
  name: true,
  creator: true,
  groupId: true,
});

export type Task = z.infer<typeof taskValidator>;
export type TaskGroup = z.infer<typeof taskGroupValidator>;
export type CreateTask = z.infer<typeof createTaskValidator>;
export type CreateTaskGroup = z.infer<typeof createTaskGroupValidator>;
