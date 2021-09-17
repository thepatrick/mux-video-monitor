import { createMaterialIcon } from './createMaterialIcon';

export const createNextPrevious = (
  within: HTMLElement,
  className: string,
  title: string,
  icon: string,
  eventHandler: () => void,
): HTMLElement => {
  const base = document.createElement('button');
  base.classList.add(className);
  base.setAttribute('title', title);

  base.appendChild(createMaterialIcon(icon));

  base.addEventListener('click', (ev) => {
    eventHandler();

    ev.preventDefault();
    return false;
  });

  within.append(base);

  return base;
};
