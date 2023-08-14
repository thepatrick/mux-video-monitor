import Hls from 'hls.js';
import { createAblySingleStream } from '../ably/createAblyOrchestrator';
import { createTextThing } from '../createTextThing';
import { createSetTitleLabel } from '../dynamic/createSetTitleLabel';
import { fetchRooms } from '../fetchRooms';
import { MuxStreamState, fetchState } from '../fetchState';
import { AccessDenied } from '../helpers/AccessDenied';
import { isFailure, successValue } from '../helpers/result';
import { nowIs } from '../nowIs';

const createPlayer = async (id: string, defaultName: string) => {
  if (!Hls.isSupported()) {
    window.location.href = '/attend.html?err=hls-not-supported';
    return;
  }
  if (!Hls.isSupported()) {
    alert('This multiview is only intended for use with hls.js, sorry');
  }

  const video = document.getElementById('player') as HTMLVideoElement;
  const videoContainer = document.getElementById('video-row') as HTMLDivElement;

  const warningEl = document.getElementById('warning');
  const offlineEl = document.getElementById('offline');
  const roomNameEl = document.getElementById('room-name');
  const lastUpdateEl = document.getElementById('last-update') as HTMLDivElement;

  const lastUpdate = createTextThing(lastUpdateEl);

  const params = new URL(location.href).searchParams;
  const hlsDebug = params.get('hlsdebug') === 'true';

  const hls = new Hls({
    debug: hlsDebug,
    enableWorker: true,
    fragLoadingMaxRetry: Infinity,
    fragLoadingMaxRetryTimeout: 5000,
    levelLoadingMaxRetry: Infinity,
    levelLoadingMaxRetryTimeout: 5000,
    liveBackBufferLength: 0,
    liveSyncDurationCount: 3,
    liveMaxLatencyDurationCount: 10,
    manifestLoadingMaxRetry: Infinity,
    manifestLoadingMaxRetryTimeout: 5000,
  });
  hls.attachMedia(video);
  hls.on(Hls.Events.MEDIA_ATTACHED, () => {
    video.muted = true;
    void video.play();
  });

  const updateLastUpdate = () => {
    const buffer = video.duration - video.currentTime;
    lastUpdate(
      `${video.paused ? '⏸' : '▶️'} Buffer: ${buffer.toFixed(0)}s. Latency: ${hls.latency.toFixed(
        1,
      )}s. Drift: ${hls.drift.toFixed(2)}. At: ${nowIs()}`,
    );
  };

  video.addEventListener('timeupdate', updateLastUpdate);
  video.addEventListener('durationchange', updateLastUpdate);
  video.addEventListener('pause', updateLastUpdate);
  hls.on(Hls.Events.BUFFER_APPENDING, () => updateLastUpdate());

  const setTitleLabel = createSetTitleLabel(roomNameEl);

  let currentRoomName = defaultName;
  let currentStreamURL;

  const showError = (message: string) => {
    offlineEl.classList.remove('hidden');
    offlineEl.querySelector('p#offline-title').textContent = `${message}`;
    videoContainer.classList.add('hidden');
  };

  let clearShowWarning;
  const showWarning = (message: string) => {
    warningEl.style.display = '';
    warningEl.querySelector('small').textContent = `${message} (${nowIs()})`;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    clearTimeout(clearShowWarning);
    clearShowWarning = setTimeout(() => {
      warningEl.style.display = 'none';
    }, 30000);
  };

  let refreshingFromState = false;

  const refreshFromState = async (force, ablyState?: MuxStreamState) => {
    if (refreshingFromState) {
      // TODO: if ablyState: trigger another update shortly
      return;
    }
    refreshingFromState = true;

    setTitleLabel({ loading: true, room: currentRoomName });

    let state = ablyState;

    if (ablyState === undefined) {
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
    }

    currentRoomName = state.title;

    setTitleLabel({ live: state.online, room: currentRoomName });

    if (state.online === true) {
      video.style.display = '';
      videoContainer.classList.remove('hidden');
      offlineEl.classList.add('hidden');
      if (force || state.stream !== currentStreamURL) {
        hls.loadSource(state.stream + '?cdn=fastly');
      }

      currentStreamURL = state.stream;
    } else {
      showError(`This stream is offline right now.`);

      if (currentStreamURL) {
        video.pause();
      }

      lastUpdate(`⏹ Offline at ${nowIs()}`);

      currentStreamURL = undefined;
    }

    refreshingFromState = false;
  };

  hls.on(Hls.Events.ERROR, (eventName, data) => {
    console.warn('Error event:', data);
    switch (data.details) {
      case Hls.ErrorDetails.BUFFER_INCOMPATIBLE_CODECS_ERROR:
        showWarning('BUFFER_INCOMPATIBLE_CODECS_ERROR');
        hls.recoverMediaError();
        return;
      case Hls.ErrorDetails.MANIFEST_LOAD_ERROR:
        showWarning(`MANIFEST_LOAD_ERROR`);
        break;
      case Hls.ErrorDetails.MANIFEST_LOAD_TIMEOUT:
        showWarning('Timeout while loading manifest');
        break;
      case Hls.ErrorDetails.MANIFEST_PARSING_ERROR:
        showWarning(`Error while parsing manifest: ${data.reason}`);
        break;
      case Hls.ErrorDetails.LEVEL_EMPTY_ERROR:
        showWarning(`Loaded level contains no fragments ${data.level} ${data.url}`);
        break;
      case Hls.ErrorDetails.LEVEL_LOAD_ERROR:
        showWarning(`Error while loading level playlist ${data.context.level} ${data.url}`);
        break;
      case Hls.ErrorDetails.LEVEL_LOAD_TIMEOUT:
        showWarning(`Timeout while loading level playlist ${data.context.level} ${data.url}`);
        break;
      case Hls.ErrorDetails.LEVEL_SWITCH_ERROR:
        showWarning(`Error while trying to switch to level ${data.level}`);
        break;
      case Hls.ErrorDetails.FRAG_LOAD_ERROR:
        showWarning('Error while loading fragment ' + data.frag.url);
        break;
      case Hls.ErrorDetails.FRAG_LOAD_TIMEOUT:
        showWarning('Timeout while loading fragment ' + data.frag.url);
        break;
      case Hls.ErrorDetails.FRAG_DECRYPT_ERROR:
        showWarning('Decrypting error:' + data.reason);
        break;
      case Hls.ErrorDetails.FRAG_PARSING_ERROR:
        showWarning('Parsing error:' + data.reason);
        break;
      case Hls.ErrorDetails.KEY_LOAD_ERROR:
        showWarning('Error while loading key ' + data.frag.decryptdata.uri);
        break;
      case Hls.ErrorDetails.KEY_LOAD_TIMEOUT:
        showWarning('Timeout while loading key ' + data.frag.decryptdata.uri);
        break;
      case Hls.ErrorDetails.BUFFER_APPEND_ERROR:
        showWarning('Buffer append error');
        break;
      case Hls.ErrorDetails.BUFFER_ADD_CODEC_ERROR:
        showWarning('Buffer add codec error for ' + data.mimeType + ':' + data.err.message);
        break;
      case Hls.ErrorDetails.BUFFER_APPENDING_ERROR:
        showWarning('Buffer appending error');
        break;
      case Hls.ErrorDetails.BUFFER_STALLED_ERROR:
        showWarning('Buffer stalled error');
        break;
      default:
        break;
    }

    if (data.fatal) {
      console.error('Fatal error :' + data.details);
      switch (data.type) {
        case Hls.ErrorTypes.MEDIA_ERROR:
          showError('MEDIA_ERROR');
          break;
        case Hls.ErrorTypes.NETWORK_ERROR:
          showError('NETWORK_ERROR');
          break;
        default:
          showError('An unrecoverable error occurred');
          break;
      }

      void refreshFromState(true);
    }
  });

  const ably = await createAblySingleStream(({ roomId, state, streamURL, title }) => {
    if (roomId !== id) {
      // Ignore this message, it's not for this room
      return;
    }
    if (state === 'active') {
      void refreshFromState(false, { ok: true, online: true, stream: streamURL, title });
    } else {
      void refreshFromState(false, { ok: true, online: false, title });
    }
  });

  if (isFailure(ably)) {
    return ably;
  }

  lastUpdate('Starting up...');
  await refreshFromState(false);
};

const run = async () => {
  console.log('hi');

  const params = new URLSearchParams(location.search.slice(1));

  const roomsResponse = await fetchRooms();

  if (isFailure(roomsResponse)) {
    if (roomsResponse.value instanceof AccessDenied) {
      throw roomsResponse.value;
    }
    alert('Could not get rooms. Try again.');
    return;
  }

  const rooms = successValue(roomsResponse);
  if (!params.has('stream')) {
    window.location.href = '/attend.html?err=not-found';
  }

  const roomId = params.get('stream');
  const room = rooms.find(({ id }) => id === roomId);

  if (!room) {
    window.location.href = '/attend.html?err=not-found';
  }

  // TODO: Unmute button!

  const player = await createPlayer(room.id, room.name);
  if (isFailure(player)) {
    throw player.value;
  }
};

run().catch((err) => {
  if (err instanceof AccessDenied) {
    window.location.href = '/access-denied.html';
  }
  console.error('Failed somewhere', err);
});
