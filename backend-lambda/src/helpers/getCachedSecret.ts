import { maybeGetSecret } from './maybeGetSecret';
import { Result, failure, isFailure, success, successValue } from './result';
import { ssm } from './ssm';
import { dynamo } from './dynamo';
import { marshall } from '@aws-sdk/util-dynamodb';
import { getDynamoCacheDocument } from './getDynamoCacheDocument';
import { TableName } from './TableName';

const ageLimit = 30 * 60 * 1000;

type SSMCacheDocument = {
  CacheKind: 'ssm';
  CacheKey: string;
  LastUpdated: number;
  Value: string;
};

export const getCachedSecret = async (keyPath: string, forceRefresh = false): Promise<Result<Error, string>> => {
  if (!TableName) {
    return failure(new Error('CACHE_TABLE_NAME not set'));
  }

  const refresh = async (): Promise<Result<Error, string>> => {
    const maybeKey = await maybeGetSecret(ssm, keyPath);
    if (isFailure(maybeKey)) {
      console.log(`Unable to get ${keyPath}`, maybeKey.value);
      return failure(new Error(`Unable to get ${keyPath}`));
    }

    const value = successValue(maybeKey);
    const item: SSMCacheDocument = {
      CacheKey: keyPath,
      CacheKind: 'ssm',
      LastUpdated: Date.now(),
      Value: value,
    };

    try {
      await dynamo.putItem({
        TableName,
        Item: marshall(item),
      });
    } catch (error) {
      return failure(error as Error);
    }

    return success(value);
  };

  if (forceRefresh) {
    console.log('Forcing refresh');
    return refresh();
  }

  const maybeCachedSecret = await getDynamoCacheDocument<SSMCacheDocument>(dynamo, TableName, 'ssm', keyPath);

  if (isFailure(maybeCachedSecret)) {
    console.log('Unexpected AWS response, fallback...');
    return refresh();
  }

  const cachedSecret = successValue(maybeCachedSecret);

  if (cachedSecret === undefined) {
    console.log('No cached secret, fallback...');
    return refresh();
  }

  const { LastUpdated, Value } = cachedSecret;
  const now = Date.now();

  if (LastUpdated === undefined || LastUpdated < 0 || LastUpdated > now || Value === undefined) {
    console.log('Weird data, refreshing...');
    return refresh();
  }

  const age = now - LastUpdated;
  if (age > ageLimit) {
    console.log('Expired, refreshing...');
    return refresh();
  }

  return success(Value);
};
