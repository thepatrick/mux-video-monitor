import { audioClipPath } from './markup';

describe('audioClipPath functionality', () => {
  it('can handle values in the middle of the range', () => {
    expect.hasAssertions();
    const clipPath = audioClipPath(-12, 48);
    expect(clipPath).toBe('inset(25% 0 0)');
  });
});
