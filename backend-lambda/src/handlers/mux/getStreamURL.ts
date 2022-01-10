import Mux from '@mux/mux-node';
import { failure, Result, success } from '../../helpers/result';
import { StreamState } from './StreamState';

export const getStreamURL = async (muxTokenId: string, muxTokenSecret: string): Promise<Result<Error, StreamState>> => {
  const { Video } = new Mux(muxTokenId, muxTokenSecret);

  try {
    const streams = await Video.LiveStreams.list({ limit: 10, page: 0 });

    const stream = streams.find(({ status }) => status === 'active');

    if (!stream) {
      console.log(`No active stream found for ${muxTokenId}`);
      return success({ state: 'not-active' });
    }

    const playbackId = stream.playback_ids?.[0]?.id;

    if (!playbackId) {
      console.log(`No playback ID found for ${muxTokenId}`);
      return success({ state: 'not-active' });
    }

    const streamURL = `https://stream.mux.com/${encodeURIComponent(playbackId)}.m3u8`;

    return success({
      state: 'active',
      streamURL,
    });
  } catch (err) {
    return failure(err as Error);
  }
};
