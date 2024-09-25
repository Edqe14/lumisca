import { z } from 'zod';
import type { DocumentReference } from 'firebase-admin/firestore';
import { db } from '../firebase';
import { BaseStructure } from './base';
import { createTaskValidator, taskValidator } from '../validators/task';
import { taskCache } from '../caches';

export type TaskData = z.infer<typeof taskValidator>;
export type CreateTaskData = z.infer<typeof createTaskValidator>;

export class Task implements BaseStructure, TaskData {
  id: string;
  name: string;
  groupId: string;
  creator: string;

  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  completedAt: string | null;

  constructor(data: TaskData, public ref: DocumentReference) {
    this.id = ref.id;
    this.name = data.name;
    this.groupId = data.groupId;
    this.creator = data.creator;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.deletedAt = data.deletedAt;
    this.completedAt = data.completedAt;
  }

  async pull() {
    const doc = await this.ref.get();

    if (!doc.exists) {
      return false;
    }

    const data = doc.data() as TaskData;

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

    this.deletedAt = new Date().toISOString();
    await this.sync();
  }

  toJSON(): TaskData {
    return {
      id: this.id,
      name: this.name,
      groupId: this.groupId,
      creator: this.creator,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
      completedAt: this.completedAt,
    };
  }
}

export class TaskFactory {
  public static ref = db.collection('tasks');

  static async create(data: CreateTaskData) {
    const id = this.ref.doc().id;
    const ref = this.ref.doc(id);

    const finalData: TaskData = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      completedAt: null,
    };

    const task = new Task(finalData, ref);
    await task.sync();

    taskCache.set(task.id, task);

    return task;
  }

  static async get(id: string) {
    if (taskCache.has(id)) {
      return taskCache.get(id)!;
    }

    const doc = await this.ref.doc(id).get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data() as TaskData;
    const task = new Task(data, doc.ref);

    taskCache.set(id, task);

    return task;
  }

  static async getAll(groupId: string) {
    const tasks = await this.ref
      .where('groupId', '==', groupId)
      .where('deletedAt', '==', null)
      .get();

    return tasks.docs.map((doc) => {
      const data = doc.data() as TaskData;
      return new Task(data, doc.ref);
    });
  }
}
