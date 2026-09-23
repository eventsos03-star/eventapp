import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';
import type { OrganizationRole } from '../modules/organization/organizationMember.model.js';

export function requireOrgRole(...allowedRoles: OrganizationRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !req.user.organizationId) {
      throw new AppError('You do not belong to an active organization', 403);
    }

    // Organization owner has super-permissions for all organization areas
    const currentRole = (req.user as any).orgRole as OrganizationRole;
    if (currentRole === 'owner' || allowedRoles.includes(currentRole)) {
      return next();
    }

    throw new AppError(
      `Access denied: This task requires one of the following roles: ${allowedRoles.join(', ')}`,
      403
    );
  };
}