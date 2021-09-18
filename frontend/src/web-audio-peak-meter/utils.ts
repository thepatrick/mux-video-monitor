const debugMode = false;

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const log = debugMode ? console.log : () => {};

const getBaseLog = (x: number, y: number) => Math.log(y) / Math.log(x);

export const dbFromFloat = (floatVal: number): number => {
  return getBaseLog(10, floatVal) * 20;
};

export const findAudioProcBufferSize = (numSamplesIn: number): number => {
  return [256, 512, 1024, 2048, 4096, 8192, 16384].reduce((a, b) =>
    Math.abs(b - numSamplesIn) < Math.abs(a - numSamplesIn) ? b : a,
  );
};
