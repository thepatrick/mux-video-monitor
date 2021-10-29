interface MuxStreamStateOnline {
  ok: true;
  online: true;
  stream: string;
}

interface MuxStreamStateOffline {
  ok: true;
  online: false;
}

interface MuxStreamStateError {
  ok: false;
  error: string;
}

export const fetchState = async (
  displayName: string,
  id: string,
): Promise<MuxStreamStateOnline | MuxStreamStateOffline | MuxStreamStateError> => {
  try {
    const before = Date.now();
    const fetchResponse = await fetch(`/api/stream/${encodeURIComponent(id)}`);

    // TODO: Validate state
    const state = (await fetchResponse.json()) as MuxStreamStateOnline | MuxStreamStateOffline | MuxStreamStateError;

    const totalTime = Date.now() - before;

    console.log(`[${displayName}] Got state in ${totalTime}ms`, state);

    return state;
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
};
