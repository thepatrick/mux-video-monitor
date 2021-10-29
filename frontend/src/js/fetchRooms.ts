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

interface FetchRoomsResponseRoom {
  id: string;
  tags: Record<string, string>;
}

interface FetchRoomsResponseOk {
  ok: true;
  rooms: FetchRoomsResponseRoom[];
}

interface FetchRoomsResponseError {
  ok: false;
  error: string;
}

export const fetchRooms = async (): Promise<FetchRoomsOk | FetchRoomsError> => {
  try {
    const before = Date.now();
    const fetchResponse = await fetch(`/api/stream?${nanoid()}`);
    const rooms = (await fetchResponse.json()) as FetchRoomsResponseOk | FetchRoomsResponseError;

    if (rooms.ok === false) {
      throw new Error(rooms.error);
    }

    const r = rooms.rooms.map((room) => ({
      id: room.id,
      name: room.tags['multiview:title'] || room.id,
    }));

    const totalTime = Date.now() - before;

    console.log(`[Rooms] Got rooms in ${totalTime}ms`, rooms);

    return { ok: true, rooms: r };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
};

export const viewerURI = (id: string): string => `dynamic.html?id=${encodeURIComponent(id)}&v=${nanoid()}`;
export const castURI = (id: string): string => `cast.html?id=${encodeURIComponent(id)}&v=${nanoid()}`;
