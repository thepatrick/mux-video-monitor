import * as Ably from 'ably';

interface AblyKeyOk {
  ok: true;
  key: string;
}

interface AblyKeyError {
  ok: false;
  error: string;
}

const fetchAblyKey = async (): Promise<AblyKeyOk | AblyKeyError> => {
  try {
    const before = Date.now();
    const fetchResponse = await fetch(`/api/ably`);

    // TODO: Validate state
    const state = (await fetchResponse.json()) as AblyKeyOk | AblyKeyError;

    const totalTime = Date.now() - before;

    console.log(`[ably] Got key in ${totalTime}ms`, state);

    return state;
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
};

interface AblyClientOk {
  ok: true;
  client: Ably.Types.RealtimePromise;
}

export const launchAbly = async (): Promise<AblyKeyError | AblyClientOk> => {
  const maybeKey = await fetchAblyKey();
  if (maybeKey.ok === false) {
    return maybeKey;
  }

  const key = maybeKey.key;

  const client = new Ably.Realtime.Promise({ key });

  return { ok: true, client };
};

export type AblyStreamUpdate = {
  roomId?: string | undefined;
  why?: string | undefined;
  state?: 'active' | 'not-active' | undefined;
  streamURL?: string | undefined;
  title?: string | undefined;
};

// {
//   "roomId": "8e594d08-22d1-4a3b-b88a-69d66311d570",
//   "why": "video.live_stream.active",
//   "state": "active",
//   "streamURL": "https://stream.mux.com/z1GIx3QUUntdL008IP3flXDIoIzFG00V01ZCyXfzmaVX01o.m3u8",
//   "title": "1 - Kaya Theatre"
// }
