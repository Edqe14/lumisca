import { z } from 'zod';
import {
  SessionData,
  sessionFactoryValidator,
  sessionMember,
  SessionMemberStateData,
  SessionRTData,
} from '../validators/session';
import { db, rtdb } from '../firebase';
import { EventEmitter } from 'node:events';
import type TypedEmitter from 'typed-emitter';
import { Filter, type DocumentReference } from 'firebase-admin/firestore';
import type { Reference } from 'firebase-admin/database';
import { Channel } from './channel';
import { Timers } from './timer';
import { BaseStructure, BaseStructureEvents } from './base';
import { sessionCache } from '../caches';

export type SessionEvents = BaseStructureEvents & {
  memberAdded: (memberId: string) => void;
  memberRemoved: (memberId: string) => void;
  updateMemberState: (id: string, state: SessionMemberStateData) => void;
};

export class Session
  extends (EventEmitter as new () => TypedEmitter<SessionEvents>)
  implements BaseStructure, SessionData
{
  public static STATUS_ACTIVE = 'active' as const;
  public static STATUS_BREAK = 'break' as const;
  public static STATUS_LONG_BREAK = 'long_break' as const;
  public static STATUS_FINISHED = 'finished' as const;

  id: string;
  name: string;
  status: SessionData['status'];
  timerState: SessionData['timerState'];
  visibility: SessionData['visibility'];
  creator: string;
  members: SessionData['members'];
  memberCount: number;

  activeCount: number;
  breakCount: number;
  longBreakCount: number;

  createdAt: string;
  updatedAt: string;
  finishedAt: string | null;
  deletedAt: string | null;

  // realtime data
  realtime: SessionRTData | null;
  channel: Channel;
  autoDestructTimeout: NodeJS.Timer | null = null;

  public constructor(
    data: SessionData,
    realtimeData: SessionRTData | null,
    public ref: DocumentReference,
    public rtdbRef: Reference
  ) {
    super();

    this.id = data.id;
    this.name = data.name;
    this.status = data.status;
    this.timerState = data.timerState;
    this.visibility = data.visibility;
    this.creator = data.creator;
    this.members = data.members;
    this.memberCount = data.memberCount;

    this.activeCount = data.activeCount;
    this.breakCount = data.breakCount;
    this.longBreakCount = data.longBreakCount;

    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.finishedAt = data.finishedAt;
    this.deletedAt = data.deletedAt;

    this.realtime = realtimeData;
    this.channel = new Channel(this.id);

    this.hookEvents();
  }

  private primeSelfDestruct() {
    this.autoDestructTimeout = setTimeout(async () => {
      this.delete();
    }, Timers.ONE_MINUTE * 5);
  }

  private defuseSelfDestruct() {
    if (this.autoDestructTimeout) {
      clearTimeout(this.autoDestructTimeout);
      this.autoDestructTimeout = null;
    }
  }

  protected hookEvents() {
    this.on('created', async () => {
      if (this.deletedAt) return;

      // this.primeSelfDestruct();
    });

    const memberStates = this.rtdbRef.child('memberStates');
    memberStates.on('child_changed', async (snapshot) => {
      const memberId = snapshot.key!;
      const memberState =
        snapshot.val() as SessionRTData['memberStates'][string];

      if (!memberState.isConnected) {
        Timers.queue(
          memberId,
          () => this.removeMember(memberId),
          1000 * 60 * 5
        );
      } else {
        Timers.dequeue(memberId);
      }
    });

    this.on('memberAdded', async () => {
      this.defuseSelfDestruct();
    });

    this.on('memberRemoved', async () => {
      if (this.memberCount === 0) {
        this.primeSelfDestruct();
      }
    });

    // cleanup
    this.once('delete', async () => {
      await this.channel.deactivate();
      this.removeAllListeners();

      memberStates.off('child_changed');

      if (this.autoDestructTimeout) {
        clearTimeout(this.autoDestructTimeout);
      }
    });
  }

  public async addMember(
    memberId: string,
    memberData: z.infer<typeof sessionMember>
  ) {
    if (this.deletedAt) return;

    if (!this.members[memberId]) {
      this.members[memberId] = memberData;
      this.memberCount++;
    }

    // reset member state anyway
    if (this.realtime) {
      this.realtime.memberStates[memberId] = {
        id: memberId,
        isSpeaking: false,
        // NOTE: by default muted
        isMuted: true,
        isDeafened: false,
        isConnected: false,
        isScreenSharing: false,
        isHandRaised: false,
      };
    }

    await this.sync();

    this.emit('memberAdded', memberId);

    return this.members[memberId];
  }

  public async removeMember(memberId: string) {
    if (this.deletedAt) return;

    if (this.members[memberId]) {
      delete this.members[memberId];
      this.memberCount--;
    }

    if (this.realtime) {
      delete this.realtime.memberStates[memberId];
    }

    await this.sync();

    this.emit('memberRemoved', memberId);
  }

  public async updateMemberState(id: string, state: SessionMemberStateData) {
    if (!this.realtime) return false;
    if (!this.realtime.memberStates[id]) return false;

    Object.assign(this.realtime.memberStates[id], state);

    await this.sync();
    this.emit('updateMemberState', id, state);

    return this.realtime.memberStates[id];
  }

  public async pull() {
    const doc = await this.ref.get();
    const rtdbDoc = await this.rtdbRef.get();

    if (!doc.exists || !rtdbDoc.exists()) {
      return false;
    }

    const data = doc.data() as SessionData;
    const rtdbData = rtdbDoc.val() as SessionRTData;

    Object.assign(this, data);

    this.realtime = rtdbData;

    this.emit('pull');

    return true;
  }

  public async sync() {
    const json = this.toJSON();
    const tasks: Promise<unknown>[] = [this.ref.set(json)];

    if (this.realtime) {
      Object.assign(this.realtime, {
        activeCount: this.activeCount,
        breakCount: this.breakCount,
        longBreakCount: this.longBreakCount,
        status: this.status,
        timerState: this.timerState,
      } satisfies Partial<SessionRTData>);

      tasks.push(this.rtdbRef.set(this.realtime));
    }

    await Promise.all(tasks);

    this.emit('sync');

    return true;
  }

  public async delete() {
    if (this.deletedAt) return;

    this.deletedAt = new Date().toISOString();
    this.status = Session.STATUS_FINISHED;

    if (this.realtime) {
      this.realtime.deletedAt = this.deletedAt;
    }

    await this.sync();

    this.emit('delete');
  }

  public toJSON() {
    return {
      id: this.id,
      name: this.name,
      status: this.status,
      timerState: this.timerState,
      visibility: this.visibility,
      creator: this.creator,
      activeCount: this.activeCount,
      breakCount: this.breakCount,
      longBreakCount: this.longBreakCount,
      members: this.members,
      memberCount: this.memberCount,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      finishedAt: this.finishedAt,
      deletedAt: this.deletedAt,
    } satisfies SessionData;
  }
}

export class SessionFactory {
  public static collection = db.collection('sessions');
  public static ref = rtdb.ref('sessions');

  public static async getAll(userId: string, onlyDeleted = false) {
    const snapshot = await this.collection
      .where(
        Filter.or(
          Filter.where('creator', '==', userId),
          Filter.where(`members.${userId}.id`, '==', userId)
        )
      )
      .where('deletedAt', onlyDeleted ? '!=' : '==', null)
      .orderBy('createdAt', 'desc')
      .get();

    const sessions = snapshot.docs.map((doc) => {
      const data = doc.data() as SessionData;

      if (sessionCache.has(data.id)) {
        return sessionCache.get(data.id)!;
      }

      return new Session(data, null, doc.ref, this.ref.child(data.id));
    });

    return sessions;
  }

  public static async getAllPublic() {
    const snapshot = await this.collection
      .where('visibility', '==', 'public')
      .where('deletedAt', '==', null)
      .orderBy('createdAt', 'desc')
      .get();

    const sessions = snapshot.docs.map((doc) => {
      const data = doc.data() as SessionData;

      if (sessionCache.has(data.id)) {
        return sessionCache.get(data.id)!;
      }

      return new Session(data, null, doc.ref, this.ref.child(data.id));
    });

    return sessions;
  }

  public static async get(id: string) {
    if (sessionCache.has(id)) {
      return sessionCache.get(id);
    }

    const doc = await this.collection.doc(id).get();
    const rtdbDoc = await this.ref.child(id).get();

    if (!doc.exists || !rtdbDoc.exists()) {
      return null;
    }

    const data = doc.data() as SessionData;
    const rtdbData = rtdbDoc.val() as SessionRTData;

    if (data.deletedAt) {
      return null;
    }

    if (sessionCache.has(data.id)) {
      return sessionCache.get(data.id);
    }

    const session = new Session(data, rtdbData, doc.ref, rtdbDoc.ref);

    sessionCache.set(data.id, session);

    return session;
  }

  public static async create({
    name,
    visibility,
    creator,
  }: z.infer<typeof sessionFactoryValidator>) {
    const uniqueId = this.collection.doc().id;

    const sessionData: SessionData = {
      id: uniqueId,
      name,
      status: 'active',
      timerState: 'stopped',
      visibility,
      creator,

      activeCount: 0,
      breakCount: 0,
      longBreakCount: 0,

      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      finishedAt: null,
      memberCount: 0,
      members: {},
    };

    const rtData: SessionRTData = {
      creator,
      id: sessionData.id,
      status: sessionData.status,
      timerState: sessionData.timerState,
      createdAt: sessionData.createdAt,
      deletedAt: sessionData.deletedAt,

      activeCount: sessionData.activeCount,
      breakCount: sessionData.breakCount,
      longBreakCount: sessionData.longBreakCount,

      memberStates: {},
      nextSectionEndAt: null,
    };

    const session = new Session(
      sessionData,
      rtData,
      this.collection.doc(uniqueId),
      this.ref.child(uniqueId)
    );
    await session.sync();

    session.emit('created');

    sessionCache.set(uniqueId, session);

    return session;
  }
}
