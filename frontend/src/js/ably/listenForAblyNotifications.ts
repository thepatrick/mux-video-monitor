import { isAblyNotification } from './isAblyNotification';

export const listenForAblyNotifications = (
  id: string,
  onActive: (title: string, streamURL: string) => Promise<void> | void,
  onNotActive: (title: string) => Promise<void> | void,
): void => {
  window.addEventListener('message', (ev: MessageEvent<unknown>) => {
    const data = ev.data;
    if (!isAblyNotification(data)) {
      console.log('[AblyNotifier] Ignoring this', data);
      return;
    }
    console.log('[AblyNotifier] Got data', data);
    if (data.message.roomId !== id) {
      console.debug('[ably] Ignoring update for another stream', data.message.roomId);
      return;
    }

    const { state, streamURL, title, why } = data.message;

    console.log(`[ably] Updating ${id} because ${why}`);

    if (state === 'active') {
      console.log(`[ably] Marking ${id} as active`);
      void onActive(title, streamURL);
    } else {
      console.log(`[ably] Marking ${id} as not active`);
      void onNotActive(title);
    }
  });
};
