import { isFailure, Result, success, successValue } from '../../helpers/result';
import { Rest, Types as AblyTypes } from 'ably';
import { maybeGetSecret } from '../../helpers/maybeGetSecret';
import { SSM } from 'aws-sdk';

const ABLY_SERVER_KEY = process.env.ABLY_SERVER_KEY;

export const getAblyClient = async (): Promise<Result<Error, AblyTypes.RestPromise | undefined>> => {
  if (!ABLY_SERVER_KEY) {
    return success(undefined);
  }
  const ssm = new SSM();
  const maybeKey = await maybeGetSecret(ssm, ABLY_SERVER_KEY);
  if (isFailure(maybeKey)) {
    return maybeKey;
  }

  const key = successValue(maybeKey);

  return success(new Rest.Promise({ key }));
};
