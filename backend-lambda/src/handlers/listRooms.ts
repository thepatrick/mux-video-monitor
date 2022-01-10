import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { response } from '../helpers/response';

import { isFailure } from '../helpers/result';
import { catchErrors } from '../helpers/catchErrors';
import { getRoomsFromDynamo } from './rooms/getRoomsFromDynamo';

export const TableName = process.env.CACHE_TABLE_NAME;

export const listRooms: APIGatewayProxyHandlerV2 = catchErrors(async (event, context) => {
  if (!TableName) {
    throw new Error('CACHE_TABLE_NAME not set');
  }

  const refresh = event.queryStringParameters?.refresh === 'true';

  const maybeRooms = await getRoomsFromDynamo(TableName, refresh);

  if (isFailure(maybeRooms)) {
    throw maybeRooms.value;
  }

  return response({
    ok: true,
    rooms: maybeRooms.value,
  });
});

if (process.env.TEST_HANDLER === 'getRoomsFromDynamo') {
  if (!TableName) {
    throw new Error('CACHE_TABLE_NAME not set');
  }

  console.log('Ok, lets do this');
  void getRoomsFromDynamo(TableName, false).then(
    (results) => console.log('[DONE]', results),
    (err) => console.log('[ERROR]', err),
  );
}

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
