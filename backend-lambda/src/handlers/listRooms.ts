import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { SSM } from 'aws-sdk';
import PQueue from 'p-queue';
import { response } from '../helpers/response';

import { failure, isFailure, isSuccess, Result, success, successValue } from '../helpers/result';
import { catchErrors } from './catchErrors';
import { getRoomWithTags } from '../helpers/getRoomWithTags';

const notUndefined = <T>(input: T | undefined): input is T => {
  return input !== undefined;
};

const roomTagsQueue = new PQueue({ concurrency: 4 });

const getOrderFromTag = (tagValue: string | undefined, defaultValue: number) => {
  if (tagValue === undefined) {
    return defaultValue;
  }

  const tagNumber = parseInt(tagValue, 10);

  if (isNaN(tagNumber)) {
    return defaultValue;
  }

  return tagNumber;
}

const getRooms = async (): Promise<Result<Error, { id: string, title: string }[]>> => {
  const ssm = new SSM();

  const path = '/multiview/mux/';

  const { Parameters } = await ssm.getParametersByPath({ Path: path }).promise();

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

  const rooms = maybeRooms
    .filter(isSuccess)
    .map(successValue)
    .filter(({ tags }) => tags['multiview:show'] === 'true')
    .map(({ id, tags }, index) => ({ id: id.substr(path.length), title: tags['multiview:title'], order: getOrderFromTag(tags['multiview:order'], index) }))
    .sort(({ order: firstOrder }, { order: secondOrder }) => secondOrder - firstOrder);

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
