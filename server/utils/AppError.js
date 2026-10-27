/** Error whose message is safe to show to API clients. */
export default class AppError extends Error {
  constructor(message, status = 400, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
    this.expose = true;
  }
}
