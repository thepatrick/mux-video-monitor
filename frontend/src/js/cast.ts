import { createSetTitleLabel } from './dynamic/createSetTitleLabel';
import { MuxStreamState, fetchState } from './fetchState';
import { AccessDenied } from './helpers/AccessDenied';
import { isFailure, successValue } from './helpers/result';

const wait = (time) => new Promise((resolve) => setTimeout(resolve, time));

const run = async () => {
  const warningEl = document.getElementById('warning');
  const offlineEl = document.getElementById('offline');
  const roomNameEl = document.getElementById('room-name');

  const params = new URL(location.href).searchParams;

  const id = params.get('id');
  if (!id) {
    throw new Error('ID not set');
  }

  const setTitleLabel = createSetTitleLabel(roomNameEl);
  let currentRoomName = id;
  let currentStreamURL;

  const context = cast.framework.CastContext.getInstance();

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
      () => console.log('Stopped cast playback'),
      (err) => console.log('Unable to stop cast playback: ' + err.description),
    );
  };

  const showError = (message: string) => {
    offlineEl.style.display = '';
    offlineEl.querySelector('small').textContent = `${currentRoomName}: ${message}`;
    stopCastPlayback();
  };

  let clearShowWarning;
  const showWarning = (message: string) => {
    warningEl.style.display = '';
    warningEl.querySelector('small').textContent = `${message} (${new Date().toTimeString()})`;
    clearTimeout(clearShowWarning);
    clearShowWarning = setTimeout(() => {
      warningEl.style.display = 'none';
    }, 30000);
  };

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

    setTitleLabel({ loading: true, room: currentRoomName });

    let state: MuxStreamState;

    const maybeState = await fetchState(id);
    if (isFailure(maybeState)) {
      if (maybeState.value instanceof AccessDenied) {
        window.location.href = `/access-denied.html`;
        return;
      }

      setTitleLabel({ error: maybeState.value.message, room: currentRoomName });
      refreshingFromState = false;
      return;
    } else {
      state = successValue(maybeState);
    }

    currentRoomName = state.title;

    setTitleLabel({ live: state.online, room: currentRoomName });

    if (state.online === true) {
      offlineEl.style.display = 'none';
      if (force || state.stream !== currentStreamURL) {
        const mediaInfo = new chrome.cast.media.MediaInfo(`${state.stream}?cdn=fastly`, 'application/x-mpegURL');
        mediaInfo.streamType = chrome.cast.media.StreamType.LIVE;

        const metadata = new chrome.cast.media.GenericMediaMetadata();
        metadata.title = currentRoomName;
        mediaInfo.metadata = metadata;

        const request = new chrome.cast.media.LoadRequest(mediaInfo);

        const session = context.getCurrentSession();
        if (session) {
          try {
            const loadErrrorCode = await session.loadMedia(request);
            if (loadErrrorCode != null) {
              throw new Error(`Unable to start casting: ${loadErrrorCode}`);
            }
            console.log('Load succeeded.');
          } catch (err) {
            showWarning(`Error Casting media: ${(err as unknown as Error).toString()}`);
          }
        }
      }

      currentStreamURL = state.stream;
    } else {
      showError(`Stream offline`);

      if (currentStreamURL) {
        stopCastPlayback();
      }

      currentStreamURL = undefined;
    }

    refreshingFromState = false;
  };

  // Connecting to Chromecast forces refresh.
  context.addEventListener(cast.framework.CastContextEventType.CAST_STATE_CHANGED, (e) => {
    console.log(`CAST_STATE_CHANGED: ${e.castState}`);
    switch (e.castState) {
      case cast.framework.CastState.CONNECTED:
        void refreshFromState(true);
        break;
    }
  });

  do {
    await refreshFromState(false);

    const offset = 30000 + (Math.round(Math.random() * 10000) - 5000);

    console.log(`[${currentRoomName}] Next in ${offset}ms`);

    await wait(offset);
    // eslint-disable-next-line no-constant-condition
  } while (true);
};

window['__onGCastApiAvailable'] = (isAvailable) => {
  if (isAvailable) {
    run().catch((err) => console.error('Failed somewhere', err));
  }
};
