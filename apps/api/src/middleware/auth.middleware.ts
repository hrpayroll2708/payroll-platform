import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'sarwin_enterprise_jwt_secure_secret_2026';

export interface AuthenticatedUser {
  id: string;
  email: string;
  companyId: string;
  employeeId?: string | null;
  roles: string[];
  permissions: string[];
  tokenVersion: number;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.sarwin_access_token ||
      (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);

    if (!token) {
      return res.status(401).json({ error: 'Authentication required. No session token provided.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; companyId: string; tokenVersion: number };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User account is inactive or no longer exists.' });
    }

    if (user.tokenVersion !== decoded.tokenVersion) {
      return res.status(401).json({ error: 'Session has been invalidated or expired. Please re-login.' });
    }

    const roles = user.userRoles.map((ur) => ur.role.code);
    const permissions = Array.from(
      new Set(
        user.userRoles.flatMap((ur) =>
          ur.role.rolePermissions.map((rp) => rp.permission.code)
        )
      )
    );

    req.user = {
      id: user.id,
      email: user.email,
      companyId: user.companyId,
      employeeId: user.employeeId,
      roles,
      permissions,
      tokenVersion: user.tokenVersion,
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session token.' });
  }
}

export function requirePermission(requiredPermission: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!req.user.permissions.includes(requiredPermission)) {
      return res.status(403).json({
        error: 'Forbidden: Insufficient permissions for this action.',
        requiredPermission,
      });
    }

    next();
  };
}