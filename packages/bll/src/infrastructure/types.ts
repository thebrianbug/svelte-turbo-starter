import type { IUserRepository } from '@repo/db/src/domains/users';

/**
 * Base type for service dependencies
 * Ensures consistent repository injection across services
 */
export interface ServiceDependencies {
  repositories: {
    users?: IUserRepository;
    // Add other repositories as needed
  };
}

/**
 * Base class for services that provides repository access
 * following DDD dependency injection pattern
 */
export abstract class BaseService {
  protected readonly deps: ServiceDependencies;

  constructor(deps: ServiceDependencies) {
    this.deps = deps;
  }
}
