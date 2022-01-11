interface SetTitleLabelArguments {
  loading?: boolean;
  live?: boolean;
  error?: string;
  room: string;
}

export const createSetTitleLabel =
  (el: HTMLElement) =>
  ({ loading = false, live = false, room, error }: SetTitleLabelArguments): void => {
    let description = '';
    if (loading) {
      description = '...';
    } else if (error) {
      description = `: ${error}`;
    }
    el.textContent = `${room}${description}`;
  };
