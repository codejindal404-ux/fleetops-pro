import { Request, Response, NextFunction } from 'express';
import { Role } from '../services/dbStore.ts';
import { Permission, hasPermission } from '../permissions/rolePermissions.ts';

export const restrictTo = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required.' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        message: `Forbidden. Role '${req.user.role}' is not authorized to access this route. Required roles: [${roles.join(', ')}]`
      });
      return;
    }

    next();
  };
};

export const requirePermission = (permission: Permission) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required.' });
      return;
    }

    if (!hasPermission(req.user.role, permission)) {
      res.status(403).json({
        message: `Forbidden. Role '${req.user.role}' lacks the required permission: '${permission}'.`
      });
      return;
    }

    next();
  };
};
