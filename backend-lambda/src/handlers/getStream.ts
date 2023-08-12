import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { notFound, response } from '../helpers/response';
import { isFailure, successValue } from '../helpers/result';
import { catchErrors } from '../helpers/catchErrors';
import { getStreamStateFromDynamo } from './mux/getStreamStateFromDynamo';
import { TableName } from './listRooms';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getStream: APIGatewayProxyHandlerV2 = catchErrors(async (event, context) => {
  if (!TableName) {
    throw new Error('CACHE_TABLE_NAME not set');
  }

  const muxTokenId = event.pathParameters?.muxTokenId;
  if (muxTokenId === undefined || muxTokenId.length === 0) {
    return notFound();
  }

  const maybeState = await getStreamStateFromDynamo(TableName, muxTokenId, false);

  if (isFailure(maybeState)) {
    return notFound();
  }

  const state = successValue(maybeState);

  return response(
    {
      ok: true,
      online: state.state === 'active',
      stream: state.state === 'active' && state.streamURL,
      title: state.title,
    },
    200,
    {
      'Cache-Control': 'no-cache',
    },
  );
});

if (process.env.TEST_HANDLER === 'getStream') {
  if (!TableName) {
    throw new Error('CACHE_TABLE_NAME not set');
  }

  console.log('Ok, lets do this');
  getStreamStateFromDynamo(TableName, process.env.ROOM_ID || '', false).then(
    (results) => console.log('[DONE]', results),
    (err) => console.log('[ERROR]', err),
  );
}
