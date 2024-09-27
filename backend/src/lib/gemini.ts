import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { taskValidator } from './validators/task';
import { z } from 'zod';

export const gemini = new ChatGoogleGenerativeAI({
  model: 'gemini-1.5-flash',
  maxOutputTokens: 1024,
  verbose: true,
});

const validator = z.object({
  tasks: z.array(z.string().describe('The task')).describe('To-do tasks'),
});

export const taskStructuredGemini = gemini.withStructuredOutput(validator, {
  name: 'tasks',
});
