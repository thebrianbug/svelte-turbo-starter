export class UserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserError';
  }
}

export class UserNotFoundError extends UserError {
  constructor(identifier: string | number) {
    super(`User not found: ${identifier}`);
    this.name = 'UserNotFoundError';
  }
}

export class UserValidationError extends UserError {
  constructor(message: string) {
    super(`Validation error: ${message}`);
    this.name = 'UserValidationError';
  }
}

export class UserEmailExistsError extends UserError {
  constructor(email: string) {
    super(`User with email already exists: ${email}`);
    this.name = 'UserEmailExistsError';
  }
}

export class UserOperationError extends UserError {
  constructor(operation: string, message: string) {
    super(`Failed to ${operation} user: ${message}`);
    this.name = 'UserOperationError';
  }
}
