export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }

  static notFound(message = 'Not found') {
    return new AppError(message, 404);
  }

  static badRequest(message = 'Bad request') {
    return new AppError(message, 400);
  }

  static internal(message = 'Internal server error') {
    return new AppError(message, 500);
  }

  static conflict(message = 'Conflict') {
    return new AppError(message, 409);
  }

  static forbidden(message = 'Forbidden') {
    return new AppError(message, 403);
  }
}
