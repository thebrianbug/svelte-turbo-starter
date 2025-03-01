import { describe, it, expect } from 'vitest';
import { ValidationError } from './base';

describe('ValidationError', () => {
  it('should create an error with the correct name and message', () => {
    const message = 'Test validation error';
    const error = new ValidationError(message);

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ValidationError');
    expect(error.message).toBe(message);
  });
});
