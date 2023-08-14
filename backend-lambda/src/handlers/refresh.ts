import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { catchErrors } from '../helpers/catchErrors';
import { accessDenied, response } from '../helpers/response';
import { isFailure } from '../helpers/result';
import { ssm } from '../helpers/ssm';
import { verifyTokenCookie } from '../helpers/verifyTokenCookie';
import { getRoomsFromDynamo } from './rooms/getRoomsFromDynamo';

export const TableName = process.env.CACHE_TABLE_NAME;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const refresh: APIGatewayProxyHandlerV2 = catchErrors(async (event, context) => {
  if (!TableName) {
    throw new Error('CACHE_TABLE_NAME not set');
  }

  if (!(await verifyTokenCookie(ssm, event))) {
    return accessDenied();
  }

  const maybeRooms = await getRoomsFromDynamo(TableName, true);

  if (isFailure(maybeRooms)) {
    throw maybeRooms.value;
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
