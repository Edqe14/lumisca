import { z } from 'zod';
import type { DocumentReference } from 'firebase-admin/firestore';
import { db } from '../firebase';
import { BaseStructure } from './base';
import {
  createTaskGroupValidator,
  taskGroupValidator,
} from '../validators/task';
import { taskGroupCache } from '../caches';
import { CreateTaskData, TaskFactory } from './task';

export type TaskGroupData = z.infer<typeof taskGroupValidator>;
export type CreateTaskGroupData = z.infer<typeof createTaskGroupValidator>;

export class TaskGroup implements BaseStructure, TaskGroupData {
  id: string;
  name: string;

  creator: string;
  totalTasks: number;
  totalCompletedTasks: number;

  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;

  constructor(data: TaskGroupData, public ref: DocumentReference) {
    this.id = ref.id;
    this.name = data.name;
    this.creator = data.creator;
    this.totalTasks = data.totalTasks;
    this.totalCompletedTasks = data.totalCompletedTasks;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.deletedAt = data.deletedAt;
  }

  createTask(data: Pick<CreateTaskData, 'name' | 'creator'>) {
    return TaskFactory.create({
      ...data,
      groupId: this.id,
    });
  }

  getTasks() {
    return TaskFactory.getAll(this.id);
  }

  async pull() {
    const doc = await this.ref.get();

    if (!doc.exists) {
      return false;
    }

    const data = doc.data() as TaskGroupData;

    Object.assign(this, data);

    return true;
  }

  async sync() {
    const json = this.toJSON();
    await this.ref.set(json);

    return true;
  }

  async delete() {
    if (this.deletedAt) return;

    // update childs
    const allTasks = await TaskFactory.getAll(this.id);

    for (const task of allTasks) {
      await task.delete();
    }

    this.deletedAt = new Date().toISOString();
    await this.sync();
  }

  toJSON(): TaskGroupData {
    return {
      id: this.id,
      name: this.name,
      creator: this.creator,
      totalTasks: this.totalTasks,
      totalCompletedTasks: this.totalCompletedTasks,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    };
  }
}

export class TaskGroupFactory {
  public static ref = db.collection('task-groups');

  public static async create(data: CreateTaskGroupData) {
    const uid = this.ref.doc();
    const finalData: TaskGroupData = {
      ...data,
      id: uid.id,

      creator: data.creator,
      totalTasks: 0,
      totalCompletedTasks: 0,

      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    };

    const ref = this.ref.doc(uid.id);
    const taskGroup = new TaskGroup(finalData, ref);

    await taskGroup.sync();

    taskGroupCache.set(ref.id, taskGroup);

    return taskGroup;
  }

  public static async get(id: string) {
    if (taskGroupCache.has(id)) {
      return taskGroupCache.get(id);
    }

    const ref = this.ref.doc(id);
    const doc = await ref.get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data() as TaskGroupData;
    const taskGroup = new TaskGroup(data, ref);

    taskGroupCache.set(ref.id, taskGroup);

    return taskGroup;
  }

  public static async getAll(creator: string) {
    const query = await this.ref.where('creator', '==', creator).get();

    return query.docs.map((doc) => {
      const data = doc.data() as TaskGroupData;

      if (taskGroupCache.has(doc.id)) {
        return taskGroupCache.get(doc.id)!;
      }

      const taskGroup = new TaskGroup(data, doc.ref);
      return taskGroup;
    });
  }
}
