import { nanoid } from 'nanoid';

interface Room {
  id: string;
  name: string;
}

interface FetchRoomsOk {
  ok: true;
  rooms: Room[];
}

interface FetchRoomsError {
  ok: false;
  error: string;
}

export const fetchRooms = async (): Promise<FetchRoomsOk | FetchRoomsError> => {
  try {
    const before = Date.now();
    const fetchResponse = await fetch(`/api/rooms.json?${nanoid()}`);
    const rooms = (await fetchResponse.json()) as Room[];

    const totalTime = Date.now() - before;

    console.log(`[Rooms] Got rooms in ${totalTime}ms`, rooms);

    return { ok: true, rooms };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
};

export const viewerURI = (id: string): string => `dynamic.html?id=${encodeURIComponent(id)}&v=${nanoid()}`;
export const castURI = (id: string): string => `cast.html?id=${encodeURIComponent(id)}&v=${nanoid()}`;
