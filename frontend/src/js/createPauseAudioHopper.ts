import { createMaterialIcon } from './createMaterialIcon';

type UpdateButton = (isPaused: boolean) => void;

export const createPauseAudioHopper = (
  within: HTMLElement,
  paused: boolean,
  pauseHopper: (updateButton: UpdateButton) => void,
): UpdateButton => {
  const base = document.createElement('button');

  base.classList.add('pause-audio-hopper');

  base.setAttribute('title', 'Pause/resume the rotation');

  const repeat = createMaterialIcon('update');
  const repeatOne = createMaterialIcon('update_disabled');

  const updateButton: UpdateButton = (isPasued) => {
    if (isPasued) {
      if (repeat.parentNode) {
        repeat.parentNode.removeChild(repeat);
      }
      base.appendChild(repeatOne);
      base.setAttribute('title', 'Automatic audio switching paused');
    } else {
      if (repeatOne.parentNode) {
        repeatOne.parentNode.removeChild(repeatOne);
      }
      base.appendChild(repeat);
      base.setAttribute('title', 'Automatic audio switching enabled');
    }
  };

  updateButton(paused);

  base.addEventListener('click', (ev) => {
    console.log('[all] pause audio click... ');

    pauseHopper(updateButton);

    ev.preventDefault();
    return false;
  });

  within.append(base);

  return updateButton;
};
