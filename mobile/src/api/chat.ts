import request from './client';
import { Philosopher, Sphere } from '../types';

export interface ChatCompletionMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface SendMessageResponse {
  reply: string;
}

// Matches backend's postChat contract exactly: { messages, systemPrompt }.
export async function sendMessage(
  messages: ChatCompletionMessage[],
  philosopher: Philosopher,
  additionalContext = ''
): Promise<string> {
  const systemPrompt = additionalContext
    ? `${philosopher.systemPrompt}\n\n${additionalContext}`
    : philosopher.systemPrompt;

  const { reply } = await request<SendMessageResponse>('/chat', { messages, systemPrompt });
  return reply;
}

export interface MeasureExchangeResponse {
  advance: boolean;
  goBack: boolean;
  reply: string;
}

// Classify-and-branch turn used during the measure interview: tells the caller
// whether the person actually engaged with the question (advance the sphere),
// asked to revisit a previous sphere (goBack), or asked/pushed back/deflected
// (stay on it, but still respond to what they said). `canGoBack` tells the
// backend whether there's actually a previous sphere to go back to, so it
// never honors a goBack request on the very first question.
export function sendMeasureExchange(
  philosopher: Philosopher,
  sphere: Sphere,
  question: string,
  answer: string,
  canGoBack: boolean
): Promise<MeasureExchangeResponse> {
  return request<MeasureExchangeResponse>('/measure/exchange', {
    systemPrompt: philosopher.systemPrompt,
    sphere,
    question,
    answer,
    canGoBack,
  });
}
