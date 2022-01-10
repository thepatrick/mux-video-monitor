import { StreamState } from './StreamState';

export const demos: Partial<Record<string, StreamState>> = {
  offline: { state: 'not-active' },
  'fake-stream': { state: 'active', streamURL: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
};
