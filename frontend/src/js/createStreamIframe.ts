export const createStreamIframe =
  (within: HTMLElement) =>
  (id: string, destination: string, style: string, classList?: string[]): HTMLIFrameElement => {
    const base = document.createElement('iframe');

    base.setAttribute('src', destination);
    base.setAttribute('style', style);
    base.setAttribute('x-id', id);

    if (classList) {
      base.classList.add(...classList);
    }

    within.append(base);

    return base;
  };
