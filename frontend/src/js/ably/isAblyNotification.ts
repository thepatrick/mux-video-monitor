import { AblyNotification } from './AblyNotification';

export const isAblyNotification = (maybe: unknown): maybe is AblyNotification => {
  if (maybe == null) {
    return false;
  }
  if (!(maybe instanceof Object)) {
    return false;
  }

  return Object.getOwnPropertyDescriptor(maybe, 'AblyNotification')?.value === true ?? false;
};
