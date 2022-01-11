import { createSetTitleLabel } from './dynamic/createSetTitleLabel';
import { fetchState, MuxStreamState } from './fetchState';
import { mountSetupAudioMeterForMultiview } from './dynamic/mountSetupAudioMeterForMultiview';
import Hls from 'hls.js';
import { listenForAblyNotifications } from './ably/listenForAblyNotifications';

const createTextThing = (el: HTMLDivElement) => (msg: string) => {
  el.textContent = msg;
};

const nowIs = () => {
  const now = new Date();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');

  return `${now.getHours()}:${minutes}:${seconds}`;
};

const run = async () => {
  if (!Hls.isSupported()) {
    alert('This multiview is only intended for use with hls.js, sorry');
  }

  const video = document.getElementById('azuremediaplayer') as HTMLVideoElement;
  const vuMeter = document.getElementById('vu-meter') as HTMLDivElement;

  const warningEl = document.getElementById('warning');
  const offlineEl = document.getElementById('offline');
  const roomNameEl = document.getElementById('room-name');
  const lastUpdateEl = document.getElementById('last-update') as HTMLDivElement;

  const lastUpdate = createTextThing(lastUpdateEl);

  const updateLastUpdate = () => {
    const buffer = video.duration - video.currentTime;
    lastUpdate(`${video.paused ? '⏸' : '▶️'} Buffer: ${buffer.toFixed(0)}s. At: ${nowIs()}`);
  };

  video.addEventListener('timeupdate', updateLastUpdate);
  video.addEventListener('durationchange', updateLastUpdate);
  video.addEventListener('pause', updateLastUpdate);

  mountSetupAudioMeterForMultiview(video, vuMeter, document.body as HTMLBodyElement);

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
    liveSyncDurationCount: 9,
    liveMaxLatencyDurationCount: 10,
    manifestLoadingMaxRetry: Infinity,
    manifestLoadingMaxRetryTimeout: 5000,
  });
  hls.attachMedia(video);
  hls.on(Hls.Events.MEDIA_ATTACHED, () => {
    video.muted = true;
    void video.play();
  });

  const id = params.get('id');
  if (!id) {
    throw new Error('ID not set');
  }

  const setTitleLabel = createSetTitleLabel(roomNameEl);

  let currentRoomName = id;
  let currentStreamURL;

  const showError = (message: string) => {
    offlineEl.style.display = '';
    offlineEl.querySelector('small').textContent = `${currentRoomName}: ${message}`;
    video.style.display = 'none';
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

  let refreshingFromState = false;

  const refreshFromState = async (force, ablyState?: MuxStreamState) => {
    if (refreshingFromState) {
      // TODO: if ablyState: trigger another update shortly
      return;
    }
    refreshingFromState = true;

    setTitleLabel({ loading: true, room: currentRoomName });

    const state = ablyState || (await fetchState(id));

    if (state.ok === false) {
      setTitleLabel({ error: state.error, room: currentRoomName });
      refreshingFromState = false;
      return;
    }

    currentRoomName = state.title;

    setTitleLabel({ live: state.online, room: currentRoomName });

    if (state.online === true) {
      video.style.display = '';
      offlineEl.style.display = 'none';
      if (force || state.stream !== currentStreamURL) {
        hls.loadSource(state.stream + '?cdn=fastly');
      }

      currentStreamURL = state.stream;
    } else {
      showError(`Stream offline`);

      if (currentStreamURL) {
        video.pause();
      }

      currentStreamURL = undefined;
    }

    refreshingFromState = false;
  };

  hls.on(Hls.Events.ERROR, function (eventName, data) {
    console.warn('Error event:', data);
    switch (data.details) {
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

  listenForAblyNotifications(
    id,
    (title, streamURL) => refreshFromState(false, { ok: true, online: true, stream: streamURL, title }),
    (title) => refreshFromState(false, { ok: true, online: false, title }),
  );

  await refreshFromState(false);
};

run().catch((err) => console.error('Failed somewhere', err));
