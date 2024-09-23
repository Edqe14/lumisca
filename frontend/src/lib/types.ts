export interface Profile {
  id: string;
  name: string;
  email: string;
  profilePict?: string | null;
  level: number;
  experience: number;
  points: number;
  achivements: string[];
  sessionsFinished: number;

  createdAt: string;
  updatedAt: string;
}

// store
export interface Session {
  id: string;
  name: string;
  status: 'active' | 'break' | 'long-break' | 'finished';
  visibility: 'public' | 'private';
  creator: string;
  focusedCount: number;

  createdAt: string;
  updatedAt: string;
  finishedAt: string | null;
}

// RTDB
export interface SessionRT {
  id: string;
  status: 'active' | 'break' | 'long-break' | 'finished';
  timer: number; // seconds

  members: SessionMemberRT[];
}

export interface SessionMemberRT {
  id: string;
  name: string;
  profilePict: string;

  isSpeaking: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  isConnected: boolean;
}
