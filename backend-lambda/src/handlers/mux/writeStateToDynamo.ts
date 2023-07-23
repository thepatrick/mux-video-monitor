import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { failure, Result, success } from '../../helpers/result';
import { StreamStateDocument, StreamStateWithTitle } from './StreamState';

export const writeStateToDynamo = async (
  dynamo: DynamoDB,
  tableName: string,
  roomId: string,
  state: StreamStateWithTitle,
): Promise<Result<Error, StreamStateWithTitle>> => {
  const item: StreamStateDocument = {
    CacheKind: 'stream',
    CacheKey: roomId,
    LastUpdated: Date.now(),
    State: state,
  };

  try {
    await dynamo.putItem({
      TableName: tableName,
      Item: marshall(item),
    });
  } catch (error) {
    return failure(error as Error);
  }

  return success(state);
};
