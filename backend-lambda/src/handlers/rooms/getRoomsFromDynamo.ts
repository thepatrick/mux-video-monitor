import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { isFailure, Result, success, successValue } from '../../helpers/result';
import { getRoomsFromSSM } from './getRoomsFromSSM';
import { makeRefresh } from './writeRoomsToDynamo';
import { Room, RoomDocument } from './Room';
import { getDynamoCacheDocument } from '../../helpers/getDynamoCacheDocument';
import { credentialProvider } from '../../helpers/credentialProvider';

export const ageLimit = 30 * 60 * 1000;

export const getRoomsFromDynamo = async (tableName: string, forceRefresh: boolean): Promise<Result<Error, Room[]>> => {
  const dynamo = new DynamoDB({ credentials: credentialProvider });

  const refresh = makeRefresh(getRoomsFromSSM, dynamo, tableName);

  if (forceRefresh) {
    console.log('Forcing refresh, refreshing...');
    return refresh();
  }

  const maybeCachedRooms = await getDynamoCacheDocument<RoomDocument>(dynamo, tableName, 'rooms', 'all');

  if (isFailure(maybeCachedRooms)) {
    console.log('Unexpected AWS response, fallback...');
    return getRoomsFromSSM();
  }

  const cachedRoomsDocument = successValue(maybeCachedRooms);
  if (cachedRoomsDocument === undefined) {
    console.log('No cache found for rooms/all, refreshing...');
    return refresh();
  }

  const { LastUpdated, Rooms } = cachedRoomsDocument;

  const now = Date.now();

  if (LastUpdated === undefined || LastUpdated < 0 || LastUpdated > now || Rooms === undefined) {
    console.log('Weird data, refreshing...');
    return refresh();
  }

  const age = now - LastUpdated;
  if (age > ageLimit) {
    console.log('Expired, refreshing...');
    return refresh();
  }

  const cachedRooms = Rooms.map((room, index) => ({
    id: room.id ?? `id-${index}`,
    title: room.title ?? `title-${index}`,
    order: room.order ?? index,
  }));

  return success(cachedRooms);
};
