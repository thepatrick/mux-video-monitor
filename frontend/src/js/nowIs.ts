export const nowIs = () => {
  const now = new Date();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');

  return `${now.getHours()}:${minutes}:${seconds}`;
};
