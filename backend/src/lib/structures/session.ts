import { z } from 'zod';
import {
  sessionFactoryValidator,
  sessionMember,
  sessionRTValidator,
  sessionValidator,
} from '../validators/session';
import { db, rtdb } from '../firebase';
import { EventEmitter } from 'node:events';
import TypedEmitter from 'typed-emitter';
import { Filter, type DocumentReference } from 'firebase-admin/firestore';
import type { Reference } from 'firebase-admin/database';
import { Channel } from './channel';

type SessionData = z.infer<typeof sessionValidator>;
type SessionRTData = z.infer<typeof sessionRTValidator>;

export const sessionCache = new Map<string, Session>();
export type SessionEvents = {
  pull: () => void;
  sync: () => void;
  delete: () => void;
  created: () => void;
  memberAdded: (memberId: string) => void;
  memberRemoved: (memberId: string) => void;
};

export const timerCache = new Map<string, NodeJS.Timer>();

/* TODO:
- grace period when no member (join/leave), then will get automatically marked as finished
*/

export class Session extends (EventEmitter as new () => TypedEmitter<SessionEvents>) {
  id: string;
  name: string;
  status: SessionData['status'];
  visibility: SessionData['visibility'];
  creator: string;
  focusedCount: number;
  members: SessionData['members'];
  memberCount: number;

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
    this.visibility = data.visibility;
    this.creator = data.creator;
    this.members = data.members;
    this.focusedCount = data.focusedCount;
    this.memberCount = data.memberCount;

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
    });
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

      await this.channel.createRoom();

      this.primeSelfDestruct();
    });

    const memberStates = this.rtdbRef.child('memberStates');
    memberStates.on('child_changed', async (snapshot) => {
      const memberId = snapshot.key!;
      const memberState =
        snapshot.val() as SessionRTData['memberStates'][string];

      if (!memberState.isConnected) {
        timerCache.set(
          memberId,
          setTimeout(() => {
            this.removeMember(memberId);
          }, 1000 * 60 * 5)
        );
      } else {
        if (timerCache.has(memberId)) {
          clearTimeout(timerCache.get(memberId)!);
          timerCache.delete(memberId);
        }
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

  public async pull() {
    const doc = await this.ref.get();
    const rtdbDoc = await this.rtdbRef.get();

    if (!doc.exists || !rtdbDoc.exists()) {
      return null;
    }

    const data = doc.data() as SessionData;
    const rtdbData = rtdbDoc.val() as SessionRTData;

    Object.assign(this, data);

    this.realtime = rtdbData;

    this.emit('pull');

    return this;
  }

  public async sync() {
    const json = this.toJSON();
    const res = await Promise.all([
      this.ref.set(json),
      this.rtdbRef.set(this.realtime),
    ]);

    this.emit('sync');

    return res;
  }

  public async delete() {
    if (this.deletedAt) return;

    this.deletedAt = new Date().toISOString();

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
      visibility: this.visibility,
      creator: this.creator,
      focusedCount: this.focusedCount,
      members: this.members,
      memberCount: this.memberCount,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      finishedAt: this.finishedAt,
      deletedAt: this.deletedAt,
    };
  }
}

export class SessionFactory {
  public static collection = db.collection('sessions');
  public static ref = rtdb.ref('sessions');

  public static async getAll(userId: string) {
    const snapshot = await this.collection
      .where(
        Filter.or(
          Filter.where('creator', '==', userId),
          Filter.where(`members.${userId}.id`, '==', userId)
        )
      )
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
      visibility,
      creator,
      focusedCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      finishedAt: null,
      memberCount: 0,
      members: {},
    };

    const rtData: SessionRTData = {
      creator,
      id: uniqueId,
      status: 'active',
      memberStates: {},
      nextSectionEndAt: null,
      deletedAt: null,
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
