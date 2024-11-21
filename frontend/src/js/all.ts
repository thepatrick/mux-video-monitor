import { createAblyOrchestrator } from './ably/createAblyOrchestrator';
import { createNextPrevious } from './createNextPrevious';
import { createPauseAudioHopper } from './createPauseAudioHopper';
import { createStartAudioHopper } from './createStartAudioHopper';
import { createStreamIframe } from './createStreamIframe';
import { fetchRooms, iframeURI } from './fetchRooms';
import { AccessDenied } from './helpers/AccessDenied';
import { isFailure, successValue } from './helpers/result';
import { roomLayouts } from './roomLayouts';
import { wait } from './wait';

type volumeFn = (volume: number) => void;

const createMuteExcept = (muteFunctions: volumeFn[]): ((focussed: number) => void) => {
  const count = muteFunctions.length;

  return (focussed) => {
    for (let index = 0; index < count; ++index) {
      muteFunctions[index](index === focussed ? 1 : 0);
    }
  };
};

const createMuteFunction = (frame: HTMLIFrameElement): volumeFn => {
  frame.contentWindow.postMessage({ SetupAudioMeter: true });

  return (volume: number) => {
    frame.contentWindow.postMessage({ SetAudioVolume: true, volume });
    // setGain(volume);
  };
};

const createAudioController = (streamFrames: HTMLIFrameElement[], speed: number) => async () => {
  const muteFunctions = streamFrames.map(createMuteFunction);

  const muteExcept = createMuteExcept(muteFunctions);

  console.log('[all] beging rotating audio...');

  let paused = true;
  let nextChange = Date.now();
  const count = muteFunctions.length;
  let current = 0;

  const move = (by: number): void => {
    if (current + by < 0) {
      current = count - 1;
    } else if (current + by >= count) {
      current = 0;
    } else {
      current = current + by;
    }

    muteExcept(current);
  };

  createNextPrevious(document.body, 'prev-audio-hopper', 'Previous', 'navigate_before', () => {
    move(-1);
  });

  createNextPrevious(document.body, 'next-audio-hopper', 'Next', 'navigate_next', () => {
    move(1);
  });

  createPauseAudioHopper(document.body, paused, (updateButton) => {
    paused = !paused;

    nextChange = Date.now();

    updateButton(paused);
  });

  muteExcept(current);

  do {
    if (Date.now() < nextChange) {
      // Do nothing
    } else if (!paused) {
      move(1);

      nextChange = Date.now() + speed;
    }

    await wait(1000 / 60);

    // eslint-disable-next-line no-constant-condition
  } while (true);
};

const run = async () => {
  console.log('hi');

  const params = new URLSearchParams(location.search.slice(1));

  const streamIframe = createStreamIframe(document.body);

  const roomsResponse = await fetchRooms();

  if (isFailure(roomsResponse)) {
    if (roomsResponse.value instanceof AccessDenied) {
      window.location.href = '/access-denied.html';
      return;
    }
    alert('Could not get rooms. Try again.');
    return;
  }

  let rooms = successValue(roomsResponse);
  if (params.has('only')) {
    const onlyId = params.get('only');
    rooms = rooms.filter(({ id }) => id === onlyId);
  }

  let roomIndex = 0;
  const layouts = roomLayouts[rooms.length];

  const streamFrames: HTMLIFrameElement[] = [];
  for (const { id } of rooms) {
    streamFrames.push(streamIframe(id, iframeURI(id), layouts[roomIndex++]));
  }

  let rotateSpeed = 30;

  if (params.has('audio-hopper')) {
    rotateSpeed = parseInt(params.get('audio-hopper'), 10);

    if (isNaN(rotateSpeed)) {
      throw new Error('audio-hopper is not a number, this is... not supported');
    }
  }

  // const ably = await createAblyOrchestrator(streamFrames);
  // if (isFailure(ably)) {
  //   throw ably.value;
  // }

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  createStartAudioHopper(document.body, createAudioController(streamFrames, rotateSpeed * 1000));
};

run().catch((err) => console.error('Failed somewhere', err));
