import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { catchErrors } from '../helpers/catchErrors';
import { accessDenied, response } from '../helpers/response';
import { isFailure } from '../helpers/result';
import { verifyTokenCookie } from '../helpers/verifyTokenCookie';
import { getRoomsFromDynamo } from './rooms/getRoomsFromDynamo';
import { TableName } from '../helpers/TableName';
import { getCachedSecret } from '../helpers/getCachedSecret';
import { ABLY_CLIENT_KEY } from '../helpers/ABLY_CLIENT_KEY';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const refresh: APIGatewayProxyHandlerV2 = catchErrors(async (event, context) => {
  if (!TableName) {
    throw new Error('CACHE_TABLE_NAME not set');
  }

  if (isFailure(await verifyTokenCookie(event, true))) {
    return accessDenied();
  }

  const maybeRooms = await getRoomsFromDynamo(TableName, true);

  if (isFailure(maybeRooms)) {
    throw maybeRooms.value;
  }

  if (!ABLY_CLIENT_KEY) {
    throw new Error('Cannot refresh ably with no `ABLY_CLIENT_KEY`');
  }

  const maybeAbly = await getCachedSecret(ABLY_CLIENT_KEY);
  if (isFailure(maybeRooms)) {
    throw maybeAbly.value;
  }

  return response(
    {
      ok: true,
      rooms: maybeRooms.value,
    },
    200,
    {
      'Cache-Control': 'no-cache',
    },
  );
});

if (process.env.TEST_HANDLER === 'refreshDynamoCache') {
  if (!TableName) {
    throw new Error('CACHE_TABLE_NAME not set');
  }

  console.log('Ok, lets do this');
  void getRoomsFromDynamo(TableName, true).then(
    (results) => console.log('[DONE]', results),
    (err) => console.log('[ERROR]', err),
  );
}
