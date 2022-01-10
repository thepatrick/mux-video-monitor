import { AWSError, DynamoDB } from 'aws-sdk';
import { failure, isFailure, Result, success, successValue } from '../../helpers/result';
import { Room, RoomDocument } from './Room';

const writeRoomsToDynamo = async (
  dynamo: DynamoDB,
  tableName: string,
  roomList: Room[],
): Promise<Result<Error, Room[]>> => {
  const item: RoomDocument = {
    CacheKind: 'rooms',
    CacheKey: 'all',
    LastUpdated: Date.now(),
    Rooms: roomList,
  };

  try {
    await dynamo
      .putItem({
        TableName: tableName,
        Item: DynamoDB.Converter.marshall(item),
      })
      .promise();
  } catch (error) {
    return failure(error as AWSError);
  }

  return success(roomList);
};

export const makeRefresh =
  (getRooms: () => Promise<Result<Error, Room[]>>, dynamo: DynamoDB, tableName: string) =>
  async (): Promise<Result<Error, Room[]>> => {
    const maybeRooms = await getRooms();
    if (isFailure(maybeRooms)) {
      return maybeRooms;
    }

    const maybeWrite = await writeRoomsToDynamo(dynamo, tableName, successValue(maybeRooms));
    if (isFailure(maybeWrite)) {
      console.log('Failed to write rooms to dynamodb...', maybeWrite.value);
    }

    return maybeRooms;
  };
