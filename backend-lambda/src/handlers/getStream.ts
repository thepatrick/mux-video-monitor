import { SSM } from '@aws-sdk/client-ssm';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { catchErrors } from '../helpers/catchErrors';
import { credentialProvider } from '../helpers/credentialProvider';
import { accessDenied, notFound, response } from '../helpers/response';
import { isFailure, successValue } from '../helpers/result';
import { verifyTokenCookie } from '../helpers/verifyTokenCookie';
import { TableName } from './listRooms';
import { getStreamStateFromDynamo } from './mux/getStreamStateFromDynamo';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getStream: APIGatewayProxyHandlerV2 = catchErrors(async (event, context) => {
  if (!TableName) {
    throw new Error('CACHE_TABLE_NAME not set');
  }
  const ssm = new SSM({ credentials: credentialProvider });

  if (!(await verifyTokenCookie(ssm, event))) {
    return accessDenied();
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
