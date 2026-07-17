import request from './client';
import { MeasureResult, QAPair } from '../types';

// Backend doesn't return `savedAt` — the caller stamps it on before persisting.
export function submitInterview(qaPairs: QAPair[]) {
  return request<Omit<MeasureResult, 'savedAt'>>('/measure/interview', { qaPairs });
}
