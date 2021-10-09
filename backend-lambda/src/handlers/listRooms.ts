import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { SSM } from 'aws-sdk';
import PQueue from 'p-queue';
import { response } from '../helpers/response';

import { failure, isFailure, isSuccess, Result, success } from '../helpers/result';
import { catchErrors } from './catchErrors';

const notUndefined = <T>(input: T | undefined): input is T => {
  return input !== undefined;
};

const roomTagsQueue = new PQueue({ concurrency: 4 });

type RoomTag = Record<string, string>;
interface RoomWithTags {
  id: string;
  tags: RoomTag[];
}

const getRoomWithTags = async (ssm: SSM, id: string): Promise<Result<Error, RoomWithTags>> => {
  const { TagList } = await ssm
    .listTagsForResource({
      ResourceId: id,
      ResourceType: 'Parameter',
    })
    .promise();

  if (TagList == null) {
    return failure(new Error('Unexpected AWS response'));
  }

  const tags = TagList.reduce(
    (prev, { Key, Value }) => ({
      ...prev,
      [Key]: Value,
    }),
    {} as RoomTag[],
  );

  return success({ id, tags });
};

const getRooms = async (): Promise<Result<Error, RoomWithTags[]>> => {
  const ssm = new SSM();

  const { Parameters /*, NextToken */ } = await ssm
    .getParametersByPath({
      Path: '/multiview/mux/',
    })
    .promise();

  if (Parameters == null) {
    return failure(new Error('Unexpected AWS response'));
  }

  const eventuallyNames = Parameters.map(({ Name }) => Name)
    .filter(notUndefined)
    .map((name) => roomTagsQueue.add(() => getRoomWithTags(ssm, name)));

  const maybeRooms = await Promise.all(eventuallyNames);

  const errors = maybeRooms.filter(isFailure).map(({ value }) => value);
 
  if (errors.length > 0) {
    return failure(new Error(`${errors.length} errors fetching tags. ${errors.map((e) => e.message).join(', ')}`));
  }

  // if (NextToken != null) {
  //   // maybe get more
  // }

  const rooms = maybeRooms.filter(isSuccess).map(({ value }) => value);

  return success(rooms);
};

export const listRooms: APIGatewayProxyHandlerV2 = catchErrors(async (event, context) => {
  const maybeRooms = await getRooms();

  if (isFailure(maybeRooms)) {
    throw maybeRooms.value;
  }

  return response({
    ok: true,
    rooms: maybeRooms.value,
  });
});
