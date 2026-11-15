/**
 * Central Error Handling for FastAPI HTTP Responses.
 */

export interface ApiErrorDetail {
  loc?: (string | number)[];
  msg?: string;
  type?: string;
}

export class ApiError extends Error {
  public status: number;
  public details?: ApiErrorDetail[] | string;
  public data?: any;

  constructor(status: number, message: string, details?: ApiErrorDetail[] | string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
    this.data = data;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static fromResponse(status: number, body: any): ApiError {
    let message = '';
    let details: ApiErrorDetail[] | string | undefined;

    if (body) {
      if (typeof body.detail === 'string') {
        message = body.detail;
      } else if (Array.isArray(body.detail)) {
        details = body.detail;
        message = body.detail.map((d: any) => d.msg || 'Validation error').join(', ');
      } else if (body.message) {
        message = body.message;
      }
    }

    if (!message) {
      switch (status) {
        case 400:
          message = 'Bad request.';
          break;
        case 401:
          message = 'Invalid or expired session. Please log in.';
          break;
        case 403:
          message = 'Access denied: You do not have permission to perform this action.';
          break;
        case 404:
          message = 'The requested resource was not found.';
          break;
        case 409:
          message = 'A data conflict occurred. Please refresh and try again.';
          break;
        case 422:
          message = 'Validation error: please verify all form inputs.';
          break;
        case 429:
          message = 'Too many requests. Please wait a moment and try again.';
          break;
        default:
          message = status >= 500 ? 'Internal server error. Please try again later.' : `Request failed with status ${status}.`;
      }
    }

    return new ApiError(status, message, details, body);
  }
}

