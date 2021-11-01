import Mux from '@mux/mux-node';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { SSM } from 'aws-sdk';
import { notFound, response } from '../helpers/response';
import { failure, isFailure, Result, success } from '../helpers/result';
import { catchErrors } from './catchErrors';
import { getRoomWithTags } from './getRoomWithTags';

const maybeGetMuxTokenSecret = async (ssm: SSM, muxTokenId: string): Promise<Result<Error, string>> => {
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getStream: APIGatewayProxyHandlerV2 = catchErrors(async (event, context) => {
  const muxTokenId = event.pathParameters?.muxTokenId;
  if (muxTokenId === undefined || muxTokenId.length === 0) {
    return notFound();
  }

  const ssm = new SSM();

  const maybeMuxTokenSecret = await maybeGetMuxTokenSecret(ssm, muxTokenId);

  if (isFailure(maybeMuxTokenSecret)) {
    console.log('No secret found for ' + muxTokenId);
    return notFound();
  }

  const maybeGetTags = await getRoomWithTags(ssm, `/multiview/mux/${muxTokenId}`);

  if (isFailure(maybeGetTags)) {
    console.log('No tags found for ' + muxTokenId);
    return notFound();
  }

  const { tags } = maybeGetTags.value;

  const title = tags['multiview:title'] || muxTokenId;

  if (tags['multiview:demo'] === 'offline') {
    return response({
      ok: true,
      online: false,
      stream: undefined,
      title,
    });
  } else if (tags['multiview:demo'] === 'fake-stream') {
    return response({
      ok: true,
      online: true,
      stream: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      title,
    });
  }

  const muxTokenSecret = maybeMuxTokenSecret.value;

  const { Video } = new Mux(muxTokenId, muxTokenSecret);

  const streams = await Video.LiveStreams.list({ limit: 10, page: 0 });

  const stream = streams.find(({ status }) => status === 'active');

  if (!stream) {
    console.log(
      'No active stream found',
      streams.map((st) => ({ status: st.status, id: st.id })),
    );
    return response({
      ok: true,
      online: false,
      stream: undefined,
      title,
    });
  }

  const playbackId = stream.playback_ids?.[0]?.id;

  if (!playbackId) {
    console.log(`No playback ID found for ${muxTokenId}`, stream.playback_ids);
    return response({
      ok: true,
      online: false,
      stream: undefined,
      title,
    });
  }

  const streamURL = `https://stream.mux.com/${encodeURIComponent(playbackId)}.m3u8`;
  console.log('streamURL', streamURL);

  return response({
    ok: true,
    online: true,
    stream: streamURL,
    title,
  });
});
