import { createMeter, createMeterNode } from '../../web-audio-peak-meter';

interface SetupAudioMeter {
  SetupAudioMeter: true;
}

const isSetupAudioMeter = (maybe: unknown): maybe is SetupAudioMeter => {
  if (maybe == null) {
    return false;
  }
  if (!(maybe instanceof Object)) {
    return false;
  }

  return Object.getOwnPropertyDescriptor(maybe, 'SetupAudioMeter')?.value === true;
};

interface SetAudioVolume {
  SetAudioVolume: true;
  volume: number;
}

const isSetAudioVolume = (maybe: unknown): maybe is SetAudioVolume => {
  if (maybe == null) {
    return false;
  }
  if (!(maybe instanceof Object)) {
    return false;
  }

  return Object.getOwnPropertyDescriptor(maybe, 'SetAudioVolume')?.value === true;
};

export const mountSetupAudioMeterForMultiview = (
  videoTag: HTMLVideoElement,
  myMeterElement: HTMLDivElement,
  body: HTMLBodyElement,
): void => {
  window.addEventListener('message', (ev: MessageEvent<unknown>) => {
    const data = ev.data;
    if (!isSetupAudioMeter(data)) {
      console.log('[AudioSetupMeter] Ignoring this', JSON.stringify(data));
      return;
    }
    console.log('[AudioSetupMeter] Setup for muiltiview...');

    body.classList.add('show-vu-meter');

    videoTag.muted = false;

    const audioCtx = new window.AudioContext();
    const sourceNode = audioCtx.createMediaElementSource(videoTag);

    const gainNode = audioCtx.createGain();

    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);

    sourceNode.connect(gainNode);

    gainNode.connect(audioCtx.destination);

    const meterNode = createMeterNode(sourceNode, audioCtx);

    createMeter(myMeterElement, meterNode, { peakHoldDuration: 1000, audioMeterStandard: 'peak-sample' });

    void audioCtx.resume();

    window.addEventListener('message', (ev: MessageEvent<unknown>) => {
      const data = ev.data;
      if (!isSetAudioVolume(data)) {
        console.log('[SetAudioVolume] Ignoring this', JSON.stringify(data));
        return;
      }
      console.log('Updating volume! %d', data.volume);

      gainNode.gain.setValueAtTime(data.volume, audioCtx.currentTime);

      if (data.volume === 0) {
        body.classList.remove('unmuted');
        videoTag.classList.remove('unmuted');
      } else {
        body.classList.add('unmuted');
        videoTag.classList.add('unmuted');
      }
    });
  });
};
