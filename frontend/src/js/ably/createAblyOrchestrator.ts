import { Result, isFailure, success, successValue } from '../helpers/result';
import { AblyStreamUpdate, launchAbly } from './launchAbly';

const createAblyFunction = (frame: HTMLIFrameElement) => {
  return (message: AblyStreamUpdate) => {
    frame.contentWindow.postMessage({ AblyNotification: true, message });
  };
};

export const createAblyOrchestrator = async (streamFrames: HTMLIFrameElement[]) => {
  const ably = await launchAbly();
  if (isFailure(ably)) {
    return ably;
  }

  const ablyNotifier = streamFrames.map(createAblyFunction);

  const client = successValue(ably);
  const channel = client.channels.get('mux-monitor.aws.nextdayvideo.com.au');
  await channel.subscribe(({ name, data }) => {
    if (name === 'stream' && data != null && typeof data === 'object') {
      const f = data as unknown as AblyStreamUpdate;

      ablyNotifier.forEach((notify) => notify(f));
    } else {
      console.debug('Ignoring message from ably', name, data);
    }
  });
  return success(undefined);
};

export const createAblySingleStream = async (
  update: (message: AblyStreamUpdate) => void,
): Promise<Result<Error, void>> => {
  const ably = await launchAbly();
  if (isFailure(ably)) {
    return ably;
  }

  const client = successValue(ably);

  const channel = client.channels.get('mux-monitor.aws.nextdayvideo.com.au');

  await channel.subscribe(({ name, data }) => {
    if (name === 'stream' && data != null && typeof data === 'object') {
      const f = data as unknown as AblyStreamUpdate;
      update(f);
    } else {
      console.debug('Ignoring message from ably', name, data);
    }
  });
  return success(undefined);
};
