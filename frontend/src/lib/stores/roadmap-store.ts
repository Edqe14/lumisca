import { proxy } from 'valtio';
import { EventEmitter } from 'eventemitter3';
import { fetcher } from '../utils';
import { Task as TaskType, TaskGroup } from '../validators/task';

type RoadmapEvent = {};

export const roadmapStore = proxy({
  id: null as string | null,
  roadmap: null as Roadmap | null,
  tasks: [] as Task[],
});

export class Task implements TaskType {
  id: string;
  name: string;
  creator: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  groupId: string;
  completedAt: string | null;

  constructor(data: TaskType, public roadmap: Roadmap) {
    this.id = data.id;
    this.name = data.name;
    this.creator = data.creator;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.deletedAt = data.deletedAt;
    this.groupId = data.groupId;
    this.completedAt = data.completedAt;
  }

  async updateCompleted(completed: boolean) {
    const res = await fetcher<TaskType>(`/task/${this.id}`, {
      method: 'PUT',
      data: {
        completedAt: completed ? new Date().toISOString() : null,
      },
    });

    if (res.status !== 200) {
      return null;
    }

    await this.roadmap.fetchTasks();

    return res.data;
  }
}

export class Roadmap extends EventEmitter<RoadmapEvent> implements TaskGroup {
  id: string;
  name: string;

  creator: string;
  totalTasks: number;
  totalCompletedTasks: number;

  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;

  constructor(data: TaskGroup) {
    super();

    this.id = data.id;
    this.name = data.name;

    this.creator = data.creator;
    this.totalTasks = data.totalTasks;
    this.totalCompletedTasks = data.totalCompletedTasks;

    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.deletedAt = data.deletedAt;
  }

  async fetchTasks() {
    const res = await fetcher<TaskType[]>(`/task-groups/${this.id}/task`);

    if (res.status !== 200) {
      return null;
    }

    roadmapStore.tasks = res.data.map((task) => new Task(task, this));
  }

  async createTask(data: Pick<TaskType, 'name'>) {
    const res = await fetcher<Task>(`/task-groups/${this.id}/task`, {
      method: 'POST',
      data,
    });

    if (res.status !== 200) {
      return null;
    }

    await this.fetchTasks();

    return res.data;
  }

  async pull() {
    const res = await fetcher<TaskGroup>(`/task-groups/${this.id}`);

    if (res.status !== 200) {
      return false;
    }

    const data = res.data;
    const roadmap = new Roadmap(data);

    roadmapStore.roadmap = roadmap;
  }

  async delete() {
    const res = await fetcher(`/task-groups/${this.id}`, {
      method: 'DELETE',
    });

    if (res.status !== 200) {
      return null;
    }

    roadmapStore.id = null;
    roadmapStore.roadmap = null;
    roadmapStore.tasks = [];

    return res.data;
  }
}

export const fetchRoadmap = async (
  id: string,
  abortController: AbortController
) => {
  const res = await fetcher<TaskGroup>(`/task-groups/${id}`, {
    signal: abortController.signal,
  });

  if (res.status !== 200) {
    return null;
  }

  const data = res.data;
  const roadmap = new Roadmap(data);

  return roadmap;
};
