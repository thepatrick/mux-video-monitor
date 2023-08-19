export interface MeterDataMarkup {
  meterTop: number;
  tickWidth: number;
}

export interface MeterData {
  channelCount: number;

  tempPeaks: number[];
  heldPeaks: number[];
  peakHoldTimeouts: (NodeJS.Timeout | null)[];

  lpfBuffer: number[];
  lpfCoefficients: number[];
  upsampleFactor: number;

  lastChannelTP: number[];
  decayFactor: number;
}
