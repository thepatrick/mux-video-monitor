import { div } from '../js/dom';
import { Config } from './Config';
import { MeterData, MeterDataMarkup } from './MeterData';
import { dbFromFloat } from './utils';

export function audioClipPath(db: number, dbRange: number): string {
  let clipPercent = Math.floor((db * -100) / dbRange);
  if (clipPercent > 100) {
    clipPercent = 100;
  }
  if (clipPercent < 0) {
    clipPercent = 0;
  }
  return `inset(${clipPercent}% 0 0)`;
}

export const createContainerDiv = ({ backgroundColor }: Config): HTMLDivElement =>
  div([], {
    style: `position: relative; width: 100%; height: 100%; background-color: ${backgroundColor}`,
  });

export function createMeterDataMarkup({ fontSize, borderSize }: Config): MeterDataMarkup {
  const tickWidth = fontSize * 2.0;
  const meterTop = fontSize * 1.5 + borderSize;

  return {
    tickWidth,
    meterTop,
  };
}

export function createTicks({ dbRange, dbTickSize, fontSize, borderSize, tickColor }: Config): HTMLDivElement[] {
  const numTicks = Math.floor(dbRange / dbTickSize);
  const tickDivs = Array.from(Array(numTicks).keys()).map((i) =>
    div(`-${dbTickSize * i}`, {
      'x-kind': 'tick',
      style: `position: absolute; color: ${tickColor}; text-align: right; font-size: ${fontSize}px;`,
    }),
  );

  const tickWidth = fontSize * 2.0;
  const dbTickTop = fontSize + borderSize;

  tickDivs.forEach((tickDiv, i) => {
    tickDiv.style.width = `${tickWidth}px`;
    tickDiv.style.top = `calc(${dbTickTop}px + ${(100 / numTicks) * i}%`;
    tickDiv.style.borderTop = `1px solid ${tickColor}`;
    tickDiv.style.paddingTop = '5px';
  });

  return tickDivs;
}

export function createMasks(
  { backgroundColor, borderSize, maskTransition }: Config,
  { meterTop, tickWidth }: MeterDataMarkup,
  channelCount: number,
): HTMLDivElement[] {
  const barDivs = Array.from(Array(channelCount).keys()).map(() =>
    div([], {
      'x-kind': 'mask',
      style: `position: absolute; background-color: ${backgroundColor} `,
    }),
  );

  const leftPortion = (tickWidth + borderSize) / barDivs.length;

  barDivs.forEach((barDiv, i) => {
    const width = `calc((1/${channelCount})*100% - (${leftPortion}px + ${borderSize * (i + 1)}px))`;
    const left = `calc(${tickWidth + borderSize}px + ${
      borderSize * (i + 1)
    }px + ((1/${channelCount})*100% - ${leftPortion}px) * ${i})`;

    barDiv.style.height = `calc(100% - ${meterTop}px)`;
    barDiv.style.width = width;
    barDiv.style.top = `${meterTop}px`;
    barDiv.style.left = left;
    barDiv.style.transition = `height ${maskTransition}`;
  });
  return barDivs;
}

export function createPeakBars(
  { borderSize, maskTransition }: Config,
  { meterTop, tickWidth }: MeterDataMarkup,
  channelCount: number,
): HTMLDivElement[] {
  const barDivs = Array.from(Array(channelCount).keys()).map(() =>
    div([], {
      'x-kind': 'peak-bar',
      style: `position: absolute; border-bottom: ${borderSize}px solid #ffffff;`,
    }),
  );

  barDivs.forEach((barDiv, i) => {
    barDiv.style.height = `calc(100% - ${meterTop}px)`;
    barDiv.style.width = `calc(${100 / channelCount}% - (${borderSize * 2 + tickWidth / channelCount}px}))`;
    barDiv.style.top = `${meterTop}px`;
    barDiv.style.left = `calc(((${100 / channelCount}% - (${borderSize * 2 + tickWidth / channelCount}px})) * ${i}) + ${
      tickWidth + borderSize * (i + 2)
    }px)`;
    barDiv.style.transition = `height ${maskTransition}`;
  });

  return barDivs;
}

export function createBars(
  { gradient, borderSize }: { gradient: string[]; borderSize: number },
  { meterTop, tickWidth }: MeterDataMarkup,
  channelCount: number,
): HTMLDivElement[] {
  const barDivs = Array.from(Array(channelCount).keys()).map(() =>
    div([], {
      'x-kind': 'bar',
      style: `position: absolute;`,
    }),
  );

  const leftPortion = (tickWidth + borderSize) / barDivs.length;

  const gradientStyle = `linear-gradient(to bottom, ${gradient.join(', ')})`;
  barDivs.forEach((barDiv, i) => {
    const width = `calc((1/${channelCount})*100% - (${leftPortion}px + ${borderSize * (i + 1)}px))`;
    const left = `calc(${tickWidth + borderSize}px + ${
      borderSize * (i + 1)
    }px + ((1/${channelCount})*100% - ${leftPortion}px) * ${i})`;

    barDiv.style.height = `calc(100% - ${meterTop}px)`;
    barDiv.style.width = width;
    // barDiv.style.width = `calc(${100 / channelCount}% - (${borderSize * 2 + tickWidth / channelCount}px}))`;
    barDiv.style.backgroundImage = gradientStyle;
    barDiv.style.top = `${meterTop}px`;
    barDiv.style.left = left;
    // barDiv.style.left = `calc(((${100 / channelCount}% - (${borderSize * 2 + tickWidth / channelCount}px})) * ${i}) + ${
    //   tickWidth + borderSize * (i + 2)
    // }px)`;

    // `${(barWidth + borderSize) * i + tickWidth + borderSize}px`;
  });
  return barDivs;
}

export function createPeakLabels(
  { borderSize, labelColor, peakFontSize }: { borderSize: number; labelColor: string; peakFontSize: number },
  { tickWidth }: MeterDataMarkup,
  channelCount: number,
): HTMLDivElement[] {
  const labelDivs = Array.from(Array(channelCount).keys()).map(() =>
    div('-∞', {
      'x-kind': 'peak-label',
      style: `text-align: center; color: ${labelColor}; font-size: ${peakFontSize}px; position: absolute;`,
    }),
  );

  labelDivs.forEach((label, i) => {
    const leftPortion = tickWidth / labelDivs.length;
    const width = `calc((1/${channelCount})*100% - ${leftPortion}px)`;
    label.style.width = width;
    const left = `calc(${tickWidth}px + ((1/${channelCount})*100% - ${leftPortion}px) * ${i})`;
    label.style.left = left;
    label.style.top = `${borderSize}px`;
  });
  return labelDivs;
}

export function maskSize(floatVal: number, dbRange: number, meterDimension: number): number {
  const d = dbRange * -1;
  const numPx = Math.floor((dbFromFloat(floatVal) * meterDimension) / d);
  if (numPx > meterDimension) {
    return meterDimension;
  }
  if (numPx < 0) {
    return 0;
  }
  return numPx;
}

export function paintMeter(
  config: { dbRange: number },
  {
    channelMasks,
    textLabels,
    peakBars,
  }: { channelMasks: HTMLDivElement[]; textLabels: HTMLDivElement[]; peakBars: HTMLDivElement[] },
  meterDataMarkup: MeterDataMarkup,
  meterData: MeterData,
): void {
  const { dbRange } = config;
  const { meterTop } = meterDataMarkup;
  const { tempPeaks, heldPeaks } = meterData;

  // hopefully some day transition will work for clip path.
  // until then we use a mask div.
  // channelBars.forEach((barDiv, i) => {
  //   const tempPeak = dbFromFloat(tempPeaks[i]);
  //   const clipPath = audioClipPath(tempPeak, dbRange);
  //   barDiv.style.clipPath = clipPath;
  //   barDiv.style.WebkitClipPath = clipPath;
  // });

  channelMasks.forEach((maskDiv, i) => {
    const channelSize = maskSize(tempPeaks[i], dbRange, 100);
    maskDiv.style.height = `calc(${channelSize}% - ${meterTop}px)`;
  });

  textLabels.forEach((textLabel, i) => {
    if (heldPeaks[i] === 0.0) {
      textLabel.textContent = '-∞';
    } else {
      const heldPeak = dbFromFloat(heldPeaks[i]);
      textLabel.textContent = heldPeak.toFixed(1);
    }
  });

  peakBars.forEach((peakBar, i) => {
    if (heldPeaks[i] === 0.0) {
      peakBar.setAttribute('x-hold', '-∞');
    } else {
      const heldTop = maskSize(heldPeaks[i], dbRange, 100);
      peakBar.style.height = `calc(${heldTop}% - ${meterTop}px)`;

      const heldPeak = dbFromFloat(heldPeaks[i]);
      peakBar.setAttribute('x-hold', heldPeak.toFixed(1));
    }
  });

  window.requestAnimationFrame(() =>
    paintMeter(config, { channelMasks, textLabels, peakBars }, meterDataMarkup, meterData),
  );
}
