import { Validator } from '../base';
import { validateEmail, transformEmail } from '../rules/email';
import { validateString, transformString } from '../rules/string';
import { validateStatus } from '../rules/status';
import { type UserStatus } from '../../schema';

interface UserValidation {
  email: string;
  name: string;
  status: UserStatus;
}

export const userValidator = new Validator<UserValidation>({
  email: {
    validate: validateEmail,
    transform: transformEmail,
    required: true
  },
  name: {
    validate: (value: unknown) => validateString(value, { fieldName: 'Name' }),
    transform: transformString,
    required: true
  },
  status: {
    validate: validateStatus,
    required: true
  }
});
