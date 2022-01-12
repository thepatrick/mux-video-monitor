export const roomLayouts: Record<number, string[]> = {
  1: ['width: calc(100%); height: calc(100% - 50px); position: absolute; left: 0; top: 0px;'],
  2: [
    'width: calc(50% - 1px); height: calc(100% - 50px); position: absolute; left: 0; top: 0px;',
    'width: calc(50% - 1px); height: calc(100% - 50px); position: absolute; right: 0; top: 0px;',
  ],
  3: [
    'width: calc(50% - 1px); height: calc(50% - 1px); position: absolute; left: 0; top: 0;',
    'width: calc(50% - 1px); height: calc(50% - 1px); position: absolute; right: 0; top: 0;',
    'width: calc(50% - 1px); height: calc(50% - 1px); position: absolute; left: 25%; bottom: 0;',
  ],
  4: [
    'width: calc(50% - 1px); height: calc(50% - 26px); position: absolute; left: 0; top: 0;',
    'width: calc(50% - 1px); height: calc(50% - 26px); position: absolute; right: 0; top: 0;',
    'width: calc(50% - 1px); height: calc(50% - 26px); position: absolute; left: 0; bottom: 51px;',
    'width: calc(50% - 1px); height: calc(50% - 26px); position: absolute; right: 0; bottom: 51px;',
  ],
};
