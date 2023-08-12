import { AblyStreamUpdate, launchAbly } from './launchAbly';

const createAblyFunction = (frame: HTMLIFrameElement) => {
  return (message: AblyStreamUpdate) => {
    frame.contentWindow.postMessage({ AblyNotification: true, message });
  };
};

export const createAblyOrchestrator = async (streamFrames: HTMLIFrameElement[]) => {
  const ably = await launchAbly();

  if (ably.ok === false) {
    console.error('Unable to get an ably key, will rely on refreshing');
  } else {
    const ablyNotifier = streamFrames.map(createAblyFunction);

    const channel = ably.client.channels.get('mux-monitor.aws.nextdayvideo.com.au');
    await channel.subscribe(({ name, data }) => {
      if (name === 'stream' && data != null && typeof data === 'object') {
        const f = data as unknown as AblyStreamUpdate;

        ablyNotifier.forEach((notify) => notify(f));
      } else {
        console.debug('Ignoring message from ably', name, data);
      }
    });
  }
};

export const createAblySingleStream = async (update: (message: AblyStreamUpdate) => void) => {
  const ably = await launchAbly();
  if (ably.ok === false) {
    window.location.href = '/attend.html?err=ably';
  } else {
    const channel = ably.client.channels.get('mux-monitor.aws.nextdayvideo.com.au');

    await channel.subscribe(({ name, data }) => {
      if (name === 'stream' && data != null && typeof data === 'object') {
        const f = data as unknown as AblyStreamUpdate;
        update(f);
      } else {
        console.debug('Ignoring message from ably', name, data);
      }
    });
  }
};
