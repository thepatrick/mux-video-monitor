import { SSM } from '@aws-sdk/client-ssm';
import { failure, Result, success } from './result';

export const maybeGetSecret = async (ssm: SSM, parameterName: string): Promise<Result<Error, string>> => {
  try {
    const muxTokenSecretParameter = await ssm.getParameter({ Name: parameterName, WithDecryption: true });

    const muxTokenSecret = muxTokenSecretParameter.Parameter?.Value;

    if (muxTokenSecret !== undefined) {
      return success(muxTokenSecret);
    }

    return failure(new Error('No secret found'));
  } catch (err) {
    console.log(`Error fetching secret ${parameterName}: ${(err as Error).message}`, err);

    return failure(new Error('No secret found'));
  }
};
