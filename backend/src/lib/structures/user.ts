export interface User {
  id: string;
  name: string;
  email: string;
  profilePict?: string | null;

  // gamification
  level: number;
  experience: number;
  points: number;
  achivements: string[];
  sessionsFinished: number;

  createdAt: string;
  updatedAt: string;
}
