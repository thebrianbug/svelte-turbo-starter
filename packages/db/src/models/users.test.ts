import { describe, it, expect } from 'vitest';
import { userQueries } from './users';
import type { NewUser } from './schema';

describe('User Model Unit Tests', () => {
  describe('Input Validation', () => {
    it('should validate user email format', () => {
      const invalidEmails = [
        'not-an-email',
        '@missing-local.com',
        'missing-domain@',
        'missing-tld@domain',
        '@.com',
        'spaces in@email.com',
        'double@@email.com'
      ];

      invalidEmails.forEach(email => {
        expect(() => {
          userQueries.validateEmail(email);
        }).toThrow('Invalid email format');
      });

      // Valid email should not throw
      expect(() => {
        userQueries.validateEmail('valid@email.com');
      }).not.toThrow();
    });

    it('should validate user name length', () => {
      const tooShortName = '';
      const tooLongName = 'a'.repeat(101);

      expect(() => {
        userQueries.validateName(tooShortName);
      }).toThrow('Name must be between 1 and 100 characters');

      expect(() => {
        userQueries.validateName(tooLongName);
      }).toThrow('Name must be between 1 and 100 characters');

      // Valid name should not throw
      expect(() => {
        userQueries.validateName('Valid Name');
      }).not.toThrow();
    });

    it('should validate user status', () => {
      const invalidStatus = 'pending' as any;

      expect(() => {
        userQueries.validateStatus(invalidStatus);
      }).toThrow('Invalid status');

      // Valid statuses should not throw
      expect(() => {
        userQueries.validateStatus('active');
        userQueries.validateStatus('inactive');
      }).not.toThrow();
    });
  });

  describe('Data Transformation', () => {
    it('should normalize email addresses', () => {
      const email = '  Test.User@EXAMPLE.COM  ';
      const normalized = userQueries.normalizeEmail(email);
      expect(normalized).toBe('test.user@example.com');
    });

    it('should sanitize user names', () => {
      const name = '  Test   User  ';
      const sanitized = userQueries.sanitizeName(name);
      expect(sanitized).toBe('Test User');
    });
  });
});
