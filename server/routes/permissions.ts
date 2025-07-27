import express, { Request, Response } from 'express';
import { db } from '../db';
import { userPermissions, permissions, users } from '../../shared/schema';
import { jwtAuth } from './auth';
import { PermissionService } from '../utils/permissionService';
import { eq, and } from 'drizzle-orm';

const app = express.Router();

// Get user's permissions
app.get("/api/permissions/me", jwtAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const userPerms = await PermissionService.getUserPermissions(
      userId, 
      user[0].membershipType || 'citizen'
    );

    res.json({
      success: true,
      permissions: userPerms
    });

  } catch (error) {
    console.error('Get user permissions error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user permissions",
      error: (error as any)?.message || String(error)
    });
  }
});

// Check if user has specific permission
app.post("/api/permissions/check", jwtAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    const { permissionName } = req.body;
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (!permissionName) {
      return res.status(400).json({
        success: false,
        message: "Permission name is required"
      });
    }

    const hasPermission = await PermissionService.hasPermission(
      userId,
      permissionName,
      user[0].membershipType || 'citizen'
    );

    res.json({
      success: true,
      hasPermission,
      permissionName,
      membershipType: user[0].membershipType || 'citizen'
    });

  } catch (error) {
    console.error('Check permission error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to check permission",
      error: (error as any)?.message || String(error)
    });
  }
});

// Get all available permissions (admin only)
app.get("/api/permissions/all", jwtAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const isAdmin = await PermissionService.isAdmin(userId, user[0].membershipType || 'citizen');

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to view all permissions"
      });
    }

    const allPermissions = await PermissionService.getAllPermissions();

    res.json({
      success: true,
      permissions: allPermissions
    });

  } catch (error) {
    console.error('Get all permissions error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch permissions",
      error: (error as any)?.message || String(error)
    });
  }
});

// Grant permission to user (admin only)
app.post("/api/permissions/grant", jwtAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    const { targetUserId, permissionName, expiresAt, notes } = req.body;
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const isAdmin = await PermissionService.isAdmin(userId, user[0].membershipType || 'citizen');

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to grant permissions"
      });
    }

    if (!targetUserId || !permissionName) {
      return res.status(400).json({
        success: false,
        message: "Target user ID and permission name are required"
      });
    }

    const success = await PermissionService.grantPermission(
      targetUserId,
      permissionName,
      userId,
      expiresAt ? new Date(expiresAt) : undefined,
      notes
    );

    if (success) {
      res.json({
        success: true,
        message: "Permission granted successfully"
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to grant permission"
      });
    }

  } catch (error) {
    console.error('Grant permission error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to grant permission",
      error: (error as any)?.message || String(error)
    });
  }
});

// Revoke permission from user (admin only)
app.post("/api/permissions/revoke", jwtAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    const { targetUserId, permissionName } = req.body;
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const isAdmin = await PermissionService.isAdmin(userId, user[0].membershipType || 'citizen');

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to revoke permissions"
      });
    }

    if (!targetUserId || !permissionName) {
      return res.status(400).json({
        success: false,
        message: "Target user ID and permission name are required"
      });
    }

    const success = await PermissionService.revokePermission(targetUserId, permissionName);

    if (success) {
      res.json({
        success: true,
        message: "Permission revoked successfully"
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to revoke permission"
      });
    }

  } catch (error) {
    console.error('Revoke permission error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to revoke permission",
      error: (error as any)?.message || String(error)
    });
  }
});

// Get user's individual permissions (admin only)
app.get("/api/permissions/user/:userId", jwtAuth, async (req: Request, res: Response) => {
  try {
    const adminUserId = (req.user as any)?.id;
    const { userId: targetUserId } = req.params;
    const adminUser = await db.select().from(users).where(eq(users.id, adminUserId)).limit(1);

    if (adminUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Admin user not found"
      });
    }

    const isAdmin = await PermissionService.isAdmin(adminUserId, adminUser[0].membershipType || 'citizen');

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to view user permissions"
      });
    }

    const targetUser = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1);

    if (targetUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Target user not found"
      });
    }

    const userPerms = await PermissionService.getUserPermissions(
      targetUserId,
      targetUser[0].membershipType || 'citizen'
    );

    res.json({
      success: true,
      user: targetUser[0],
      permissions: userPerms
    });

  } catch (error) {
    console.error('Get user permissions error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user permissions",
      error: (error as any)?.message || String(error)
    });
  }
});

export { app as permissionsRoutes }; 