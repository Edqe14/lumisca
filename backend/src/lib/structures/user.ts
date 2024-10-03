import { EventEmitter } from 'node:events';
import type TypedEmitter from 'typed-emitter';
import { z } from 'zod';
import { createUserValidator, userValidator } from '../validators/user';
import type { DocumentReference } from 'firebase-admin/firestore';
import { db } from '../firebase';
import { BaseStructure, BaseStructureEvents } from './base';
import { userCache } from '../caches';
import { calculateXP } from '../utils';

export type UserData = z.infer<typeof userValidator>;
export type CreateUserData = z.infer<typeof createUserValidator>;
export type UserEvents = BaseStructureEvents & {};

export class User
  extends (EventEmitter as new () => TypedEmitter<UserEvents>)
  implements BaseStructure, UserData
{
  id: string;
  name: string;
  email: string;
  profilePict: string | null;

  // gamification
  level: number;
  experience: number;
  points: number;
  achivements: Record<string, string>;
  sessionsFinished: number;

  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;

  public constructor(data: UserData, public ref: DocumentReference) {
    super();

    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.profilePict = data.profilePict;

    this.level = data.level;
    this.experience = data.experience;
    this.points = data.points;
    this.achivements = data.achivements;
    this.sessionsFinished = data.sessionsFinished;

    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.deletedAt = data.deletedAt;
  }

  async grantExperience(amount: number) {
    // base + 10% of xp required
    const xpRequired = calculateXP(this.level) - this.experience;
    this.experience += Math.round(amount + xpRequired * 0.1);

    let points = Math.floor(amount / 5);

    while (this.experience >= calculateXP(this.level)) {
      this.experience -= calculateXP(this.level);
      this.level++;

      points += 30;
    }

    this.points += points;

    await this.sync();
  }

  async grantAchievement(name: string | string[]) {
    if (!Array.isArray(name)) {
      name = [name];
    }

    if (name.length === 0) return;

    if (!this.achivements) {
      this.achivements = {};
    }

    name.forEach((n) => {
      if (this.achivements[n]) {
        return;
      }

      this.achivements[n] = new Date().toISOString();
    });

    await this.sync();
  }

  async pull() {
    const doc = await this.ref.get();

    if (!doc.exists) {
      return false;
    }

    const data = doc.data() as UserData;

    Object.assign(this, data);

    this.emit('pull');

    return true;
  }

  async sync() {
    const json = this.toJSON();
    await this.ref.set(json);

    this.emit('sync');

    return true;
  }

  async delete() {
    if (this.deletedAt) return;

    this.deletedAt = new Date().toISOString();

    await this.sync();

    this.emit('delete');
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      profilePict: this.profilePict,

      level: this.level,
      experience: this.experience,
      points: this.points,
      achivements: this.achivements,
      sessionsFinished: this.sessionsFinished,

      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    } satisfies UserData;
  }
}

export class UserFactory {
  public static ref = db.collection('users');

  public static async get(id: string) {
    if (userCache.has(id)) {
      return userCache.get(id)!;
    }

    const doc = await this.ref.doc(id).get();
    if (!doc.exists) {
      return null;
    }

    const data = doc.data() as UserData;
    const user = new User(data, doc.ref);

    userCache.set(id, user);

    return user;
  }

  public static async create(data: CreateUserData) {
    const fullData: UserData = {
      ...data,
      level: 1,
      experience: 0,
      points: 0,
      achivements: {},
      sessionsFinished: 0,

      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    };

    const doc = this.ref.doc(data.id);
    const user = new User(fullData, doc);
    await user.sync();

    user.emit('created');

    userCache.set(doc.id, user);

    return user;
  }
}
