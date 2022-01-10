import { SSM } from 'aws-sdk';
import { failure, Result, success } from '../../helpers/result';

export const maybeGetMuxTokenSecret = async (ssm: SSM, muxTokenId: string): Promise<Result<Error, string>> => {
  try {
    const muxTokenSecretParameter = await ssm
      .getParameter({ Name: `/multiview/mux/${muxTokenId}`, WithDecryption: true })
      .promise();

    const muxTokenSecret = muxTokenSecretParameter.Parameter?.Value;

    if (muxTokenSecret !== undefined) {
      return success(muxTokenSecret);
    }

    return failure(new Error('No secret found'));
  } catch (err) {
    console.log(`Error fetching secret ${muxTokenId}: ${(err as Error).message}`, err);

    return failure(new Error('No secret found'));
  }
};
