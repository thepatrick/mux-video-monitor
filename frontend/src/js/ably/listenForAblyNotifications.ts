import { isAblyNotification } from './isAblyNotification';

export const listenForAblyNotifications = (
  id: string,
  onActive: (title: string, streamURL: string) => Promise<void> | void,
  onNotActive: (title: string) => Promise<void> | void,
): void => {
  window.addEventListener('message', (ev: MessageEvent<unknown>) => {
    if (event.origin !== location.origin) {
      // Ignore messages from other origins.
      return;
    }

    const data = ev.data;
    if (!isAblyNotification(data)) {
      console.log('[AblyNotifier] Ignoring this', JSON.stringify(data));
      return;
    }
    console.log('[AblyNotifier] Got data', JSON.stringify(data));
    if (data.message.roomId !== id) {
      console.debug('[ably] Ignoring update for another stream', JSON.stringify(data.message.roomId));
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
