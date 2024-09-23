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

export const sessionValidator = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(['active', 'paused', 'break', 'long-break', 'finished']),
  visibility: z.enum(['public', 'private']),
  creator: z.string(),
  focusedCount: z.number(),

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
    creator: true,
    deletedAt: true,
  })
  .extend({
    nextSectionEndAt: z.number().nullable(),
    memberStates: z.record(z.string(), sessionMemberRTState),
  });

export const sessionFactoryValidator = sessionValidator.pick({
  name: true,
  visibility: true,
  creator: true,
});
