import request from './client';
import { Philosopher, Sphere } from '../types';

export interface ChatCompletionMessage {
  role: 'user' | 'assistant';
  content: string;
  // Set on an assistant message when the backend noticed the person's last
  // message read as needing to vent rather than converse — see Guide's
  // screen for the "write it out instead" chip this drives.
  suggestSpill?: boolean;
}

interface SendMessageResponse {
  reply: string;
  suggestSpill?: boolean;
}

// Matches backend's postChat contract exactly: { messages, systemPrompt }.
export async function sendMessage(
  messages: ChatCompletionMessage[],
  philosopher: Philosopher,
  additionalContext = ''
): Promise<{ reply: string; suggestSpill: boolean }> {
  const systemPrompt = additionalContext
    ? `${philosopher.systemPrompt}\n\n${additionalContext}`
    : philosopher.systemPrompt;

  // suggestSpill is client-side-only bookkeeping (drives the "write it out
  // instead" chip) — it must never ride along in the history sent back to
  // Groq. Groq's message schema rejects unknown properties on a message
  // object outright, so as soon as a conversation had one assistant reply
  // in it, every following turn failed with a 400 ('property suggestSpill
  // is unsupported') — the whole conversation broke after exactly one
  // reply, silently, until the backend logs were checked.
  const wireMessages = messages.map(({ role, content }) => ({ role, content }));

  const { reply, suggestSpill } = await request<SendMessageResponse>('/chat', {
    messages: wireMessages,
    systemPrompt,
  });
  return { reply, suggestSpill: suggestSpill === true };
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
