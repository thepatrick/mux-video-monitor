import { DynamoDB } from 'aws-sdk';
import { isFailure, Result, successValue } from '../../helpers/result';
import { StreamStateWithTitle } from './StreamState';
import { writeStateToDynamo } from './writeStateToDynamo';

export const ageLimit = 60 * 1000;

export const makeRefreshStreamState =
  (
    getStreamStateFromSSMAndMux: (roomId: string) => Promise<Result<Error, StreamStateWithTitle>>,
    dynamo: DynamoDB,
    tableName: string,
  ) =>
  async (roomId: string): Promise<Result<Error, StreamStateWithTitle>> => {
    const maybeStreamState = await getStreamStateFromSSMAndMux(roomId);

    if (isFailure(maybeStreamState)) {
      return maybeStreamState;
    }

    const stream = successValue(maybeStreamState);

    const maybeWrite = await writeStateToDynamo(dynamo, tableName, roomId, stream);

    if (isFailure(maybeWrite)) {
      console.log('Failed to write stream to dynamodb...', maybeWrite.value);
    }

    return maybeStreamState;
  };


