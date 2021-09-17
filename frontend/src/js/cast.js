import { fetchRooms } from './fetchRooms';

const fetchState = async (displayName, id) => {
  try {
    const before = Date.now();
    const fetchResponse = await fetch(
      `https://fpylzao93a.execute-api.ap-southeast-2.amazonaws.com/api/stream/${encodeURIComponent(id)}`,
    );
    const state = await fetchResponse.json();

    const totalTime = Date.now() - before;

    console.log(`[${displayName}] Got state in ${totalTime}ms`, state);

    return state;
  } catch (err) {
    return { ok: false, error: err.message };
  }
};

const wait = (time) => new Promise((resolve) => setTimeout(resolve, time));

const createSetTitleLabel =
  (el, room) =>
  ({ loading = false, live = false, error }) => {
    let description = '';
    if (loading) {
      description = '...';
    } else if (error) {
      description = `: ${error}`;
    } else if (live) {
      description = ' (live)';
    } else {
      description = ' (offline)';
    }
    el.textContent = `${room}${description}`;
  };

const run = async () => {
  const params = new URL(location.href).searchParams;

  const { ok: roomsOk, error: roomsError, rooms } = await fetchRooms();

  if (!roomsOk) {
    setTitleLabel({ error: roomsError });
    return;
  }

  const id = params.get('id');
  if (!id) {
    throw new Error('ID not set');
  }

  const { name: displayName } = rooms.find(({ id: roomId }) => roomId === id) ?? {};

  if (!displayName) {
    throw new Error('Room not found');
  }

  const warningEl = document.getElementById('warning');
  const offlineEl = document.getElementById('offline');
  const roomNameEl = document.getElementById('room-name');

  const setTitleLabel = createSetTitleLabel(roomNameEl, displayName);

  let currentStreamURL;

  const stopCastPlayback = () => {
    const session = context.getCurrentSession();
    if (!session) {
      // No session, nothing to do.
      return;
    }

    const media = session.getMediaSession();
    if (!media) {
      // No media session, nothing to do.
      return;
    }

    media.stop(
      new chrome.cast.media.StopRequest(),
      () => {},
      (err) => {},
    );
  };

  const showError = (message) => {
    offlineEl.style.display = '';
    offlineEl.querySelector('small').textContent = `${displayName}: ${message}`;
    stopCastPlayback();
  };

  let clearShowWarning;
  const showWarning = (message) => {
    warningEl.style.display = '';
    warningEl.querySelector('small').textContent = `${message} (${new Date().toTimeString()})`;
    clearTimeout(clearShowWarning);
    clearShowWarning = setTimeout(() => {
      warningEl.style.display = 'none';
    }, 30000);
  };

  const context = cast.framework.CastContext.getInstance();
  context.setOptions({
    receiverApplicationId: chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
    autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
  });

  let refreshingFromState = false;

  const refreshFromState = async (force) => {
    if (refreshingFromState) {
      return;
    }
    refreshingFromState = true;

    setTitleLabel({ loading: true });

    const { error, stream: streamURL } = await fetchState(displayName, id);

    if (error) {
      setTitleLabel({ error: error });
      refreshingFromState = false;
      return;
    }

    setTitleLabel({ live: !!streamURL });

    if (streamURL) {
      offlineEl.style.display = 'none';
      if (force || streamURL !== currentStreamURL) {
        const mediaInfo = new chrome.cast.media.MediaInfo(`${streamURL}?cdn=fastly`, 'application/x-mpegURL');
        mediaInfo.streamType = chrome.cast.media.StreamType.LIVE;
        mediaInfo.metadata = new chrome.cast.media.GenericMediaMetadata();
        mediaInfo.metadata.title = displayName;
        const request = new chrome.cast.media.LoadRequest(mediaInfo);

        const session = context.getCurrentSession();
        if (session) {
          session.loadMedia(request).then(
            () => {
              console.log('Load succeeded.');
            },
            (err) => {
              showWarning(`Error Casting media: ${err}`);
            },
          );
        }
      }
    } else {
      showError(`Stream offline`);

      if (currentStreamURL) {
        stopCastPlayback();
      }
    }

    currentStreamURL = streamURL;

    refreshingFromState = false;
  };

  // Connecting to Chromecast forces refresh.
  context.addEventListener(cast.framework.CastContextEventType.CAST_STATE_CHANGED, (e) => {
    console.log(`CAST_STATE_CHANGED: ${e.castState}`);
    switch (e.castState) {
      case cast.framework.CastState.CONNECTED:
        refreshFromState(true);
        break;
    }
  });

  do {
    await refreshFromState(false);

    const offset = 30000 + (Math.round(Math.random() * 10000) - 5000);

    console.log(`[${displayName}] Next in ${offset}ms`);

    await wait(offset);
  } while (true);
};

window['__onGCastApiAvailable'] = (isAvailable) => {
  if (isAvailable) {
    run().catch((err) => console.error('Failed somewhere', err));
  }
};
