import { createMaterialIcon } from './createMaterialIcon';

export const createStartAudioHopper = (within: HTMLElement, startAudioHopper: () => void): HTMLElement => {
  const base = document.createElement('button');
  base.classList.add('start-audio-hopper');
  base.setAttribute('title', 'Volume Off - Click to enable audio hopper');

  base.appendChild(createMaterialIcon('volume_off'));

  base.addEventListener('click', (ev) => {
    console.log('[all] rotate audio click... ');
    startAudioHopper();

    ev.preventDefault();

    base.parentNode.removeChild(base);

    return false;
  });

  within.append(base);

  return base;
};
