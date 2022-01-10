import { SSM } from 'aws-sdk';
import { failure, isFailure, Result, success, successValue } from '../../helpers/result';
import { getRoomWithTags } from '../rooms/getRoomWithTags';
import { maybeGetMuxTokenSecret } from './maybeGetMuxTokenSecret';
import { getStreamURL } from './getStreamURL';
import { StreamStateWithTitle } from './StreamState';
import { demos } from './demos';

export const makeGetStreamStateFromSSMAndMux = (ssm: SSM) =>
  async (roomId: string): Promise<Result<Error, StreamStateWithTitle>> => {
    const maybeMuxTokenSecret = await maybeGetMuxTokenSecret(ssm, roomId);
    if (isFailure(maybeMuxTokenSecret)) {
      console.log('No secret found for ' + roomId);
      return failure(new Error('Not found'));
    }

    const maybeGetTags = await getRoomWithTags(ssm, `/multiview/mux/${roomId}`);
    if (isFailure(maybeGetTags)) {
      console.log('No tags found for ' + roomId);
      return failure(new Error('Could not get tags'));
    }

    const { tags } = successValue(maybeGetTags);

    const title = tags['multiview:title'] || roomId;

    const demoResponse = demos[tags['multivew:demo'] || 'none'];
    if (demoResponse) {
      return success({ ...demoResponse, title });
    }
    const muxTokenSecret = successValue(maybeMuxTokenSecret);

    const maybeStream = await getStreamURL(roomId, muxTokenSecret);
    if (isFailure(maybeStream)) {
      return failure(new Error('Unable to retrieve stream state from mux'));
    }

    const stream = successValue(maybeStream);

    return success({ ...stream, title });
  };
