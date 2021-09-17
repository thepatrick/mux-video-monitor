export const createStreamIframe =
  (within: HTMLElement) =>
  (id: string, destination: string, style: string): HTMLIFrameElement => {
    const base = document.createElement('iframe');

    base.setAttribute('src', destination);
    base.setAttribute('style', style);
    base.setAttribute('x-id', id);

    within.append(base);

    return base;
  };
