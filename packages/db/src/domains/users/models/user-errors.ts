import { DomainError } from '@repo/shared';

export class UserNotFoundError extends DomainError {
  readonly code = 'USER_NOT_FOUND';

  constructor(identifier: string | number) {
    super(`User not found: ${identifier}`, { identifier });
  }
}

export class UserValidationError extends DomainError {
  readonly code = 'USER_VALIDATION_FAILED';

  constructor(message: string) {
    super(`Validation error: ${message}`, { validationMessage: message });
  }
}

export class UserEmailExistsError extends DomainError {
  readonly code = 'USER_EMAIL_EXISTS';

  constructor(email: string) {
    super(`User with email already exists: ${email}`, { email });
  }
}

export class UserOperationError extends DomainError {
  readonly code = 'USER_OPERATION_FAILED';

  constructor(operation: string, message: string) {
    super(`Failed to ${operation} user: ${message}`, { operation, message });
  }
}
