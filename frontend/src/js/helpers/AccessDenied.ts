export class AccessDenied extends Error {
  constructor(
    message: string,
    public readonly code: number,
  ) {
    super(message);
    this.name = 'AccessDenied';
  }
}
