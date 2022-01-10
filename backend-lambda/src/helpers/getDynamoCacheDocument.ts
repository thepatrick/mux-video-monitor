import { AWSError, DynamoDB } from 'aws-sdk';
import { failure, Result, success } from './result';

export const getDynamoCacheDocument = async <T>(
  dynamo: DynamoDB,
  tableName: string,
  kind: string,
  key: string,
): Promise<Result<Error, T | undefined>> => {
  try {
    const { Item } = await dynamo
      .getItem({
        TableName: tableName,
        Key: DynamoDB.Converter.marshall({
          CacheKind: kind,
          CacheKey: key,
        }),
      })
      .promise();

    if (Item == null) {
      return success(undefined);
    }

    return success(DynamoDB.Converter.unmarshall(Item) as unknown as T);
  } catch (error) {
    return failure(error as AWSError);
  }
};
