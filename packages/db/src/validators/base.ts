export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

interface FieldValidator<T> {
  validate: (value: unknown) => void;
  transform?: (value: T) => T;
  required?: boolean;
}

export class Validator<T extends Record<string, any>> {
  private validators: { [K in keyof T]?: FieldValidator<T[K]> };

  constructor(validators: { [K in keyof T]?: FieldValidator<T[K]> }) {
    this.validators = validators;
  }

  validate(data: Partial<T>, options: { requireAll?: boolean } = {}): Partial<T> {
    // Create type-safe result object
    const result = {} as Partial<T>;

    // Check required fields only when creating new records
    if (options.requireAll) {
      for (const [field, validator] of Object.entries(this.validators)) {
        const key = field as keyof T;
        if (validator?.required && !(key in data)) {
          throw new ValidationError(`Missing required field: ${field}`);
        }
      }
    }

    // Validate and transform fields
    for (const [field, value] of Object.entries(data)) {
      const key = field as keyof T;
      const validator = this.validators[key];

      if (validator) {
        if (value !== undefined) {
          validator.validate(value);
          result[key] = validator.transform ? validator.transform(value as any) : value;
        }
      } else {
        // Pass through fields without validators
        result[key] = value as T[keyof T];
      }
    }

    return result;
  }

  validateMany(dataArray: Partial<T>[], options: { requireAll?: boolean } = {}): Partial<T>[] {
    return dataArray.map((data) => this.validate(data, options));
  }
}
