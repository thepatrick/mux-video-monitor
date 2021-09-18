import { createSetTitleLabel } from './dynamic/createSetTitleLabel';
import { fetchRooms } from './fetchRooms';
import { fetchState } from './fetchState';
import { mountSetupAudioMeterForMultiview } from './dynamic/mountSetupAudioMeterForMultiview';
import { wait } from './wait';

import Hls from 'hls.js';

const run = async () => {
  if (!Hls.isSupported()) {
    alert('This multiview is only intended for use with hls.js, sorry');
  }

  const video = document.getElementById('azuremediaplayer');
  const vuMeter = document.getElementById('vu-meter');

  mountSetupAudioMeterForMultiview(video, vuMeter, document.body);

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
    video.play();
  });

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

  const showError = (message) => {
    offlineEl.style.display = '';
    offlineEl.querySelector('small').textContent = `${displayName}: ${message}`;
    video.style.display = 'none';
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
      video.style.display = '';
      offlineEl.style.display = 'none';
      if (force || streamURL !== currentStreamURL) {
        hls.loadSource(streamURL + '?cdn=fastly');
      }
    } else {
      showError(`Stream offline`);

      if (currentStreamURL) {
        video.pause();
      }
    }

    currentStreamURL = streamURL;

    refreshingFromState = false;
  };

  hls.on(Hls.Events.ERROR, function (eventName, data) {
    console.warn('Error event:', data);
    switch (data.details) {
      case Hls.ErrorDetails.MANIFEST_LOAD_ERROR:
        showWarning(`MANIFEST_LOAD_ERROR`);
      case Hls.ErrorDetails.MANIFEST_LOAD_TIMEOUT:
        showWarning('Timeout while loading manifest');
        break;
      case Hls.ErrorDetails.MANIFEST_PARSING_ERROR:
        showWarning(`Error while parsing manifest: ${data.reason}`);
        break;
      case Hls.ErrorDetails.LEVEL_EMPTY_ERROR:
        showWarning('Loaded level contains no fragments ' + data.level + ' ' + data.url);
        break;
      case Hls.ErrorDetails.LEVEL_LOAD_ERROR:
        showWarning('Error while loading level playlist ' + data.context.level + ' ' + data.url);
        break;
      case Hls.ErrorDetails.LEVEL_LOAD_TIMEOUT:
        showWarning('Timeout while loading level playlist ' + data.context.level + ' ' + data.url);
        break;
      case Hls.ErrorDetails.LEVEL_SWITCH_ERROR:
        showWarning('Error while trying to switch to level ' + data.level);
        break;
      case Hls.ErrorDetails.FRAG_LOAD_ERROR:
        showWarning('Error while loading fragment ' + data.frag.url);
        break;
      case Hls.ErrorDetails.FRAG_LOAD_TIMEOUT:
        showWarning('Timeout while loading fragment ' + data.frag.url);
        break;
      case Hls.ErrorDetails.FRAG_LOOP_LOADING_ERROR:
        showWarning('Fragment-loop loading error');
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
          logError('An unrecoverable error occurred');
          break;
      }

      refreshFromState(true);
    }
  });

  do {
    await refreshFromState(false);

    const offset = 30000 + (Math.round(Math.random() * 10000) - 5000);

    console.log(`[${displayName}] Next in ${offset}ms`);

    await wait(offset);
  } while (true);
};

run().catch((err) => console.error('Failed somewhere', err));
