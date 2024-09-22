export type Profile = {
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
};

// store
export type Session = {
  id: string;
  name: string;
  status: 'active' | 'break' | 'long-break' | 'finished';
  visibility: 'public' | 'private';
  creator: string;

  createdAt: string;
  updatedAt: string;
};

// RTDB
export type SessionRT = {
  id: string;
  status: 'active' | 'break' | 'long-break' | 'finished';
  timer: number; // seconds

  members: SessionMemberRT[];
};

export type SessionMemberRT = {
  id: string;
  name: string;
  profilePict: string;
  isSpeaking: boolean;
};
