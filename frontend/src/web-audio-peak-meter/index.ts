import {
  createBars,
  createContainerDiv,
  createMasks,
  createMeterDataMarkup,
  createPeakBars,
  createPeakLabels,
  createTicks,
  paintMeter,
} from './markup';
import { MeterData } from './MeterData';
import { NodeConfig, defaultNodeConfig, Config, defaultConfig } from './Config';
import { calculateMaxValues } from './peak-sample';
import { calculateTPValues } from './true-peak';
import { findAudioProcBufferSize } from './utils';
import { appendChild } from '../js/dom';

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

export function createMeter(
  domElement: HTMLElement,
  meterNode: ScriptProcessorNode,
  options: Partial<Config> = {},
): void {
  // eslint-disable-next-line prefer-object-spread
  const config = { ...defaultConfig, ...options };

  const meterElement = createContainerDiv(config);

  appendChild(domElement)(meterElement);

  const { channelCount } = meterNode;

  const append = appendChild(meterElement);

  const meterDataFromMarkup = createMeterDataMarkup(meterElement, config);

  createTicks(config, meterDataFromMarkup).map(append);

  createBars(config, meterDataFromMarkup, channelCount).map(append);

  const channelMasks = createMasks(config, meterDataFromMarkup, channelCount);

  channelMasks.map(append);

  console.log('channelMasks', channelMasks);

  const textLabels = createPeakLabels(config, meterDataFromMarkup, channelCount);

  textLabels.map(append);

  const peakBars = createPeakBars(config, meterDataFromMarkup, channelCount);

  peakBars.map(append);

  console.log('peakBars', peakBars);

  const meterData: MeterData = {
    tempPeaks: new Array<number>(channelCount).fill(0.0),
    heldPeaks: new Array<number>(channelCount).fill(0.0),
    peakHoldTimeouts: new Array<NodeJS.Timeout | null>(channelCount).fill(null),
    channelCount,

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

  paintMeter(config, { channelMasks, textLabels, peakBars }, meterDataFromMarkup, meterData);
}
