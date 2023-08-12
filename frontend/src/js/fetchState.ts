import { nanoid } from 'nanoid';

interface MuxStreamStateOnline {
  ok: true;
  online: true;
  stream: string;
  title: string;
}

interface MuxStreamStateOffline {
  ok: true;
  online: false;
  title: string;
}

interface MuxStreamStateError {
  ok: false;
  error: string;
}

export type MuxStreamState = MuxStreamStateOnline | MuxStreamStateOffline | MuxStreamStateError;

export const fetchState = async (id: string): Promise<MuxStreamState> => {
  try {
    const before = Date.now();
    const fetchResponse = await fetch(`/api/stream/${encodeURIComponent(id)}?${nanoid()}`, { credentials: 'include' });

    // TODO: Validate state
    const state = (await fetchResponse.json()) as MuxStreamStateOnline | MuxStreamStateOffline | MuxStreamStateError;

    const totalTime = Date.now() - before;

    console.log(`[%s] Got state in %dms`, id, totalTime, state);

    return state;
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
};
