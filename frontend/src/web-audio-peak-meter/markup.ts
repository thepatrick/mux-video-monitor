import { div } from '../js/dom';
import { Config } from './Config';
import { MeterData, MeterDataMarkup } from './MeterData';
import { dbFromFloat } from './utils';

export function audioClipPath(db: number, dbRange: number, vertical: boolean): string {
  let clipPercent = Math.floor((db * -100) / dbRange);
  if (clipPercent > 100) {
    clipPercent = 100;
  }
  if (clipPercent < 0) {
    clipPercent = 0;
  }
  if (vertical) {
    return `inset(${clipPercent}% 0 0)`;
  }
  return `inset(0 ${clipPercent}% 0 0)`;
}

export const createContainerDiv = ({ backgroundColor }: Config): HTMLDivElement =>
  div([], {
    style: `position: relative; width: 100%; height: 100%; background-color: ${backgroundColor}`,
  });

export function createMeterDataMarkup(
  parent: HTMLElement,
  { vertical, fontSize, borderSize }: Config,
): MeterDataMarkup {
  const { clientWidth, clientHeight } = {clientWidth:80,clientHeight:80}; // Monkeypatch for now - peer pyconau2023
  if (vertical) {
    const tickWidth = fontSize * 2.0;
    const meterTop = fontSize * 1.5 + borderSize;
    const meterHeight = clientHeight - meterTop - borderSize;
    const meterWidth = clientWidth - tickWidth - borderSize;

    return {
      vertical,
      tickWidth,
      meterHeight,
      meterWidth,
      meterTop,
    };
  }

  const tickWidth = fontSize * 1.5;
  const meterHeight = clientHeight - tickWidth - borderSize * 2;
  const meterTop = fontSize * 3;
  const meterWidth = clientWidth - meterTop - borderSize * 2;

  return {
    vertical,
    tickWidth,
    meterHeight,
    meterWidth,
    meterTop,
  };
}

export function createTicks(
  { dbRange, dbTickSize, fontSize, borderSize, tickColor }: Config,
  { vertical, meterWidth, meterTop }: MeterDataMarkup,
): HTMLDivElement[] {
  const numTicks = Math.floor(dbRange / dbTickSize);
  const tickDivs = Array.from(Array(numTicks).keys()).map((i) =>
    div(`-${dbTickSize * i}`, {
      'x-kind': 'tick',
      style: `position: absolute; color: ${tickColor}; text-align: right; font-size: ${fontSize}px;`,
    }),
  );

  if (vertical) {
    const tickWidth = fontSize * 2.0;
    const dbTickTop = fontSize + borderSize;

    tickDivs.forEach((tickDiv, i) => {
      tickDiv.style.width = `${tickWidth}px`;
      tickDiv.style.top = `calc(${dbTickTop}px + ${(100 / numTicks) * i}%`;
      tickDiv.style.borderTop = `1px solid ${tickColor}`;
      tickDiv.style.paddingTop = '5px';
    });
  } else {
    const tickSpacing = meterWidth / numTicks;
    tickDivs.forEach((tickDiv, i) => {
      tickDiv.style.width = `${meterTop}px`;
      tickDiv.style.bottom = `${borderSize}px`;
      tickDiv.style.right = `${tickSpacing * i + meterTop}px`;
    });
  }

  return tickDivs;
}

export function createMasks(
  { backgroundColor, borderSize, maskTransition }: Config,
  { vertical, meterWidth, meterHeight, meterTop, tickWidth }: MeterDataMarkup,
  channelCount: number,
): HTMLDivElement[] {
  const barDivs = Array.from(Array(channelCount).keys()).map(() =>
    div([], {
      'x-kind': 'mask',
      style: `position: absolute; background-color: ${backgroundColor} `,
    }),
  );
  if (vertical) {
    barDivs.forEach((barDiv, i) => {
      barDiv.style.height = `calc(100% - ${meterTop}px)`;
      barDiv.style.width = `calc(${100 / channelCount}% - (${borderSize * 2 + tickWidth / channelCount}px}))`;
      barDiv.style.top = `${meterTop}px`;
      barDiv.style.left = `calc(((${100 / channelCount}% - (${
        borderSize * 2 + tickWidth / channelCount
      }px})) * ${i}) + ${tickWidth + borderSize * (i + 2)}px)`;
      barDiv.style.transition = `height ${maskTransition}`;
    });
  } else {
    const barWidth = meterHeight / channelCount - borderSize;
    barDivs.forEach((barDiv, i) => {
      barDiv.style.height = `${barWidth}px`;
      barDiv.style.width = `${meterWidth}px`;
      barDiv.style.top = `${(barWidth + borderSize) * i + borderSize}px`;
      barDiv.style.right = `${meterTop}px`;
      barDiv.style.transition = `width ${maskTransition}`;
    });
  }
  return barDivs;
}

export function createPeakBars(
  { borderSize, maskTransition }: Config,
  { vertical, meterTop, tickWidth }: MeterDataMarkup,
  channelCount: number,
): HTMLDivElement[] {
  const barDivs = Array.from(Array(channelCount).keys()).map(() =>
    div([], {
      'x-kind': 'peak-bar',
      style: `position: absolute; border-bottom: ${borderSize}px solid #ffffff;`,
    }),
  );

  if (vertical) {
    barDivs.forEach((barDiv, i) => {
      barDiv.style.height = `calc(100% - ${meterTop}px)`;
      barDiv.style.width = `calc(${100 / channelCount}% - (${borderSize * 2 + tickWidth / channelCount}px}))`;
      barDiv.style.top = `${meterTop}px`;
      barDiv.style.left = `calc(((${100 / channelCount}% - (${
        borderSize * 2 + tickWidth / channelCount
      }px})) * ${i}) + ${tickWidth + borderSize * (i + 2)}px)`;
      barDiv.style.transition = `height ${maskTransition}`;
    });
  }

  return barDivs;
}

export function createBars(
  { gradient, borderSize }: { gradient: string[]; borderSize: number },
  { vertical, meterWidth, meterHeight, meterTop, tickWidth }: MeterDataMarkup,
  channelCount: number,
): HTMLDivElement[] {
  const barDivs = Array.from(Array(channelCount).keys()).map(() =>
    div([], {
      'x-kind': 'bar',
      style: `position: absolute;`,
    }),
  );

  // const initialClipPath = audioClipPath(dbRange, dbRange, vertical);
  // barDiv.style.clipPath = initialClipPath;
  // barDiv.style.WebkitClipPath = initialClipPath;

  if (vertical) {
    const gradientStyle = `linear-gradient(to bottom, ${gradient.join(', ')})`;
    barDivs.forEach((barDiv, i) => {
      barDiv.style.height = `calc(100% - ${meterTop}px)`;
      barDiv.style.width = `calc(${100 / channelCount}% - (${borderSize * 2 + tickWidth / channelCount}px}))`;
      barDiv.style.backgroundImage = gradientStyle;
      barDiv.style.top = `${meterTop}px`;
      barDiv.style.left = `calc(((${100 / channelCount}% - (${
        borderSize * 2 + tickWidth / channelCount
      }px})) * ${i}) + ${tickWidth + borderSize * (i + 2)}px)`;

      // `${(barWidth + borderSize) * i + tickWidth + borderSize}px`;
    });
  } else {
    const barWidth = meterHeight / channelCount - borderSize;
    const gradientStyle = `linear-gradient(to left, ${gradient.join(', ')})`;
    barDivs.forEach((barDiv, i) => {
      barDiv.style.height = `${barWidth}px`;
      barDiv.style.width = `${meterWidth}px`;
      barDiv.style.backgroundImage = gradientStyle;
      barDiv.style.top = `${(barWidth + borderSize) * i + borderSize}px`;
      barDiv.style.right = `${meterTop}px`;
    });
  }
  return barDivs;
}

export function createPeakLabels(
  { borderSize, labelColor, peakFontSize }: { borderSize: number; labelColor: string; peakFontSize: number },
  { vertical, meterWidth, meterHeight, tickWidth }: MeterDataMarkup,
  channelCount: number,
): HTMLDivElement[] {
  const labelDivs = Array.from(Array(channelCount).keys()).map(() =>
    div('-∞', {
      'x-kind': 'peak-label',
      style: `text-align: center; color: ${labelColor}; font-size: ${peakFontSize}px; position: absolute;`,
    }),
  );

  if (vertical) {
    const barWidth = meterWidth / channelCount;
    labelDivs.forEach((label, i) => {
      label.style.width = `${barWidth}px`;
      label.style.top = `${borderSize}px`;
      label.style.left = `${barWidth * i + tickWidth}px`;
    });
  } else {
    const barHeight = meterHeight / channelCount;
    labelDivs.forEach((label, i) => {
      label.style.width = `${peakFontSize * 2}px`;
      label.style.right = `${borderSize}px`;
      label.style.top = `${barHeight * i + tickWidth}px`;
    });
  }
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
  const { meterWidth, vertical, meterTop } = meterDataMarkup;
  const { tempPeaks, heldPeaks } = meterData;

  // hopefully some day transition will work for clip path.
  // until then we use a mask div.
  // channelBars.forEach((barDiv, i) => {
  //   const tempPeak = dbFromFloat(tempPeaks[i]);
  //   const clipPath = audioClipPath(tempPeak, dbRange, vertical);
  //   barDiv.style.clipPath = clipPath;
  //   barDiv.style.WebkitClipPath = clipPath;
  // });

  channelMasks.forEach((maskDiv, i) => {
    if (vertical) {
      const channelSize = maskSize(tempPeaks[i], dbRange, 100);
      maskDiv.style.height = `calc(${channelSize}% - ${meterTop}px)`;
    } else {
      const channelSize = maskSize(tempPeaks[i], dbRange, meterWidth);
      maskDiv.style.width = `${channelSize}px`;
    }
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
