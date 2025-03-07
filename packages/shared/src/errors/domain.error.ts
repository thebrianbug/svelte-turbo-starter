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
