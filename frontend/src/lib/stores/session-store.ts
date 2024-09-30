import { proxy } from 'valtio';
import { EventEmitter } from 'eventemitter3';
import { fetcher } from '../utils';
import { SessionData, SessionRTData } from '../validators/session';
import {
  onValue,
  ref,
  Unsubscribe,
  type DatabaseReference,
} from 'firebase/database';
import { rtdb } from '../firebase';

type SessionType = {};

export let rtRef: DatabaseReference | null = null;
export const sessionStore = proxy({
  id: null as string | null,
  session: null as Session | null,

  timeLeft: 0,
  status: 'active' as SessionData['status'],
  timerState: 'stopped' as SessionData['timerState'],
  memberStates: {} as SessionRTData['memberStates'],
  members: {} as SessionData['members'],
});

export class Session extends EventEmitter<SessionType> implements SessionData {
  id: string;
  name: string;
  status: SessionData['status'];
  timerState: SessionData['timerState'];
  visibility: SessionData['visibility'];
  creator: string;
  members: SessionData['members'];
  memberCount: number;
  joinCode: string | null;

  activeCount: number;
  breakCount: number;
  longBreakCount: number;

  createdAt: string;
  updatedAt: string;
  finishedAt: string | null;
  deletedAt: string | null;

  // realtime data
  private rtUnsub: Unsubscribe | null = null;

  realtime: SessionRTData | null = null;

  constructor(data: SessionData) {
    super();

    this.id = data.id;
    this.name = data.name;
    this.status = data.status;
    this.timerState = data.timerState;
    this.visibility = data.visibility;
    this.creator = data.creator;
    this.members = data.members;
    this.memberCount = data.memberCount;
    this.joinCode = data.joinCode;

    this.activeCount = data.activeCount;
    this.breakCount = data.breakCount;
    this.longBreakCount = data.longBreakCount;

    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.finishedAt = data.finishedAt;
    this.deletedAt = data.deletedAt;
  }

  async listen() {
    if (rtRef) {
      this.rtUnsub = onValue(rtRef, (snapshot) => {
        const data = snapshot.val() as SessionRTData;
        this.realtime = data;

        sessionStore.timerState = data.timerState;
        sessionStore.status = data.status;
        sessionStore.timeLeft = data.timeLeft;
        sessionStore.memberStates = data.memberStates;
      });
    }
  }

  async stop() {
    if (rtRef) {
      this.rtUnsub?.();
    }
  }

  async startTimer() {
    await fetcher(`/session/${this.id}/start`, {
      method: 'PUT',
    });
  }

  async pauseTimer() {
    await fetcher(`/session/${this.id}/pause`, {
      method: 'PUT',
    });
  }

  async join() {
    const res = await fetcher(`/session/${this.id}/join`, {
      method: 'POST',
    });

    return res.data.token;
  }

  async leave() {
    await fetcher(`/session/${this.id}/leave`, {
      method: 'POST',
    });
  }
}

export const fetchSession = async (
  id: string,
  abortController: AbortController
) => {
  const res = await fetcher<SessionData>(`/session/${id}`, {
    signal: abortController.signal,
  });

  if (res.status !== 200) {
    return null;
  }

  const data = res.data;
  const session = new Session(data);
  rtRef = ref(rtdb, `sessions/${data.id}`);

  return session;
};
