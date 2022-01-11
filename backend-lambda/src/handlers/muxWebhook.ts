import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { invalidRequest, notFound, response } from '../helpers/response';
import { catchErrors } from '../helpers/catchErrors';
import { TableName } from './listRooms';
import { isMuxWebhookBody } from '../types.guard';
import { parseBody } from '../helpers/parseBody';
import { isFailure, Result, success, successValue } from '../helpers/result';
import { getStreamStateFromDynamo } from './mux/getStreamStateFromDynamo';
import { Rest, Types as AblyTypes } from 'ably';
import { maybeGetSecret } from '../helpers/maybeGetSecret';
import { SSM } from 'aws-sdk';

const ABLY_SERVER_KEY = process.env.ABLY_SERVER_KEY;

const getAblyClient = async (): Promise<Result<Error, AblyTypes.RestPromise | undefined>> => {
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const muxWebhook: APIGatewayProxyHandlerV2 = catchErrors(async (event, context) => {
  if (!TableName) {
    throw new Error('CACHE_TABLE_NAME not set');
  }

  const roomId = event.pathParameters?.muxTokenId;
  if (roomId === undefined || roomId.length === 0) {
    return notFound();
  }

  const maybeBody = parseBody(event.body, isMuxWebhookBody);
  if (isFailure(maybeBody)) {
    console.log('Failed to parse webhook from mux:', maybeBody.value);
    return invalidRequest();
  }

  const body = successValue(maybeBody);

  const maybeAblyTask = getAblyClient();

  if (!body.type.includes('video.live_stream')) {
    console.log(`Ignoring webhook about ${body.type}`);
    return response({ ok: true });
  }

  console.log(`Attempting to refresh cache for ${roomId}`);

  // MAYBE: This may need to move into a seperate lambda that is async

  const maybeRefreshed = await getStreamStateFromDynamo(TableName, roomId, true);

  if (isFailure(maybeRefreshed)) {
    return invalidRequest();
  }

  const maybeAbly = await maybeAblyTask;
  if (isFailure(maybeAbly)) {
    console.log(`Failed to initialise ably`, maybeAbly.value);
  } else {
    const ably = successValue(maybeAbly);

    if (ably == undefined) {
      console.log('Not notifiying ably (ABLY_SERVER_KEY not set)');
    } else {
      console.log('Notifingly ably')
      await ably.channels.get('mux-monitor.aws.nextdayvideo.com.au').publish('stream', { roomId, ...successValue(maybeRefreshed)});
    }
  }

  return response({ ok: true });
});
