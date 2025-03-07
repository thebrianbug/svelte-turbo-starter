/**
 * Base class for all domain errors in the system.
 * Provides common error properties and type safety.
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;
  readonly timestamp: Date = new Date();

  constructor(
    message: string,
    public readonly metadata?: Record<string, unknown>
  ) {
    super(message);
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
  }

  /**
   * Get a structured representation of the error
   */
  toJSON() {
    return {
      code: this.code,
      message: this.message,
      timestamp: this.timestamp,
      metadata: this.metadata
    };
  }
}

export class EntityNotFoundError extends DomainError {
  readonly code = 'ENTITY_NOT_FOUND';

  constructor(entityType: string, identifier: string | number) {
    super(`${entityType} not found: ${identifier}`, { entityType, identifier });
  }
}

export class ValidationError extends DomainError {
  readonly code = 'VALIDATION_FAILED';

  constructor(entityType: string, message: string) {
    super(`${entityType} validation error: ${message}`, { entityType, validationMessage: message });
  }
}

export class DuplicateEntityError extends DomainError {
  readonly code = 'ENTITY_ALREADY_EXISTS';

  constructor(entityType: string, field: string, value: string) {
    super(`${entityType} with ${field} already exists: ${value}`, { entityType, field, value });
  }
}

export class OperationError extends DomainError {
  readonly code = 'OPERATION_FAILED';

  constructor(entityType: string, operation: string, message: string) {
    super(`Failed to ${operation} ${entityType}: ${message}`, { entityType, operation, message });
  }
}
