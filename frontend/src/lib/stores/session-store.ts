import { proxy } from 'valtio';
import { EventEmitter } from 'eventemitter3';
import { fetcher } from '../utils';
import { SessionData, SessionRTData } from '../validators/session';

type SessionType = {};

export class Session extends EventEmitter<SessionType> implements SessionData {
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

    this.activeCount = data.activeCount;
    this.breakCount = data.breakCount;
    this.longBreakCount = data.longBreakCount;

    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.finishedAt = data.finishedAt;
    this.deletedAt = data.deletedAt;
  }
}

export const sessionStore = proxy({
  id: null as string | null,
  session: null as Session | null,
});

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

  return session;
};
