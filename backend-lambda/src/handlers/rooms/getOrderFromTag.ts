export const getOrderFromTag = (tagValue: string | undefined, defaultValue: number): number => {
  if (tagValue === undefined) {
    return defaultValue;
  }

  const tagNumber = parseInt(tagValue, 10);

  if (isNaN(tagNumber)) {
    return defaultValue;
  }

  return tagNumber;
};
