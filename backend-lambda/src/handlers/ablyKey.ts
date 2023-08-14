import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { catchErrors } from '../helpers/catchErrors';
import { maybeGetSecret } from '../helpers/maybeGetSecret';
import { accessDenied, notFound, response } from '../helpers/response';
import { isFailure, successValue } from '../helpers/result';
import { ssm } from '../helpers/ssm';
import { verifyTokenCookie } from '../helpers/verifyTokenCookie';
import { getCachedSecret } from '../helpers/getCachedSecret';
import { TableName } from '../helpers/TableName';
import { ABLY_CLIENT_KEY } from '../helpers/ABLY_CLIENT_KEY';

// export const getRoomsFromDynamo = async (tableName: string, forceRefresh: boolean): Promise<Result<Error, Room[]>> => {
//   const refresh = makeRefresh(getRoomsFromSSM, dynamo, tableName);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const ablyKey: APIGatewayProxyHandlerV2 = catchErrors(async (event, context) => {
  if (!ABLY_CLIENT_KEY) {
    console.log('ABLY_CLIENT_KEY not set');
    return notFound();
  }
  if (!TableName) {
    throw new Error('CACHE_TABLE_NAME not set');
  }

  if (!(await verifyTokenCookie(event))) {
    return accessDenied();
  }

  const maybeKey = await getCachedSecret(ABLY_CLIENT_KEY);

  if (isFailure(maybeKey)) {
    console.log(`Unable to get ${ABLY_CLIENT_KEY}`, maybeKey.value);
    return notFound();
  }

  const key = successValue(maybeKey);

  return response({ ok: true, key }, 200, {
    'Cache-Control': 'no-cache',
  });
});
