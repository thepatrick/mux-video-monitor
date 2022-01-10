export interface Room {
  id: string;
  title: string;
  order: number;
}

export interface RoomDocument {
  CacheKind: string;
  CacheKey: string;
  LastUpdated: number | undefined;
  Rooms: Partial<Room>[] | undefined;
}
