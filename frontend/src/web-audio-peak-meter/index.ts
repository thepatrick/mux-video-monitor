import { createBars, createContainerDiv, createMasks, createPeakLabels, createTicks, paintMeter } from './markup';
import { MeterData } from './MeterData';
import { calculateMaxValues } from './peak-sample';
import { calculateTPValues } from './true-peak';
import { findAudioProcBufferSize } from './utils';

interface NodeConfig {
  refreshEveryApproxMs: number;
}

interface Config {
  borderSize: number;
  fontSize: number;
  backgroundColor: string;
  tickColor: string;
  labelColor: string;
  gradient: string[];
  dbRange: number;
  dbTickSize: number;
  maskTransition: string;
  audioMeterStandard: 'peak-sample' | 'true-peak';
  peakHoldDuration: number;
}

const defaultNodeConfig: NodeConfig = {
  refreshEveryApproxMs: 20,
};

const defaultConfig: Config = {
  borderSize: 2,
  fontSize: 9,
  backgroundColor: 'black',
  tickColor: '#ddd',
  labelColor: '#ddd',
  gradient: ['red 1%', '#ff0 16%', 'lime 45%', '#080 100%'],
  dbRange: 48,
  dbTickSize: 6,
  maskTransition: '0.1s',
  audioMeterStandard: 'peak-sample', // Could be "true-peak" (ITU-R BS.1770) or "peak-sample"
  peakHoldDuration: null,
};

export function createMeterNode(
  sourceNode: AudioNode,
  audioCtx: AudioContext,
  options: Partial<NodeConfig> = {},
): ScriptProcessorNode {
  const config: NodeConfig = { ...defaultNodeConfig, ...options };
  const { refreshEveryApproxMs } = config;
  const { channelCount } = sourceNode;
  const { sampleRate } = audioCtx;

  // Calculate refresh interval
  const resfreshIntervalSamples = (refreshEveryApproxMs / 1000) * sampleRate * channelCount;
  const bufferSize = findAudioProcBufferSize(resfreshIntervalSamples);
  const meterNode = audioCtx.createScriptProcessor(bufferSize, channelCount, channelCount);
  sourceNode.connect(meterNode).connect(audioCtx.destination);
  return meterNode;
}

function updateMeter(audioProcessingEvent: AudioProcessingEvent, config: Config, meterData: MeterData) {
  const { inputBuffer } = audioProcessingEvent;
  const { audioMeterStandard, peakHoldDuration } = config;
  let channelMaxes: number[] = [];

  // Calculate peak levels
  if (audioMeterStandard === 'true-peak') {
    // This follows ITU-R BS.1770 (True Peak meter)
    channelMaxes = calculateTPValues(inputBuffer, meterData);
  } else {
    // Just get the peak level
    channelMaxes = calculateMaxValues(inputBuffer);
  }
  // Update peak & text values
  for (let i = 0; i < channelMaxes.length; i += 1) {
    meterData.tempPeaks[i] = channelMaxes[i];
    if (channelMaxes[i] > meterData.heldPeaks[i]) {
      meterData.heldPeaks[i] = channelMaxes[i];
      if (peakHoldDuration) {
        if (meterData.peakHoldTimeouts[i]) {
          clearTimeout(meterData.peakHoldTimeouts[i]);
        }
        meterData.peakHoldTimeouts[i] = setTimeout(() => {
          meterData.heldPeaks[i] = meterData.tempPeaks[i];
        }, peakHoldDuration);
      }
    }
  }
}

export function createMeter(domElement: HTMLElement, meterNode: ScriptProcessorNode, options: Partial<Config> = {}) {
  // eslint-disable-next-line prefer-object-spread
  const config = { ...defaultConfig, ...options };

  const meterElement = createContainerDiv(domElement, config);

  const { channelCount } = meterNode;

  const meterDataFromMarkup = createTicks(meterElement, config);

  const meterData: MeterData = {
    tempPeaks: new Array<number>(channelCount).fill(0.0),
    heldPeaks: new Array<number>(channelCount).fill(0.0),
    peakHoldTimeouts: new Array<NodeJS.Timeout | null>(channelCount).fill(null),
    channelCount,
    channelBars: createBars(meterElement, config, meterDataFromMarkup, channelCount),
    channelMasks: createMasks(meterElement, config, meterDataFromMarkup, channelCount),
    textLabels: createPeakLabels(meterElement, config, meterDataFromMarkup, channelCount),

    lpfCoefficients: [],
    lpfBuffer: [],
    upsampleFactor: 4,
    lastChannelTP: [],
    decayFactor: 0.99999,
  };

  meterNode.onaudioprocess = (evt) => updateMeter(evt, config, meterData);
  meterElement.addEventListener(
    'click',
    () => {
      meterData.heldPeaks.fill(0.0);
    },
    false,
  );

  paintMeter(config, meterDataFromMarkup, meterData);
}
