import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { invalidRequest, notFound, response } from '../helpers/response';
import { catchErrors } from '../helpers/catchErrors';
import { TableName } from './listRooms';
import { isMuxWebhookBody } from '../types.guard';
import { parseBody } from '../helpers/parseBody';
import { isFailure, successValue } from '../helpers/result';
import { DynamoDB, SSM } from 'aws-sdk';
import { makeGetStreamStateFromSSMAndMux } from './mux/makeGetStreamStateFromSSMAndMux';
import { makeRefreshStreamState } from './mux/refreshStreamState';
import { getStreamStateFromDynamo } from './mux/getStreamStateFromDynamo';



// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const muxWebhook: APIGatewayProxyHandlerV2 = catchErrors(async (event, context) => {
  if (!TableName) {
    throw new Error('CACHE_TABLE_NAME not set');
  }

  const muxTokenId = event.pathParameters?.muxTokenId;
  if (muxTokenId === undefined || muxTokenId.length === 0) {
    return notFound();
  }

  const maybeBody = parseBody(event.body, isMuxWebhookBody);
  if (isFailure(maybeBody)) {
    console.log('Failed to parse webhook from mux:', maybeBody.value);
    return invalidRequest();
  }

  const body = successValue(maybeBody);

  if (!body.type.includes('video.live_stream')) {
    console.log(`Ignoring webhook about ${body.type}`);
    return response({ ok: true });
  }

  console.log(`Attempting to refresh cache for ${muxTokenId}`);

  // MAYBE: This may need to move into a seperate lambda that is async

  const maybeRefreshed = await getStreamStateFromDynamo(TableName, muxTokenId, true);

  if (isFailure(maybeRefreshed)) {
    return invalidRequest();
  }

  return response({ ok: true });
});
