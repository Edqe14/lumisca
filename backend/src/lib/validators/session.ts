import { z } from 'zod';

export const createSessionValidator = z.object({
  name: z.string(),
  visibility: z.enum(['public', 'private']),
});

export const sessionMember = z.object({
  id: z.string(),
  name: z.string(),
  profilePict: z.string().nullable(),
});

export const sessionMemberRTState = z.object({
  id: z.string(),
  isSpeaking: z.boolean(),
  isMuted: z.boolean(),
  isDeafened: z.boolean(),
  isConnected: z.boolean(),
  isScreenSharing: z.boolean(),
  isHandRaised: z.boolean(),
});

export const updateSessionStateValidator = sessionMemberRTState.omit({
  id: true,
});

export const sessionValidator = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(['active', 'break', 'long-break', 'finished']),
  timerState: z.enum(['running', 'paused', 'stopped']),
  visibility: z.enum(['public', 'private']),
  creator: z.string(),
  joinCode: z.string().nullable(),

  activeCount: z.number(),
  breakCount: z.number(),
  longBreakCount: z.number(),

  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
  finishedAt: z.string().nullable(),

  memberCount: z.number(),
  members: z.record(z.string(), sessionMember),
});

export const sessionRTValidator = sessionValidator
  .pick({
    id: true,
    status: true,
    timerState: true,

    activeCount: true,
    breakCount: true,
    longBreakCount: true,
    createdAt: true,
    deletedAt: true,
  })
  .extend({
    timeLeft: z.number().describe('In seconds'),
    memberStates: z.record(z.string(), sessionMemberRTState),
  });

export const sessionFactoryValidator = sessionValidator.pick({
  name: true,
  visibility: true,
  creator: true,
});

export type SessionData = z.infer<typeof sessionValidator>;
export type SessionRTData = z.infer<typeof sessionRTValidator>;
export type SessionMemberStateData = z.infer<
  typeof updateSessionStateValidator
>;
