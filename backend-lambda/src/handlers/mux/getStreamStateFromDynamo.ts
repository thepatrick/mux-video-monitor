import { DynamoDB, SSM } from 'aws-sdk';
import { isFailure, Result, success, successValue } from '../../helpers/result';
import { StreamStateDocument, StreamStateWithTitle } from './StreamState';
import { getDynamoCacheDocument } from '../../helpers/getDynamoCacheDocument';
import { makeGetStreamStateFromSSMAndMux } from './makeGetStreamStateFromSSMAndMux';
import { makeRefreshStreamState, ageLimit } from './refreshStreamState';

export const getStreamStateFromDynamo = async (
  tableName: string,
  roomID: string,
  forceRefresh: boolean
): Promise<Result<Error, StreamStateWithTitle>> => {
  const dynamo = new DynamoDB();

  const getStreamStateFromSSMAndMux = makeGetStreamStateFromSSMAndMux(new SSM());

  const refresh = makeRefreshStreamState(getStreamStateFromSSMAndMux, dynamo, tableName);

  if (forceRefresh) {
    console.log('Forcing refresh, refreshing...');
    return refresh(roomID);
  }

  const maybeCachedStream = await getDynamoCacheDocument<StreamStateDocument>(dynamo, tableName, 'stream', roomID);

  if (isFailure(maybeCachedStream)) {
    console.log(`Unexpected AWS response for cached stream ${roomID}, fallback...`);
    return getStreamStateFromSSMAndMux(roomID);
  }

  const cachedStateDocument = successValue(maybeCachedStream);

  if (cachedStateDocument === undefined) {
    console.log(`No cache found for stream/${roomID}, refreshing...`);
    return refresh(roomID);
  }

  const { LastUpdated, State } = cachedStateDocument;

  const now = Date.now();

  if (LastUpdated === undefined || LastUpdated < 0 || LastUpdated > now || State === undefined) {
    console.log('Weird data, refreshing...');
    return refresh(roomID);
  }

  const age = now - LastUpdated;
  if (age > ageLimit) {
    console.log('Expired, refreshing...');
    return refresh(roomID);
  }

  console.log(`Using cache for stream/${roomID}`);
  return success(State);
};
