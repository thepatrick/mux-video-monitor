export interface MeterDataMarkup {
  vertical: boolean;
  meterWidth: number;
  meterHeight: number;
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
