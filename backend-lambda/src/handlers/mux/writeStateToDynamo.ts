import { AWSError, DynamoDB } from 'aws-sdk';
import { failure, Result, success } from '../../helpers/result';
import { StreamStateDocument, StreamStateWithTitle } from './StreamState';


export const writeStateToDynamo = async (
  dynamo: DynamoDB,
  tableName: string,
  roomId: string,
  state: StreamStateWithTitle
): Promise<Result<AWSError, StreamStateWithTitle>> => {
  const item: StreamStateDocument = {
    CacheKind: 'stream',
    CacheKey: roomId,
    LastUpdated: Date.now(),
    State: state,
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

  return success(state);
};
