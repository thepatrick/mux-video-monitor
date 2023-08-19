export interface NodeConfig {
  refreshEveryApproxMs: number;
}
export interface Config {
  borderSize: number;
  fontSize: number;
  peakFontSize: number;
  backgroundColor: string;
  tickColor: string;
  labelColor: string;
  gradient: string[];
  dbRange: number;
  dbTickSize: number;
  maskTransition: string;
  peakTransition: string;
  audioMeterStandard: 'peak-sample' | 'true-peak';
  peakHoldDuration: number;
}
export const defaultNodeConfig: NodeConfig = {
  refreshEveryApproxMs: 20,
};
export const defaultConfig: Config = {
  borderSize: 1,
  fontSize: 9,
  peakFontSize: 9,
  backgroundColor: 'black',
  tickColor: '#ddd',
  labelColor: '#ddd',
  gradient: ['red 1%', '#ff0 16%', 'lime 45%', '#080 100%'],
  dbRange: 48,
  dbTickSize: 6,
  maskTransition: '0.1s',
  peakTransition: '0.05s',
  audioMeterStandard: 'peak-sample',
  peakHoldDuration: null,
};
