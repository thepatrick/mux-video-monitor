import { SSM } from '@aws-sdk/client-ssm';
import { failure, Result, success } from '../../helpers/result';

export type RoomTag = Record<string, string>;
export interface RoomWithTags {
  id: string;
  tags: RoomTag;
}

export const getRoomWithTags = async (ssm: SSM, id: string): Promise<Result<Error, RoomWithTags>> => {
  const { TagList } = await ssm.listTagsForResource({
    ResourceId: id,
    ResourceType: 'Parameter',
  });

  if (TagList == null) {
    return failure(new Error('Unexpected AWS response'));
  }

  const tags = TagList.reduce(
    (prev, { Key, Value }) => ({
      ...prev,
      ...(Key && Value ? { [Key]: Value } : {}),
    }),
    {} as RoomTag,
  );

  return success({ id, tags });
};
