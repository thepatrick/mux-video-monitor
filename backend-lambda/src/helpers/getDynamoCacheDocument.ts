import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { failure, Result, success } from './result';

export const getDynamoCacheDocument = async <T>(
  dynamo: DynamoDB,
  tableName: string,
  kind: string,
  key: string,
): Promise<Result<Error, T | undefined>> => {
  try {
    const getItemKey = marshall({
      CacheKind: kind,
      CacheKey: key,
    });

    const { Item } = await dynamo.getItem({
      TableName: tableName,
      Key: getItemKey,
    });

    if (Item == null) {
      return success(undefined);
    }

    return success(unmarshall(Item) as unknown as T);
  } catch (error) {
    return failure(error as Error);
  }
};
