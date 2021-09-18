interface SetTitleLabelArguments {
  loading?: boolean;
  live?: false;
  error?: string;
}

export const createSetTitleLabel =
  (el: HTMLElement, room: string) =>
  ({ loading = false, live = false, error }: SetTitleLabelArguments): void => {
    let description = '';
    if (loading) {
      description = '...';
    } else if (error) {
      description = `: ${error}`;
    } else if (live) {
      description = ' (live)';
    } else {
      description = ' (offline)';
    }
    el.textContent = `${room}${description}`;
  };
