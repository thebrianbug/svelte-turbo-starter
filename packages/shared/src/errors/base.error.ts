/**
 * Base class for all errors in the system.
 * Provides common error properties and type safety.
 */
export abstract class BaseError extends Error {
  readonly timestamp: Date = new Date();

  constructor(
    readonly code: string,
    readonly message: string,
    readonly metadata?: Record<string, unknown>
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      timestamp: this.timestamp,
      metadata: this.metadata
    };
  }
}
