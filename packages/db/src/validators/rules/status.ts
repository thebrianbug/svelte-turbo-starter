import { ValidationError } from '../base';
import { type UserStatus } from '../../../schema';

export const validateStatus = (status: unknown): status is UserStatus => {
  if (typeof status !== 'string' || (status !== 'active' && status !== 'inactive')) {
    throw new ValidationError('Status must be either "active" or "inactive"');
  }
  return true;
};
