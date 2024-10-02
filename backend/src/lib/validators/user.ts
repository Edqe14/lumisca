import { z } from 'zod';

export const userValidator = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  profilePict: z.string().nullable(),

  // gamification
  level: z.number(),
  experience: z.number(),
  points: z.number(),
  achivements: z.record(z.string(), z.string()),
  sessionsFinished: z.number(),

  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
});

export const createUserValidator = userValidator.pick({
  id: true,
  name: true,
  email: true,
  profilePict: true,
});

export type Profile = z.infer<typeof userValidator>;
