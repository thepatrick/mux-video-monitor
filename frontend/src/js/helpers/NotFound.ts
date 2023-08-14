export class NotFound extends Error {
  constructor(
    message: string,
    public readonly code: number = 404,
  ) {
    super(message);
    this.name = 'NotFound';
  }
}
