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

  async createTask(data: Pick<CreateTaskData, 'name' | 'creator'>) {
    const task = await TaskFactory.create({
      ...data,
      groupId: this.id,
    });

    this.totalTasks += 1;

    await this.sync();

    return task;
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
    await this.ref.set(json, { merge: true });

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

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      creator: this.creator,
      totalTasks: this.totalTasks,
      totalCompletedTasks: this.totalCompletedTasks,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    } as TaskGroupData;
  }
}

export class TaskGroupFactory {
  public static ref = db.collection('task-groups');

  public static async create(
    data: CreateTaskGroupData & Partial<TaskGroupData>
  ) {
    const uid = this.ref.doc();
    const finalData: TaskGroupData = {
      id: uid.id,

      totalTasks: 0,
      totalCompletedTasks: 0,

      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      ...data,
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
    return new Promise<TaskGroup[]>(async (resolve, reject) => {
      this.ref
        .where('creator', '==', creator)
        .where('deletedAt', '==', null)
        .onSnapshot((snap) => {
          resolve(
            snap.docs.map((doc) => {
              const data = doc.data() as TaskGroupData;

              if (taskGroupCache.has(doc.id)) {
                return taskGroupCache.get(doc.id)!;
              }

              const taskGroup = new TaskGroup(data, doc.ref);
              return taskGroup;
            })
          );
        });
    });
  }
}
