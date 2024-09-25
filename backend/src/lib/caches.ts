import type { Session } from './structures/session';
import type { Task } from './structures/task';
import type { TaskGroup } from './structures/task-group';
import type { User } from './structures/user';

export const userCache = new Map<string, User>();
export const sessionCache = new Map<string, Session>();
export const taskGroupCache = new Map<string, TaskGroup>();
export const taskCache = new Map<string, Task>();
