import { BaseError } from './base.error';

/**
 * Base class for all domain errors in the system.
 * Provides common error properties and type safety.
 */
export abstract class DomainError extends BaseError {
  constructor(
    readonly code: string,
    message: string,
    metadata?: Record<string, unknown>
  ) {
    super(code, message, metadata);
  }
}

export class EntityNotFoundError extends DomainError {
  constructor(entityType: string, identifier: string | number) {
    super('ENTITY_NOT_FOUND', `${entityType} not found: ${identifier}`, { entityType, identifier });
  }
}

export class ValidationError extends DomainError {
  constructor(entityType: string, message: string) {
    super('VALIDATION_FAILED', `${entityType} validation error: ${message}`, {
      entityType,
      validationMessage: message
    });
  }
}

export class DuplicateEntityError extends DomainError {
  constructor(entityType: string, field: string, value: string) {
    super('ENTITY_ALREADY_EXISTS', `${entityType} with ${field} already exists: ${value}`, {
      entityType,
      field,
      value
    });
  }
}

export class OperationError extends DomainError {
  constructor(entityType: string, operation: string, message: string) {
    super('OPERATION_FAILED', `Failed to ${operation} ${entityType}: ${message}`, {
      entityType,
      operation,
      message
    });
  }
}
