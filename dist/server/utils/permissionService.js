import { db } from '../db.js';
import { membershipPermissions, userPermissions, permissions } from '../../shared/schema.js';
import { eq, and } from 'drizzle-orm';
export class PermissionService {
    /**
     * Check if a user has a specific permission
     */
    static async hasPermission(userId, permissionName, membershipType) {
        try {
            // First check individual user permissions (overrides membership)
            const userPerm = await db
                .select()
                .from(userPermissions)
                .where(and(eq(userPermissions.userId, userId), eq(userPermissions.permissionName, permissionName), eq(userPermissions.isGranted, true)))
                .limit(1);
            if (userPerm.length > 0) {
                return true;
            }
            // If no individual permission, check membership-based permissions
            if (membershipType) {
                const membershipPerm = await db
                    .select()
                    .from(membershipPermissions)
                    .where(and(eq(membershipPermissions.membershipType, membershipType), eq(membershipPermissions.permissionName, permissionName), eq(membershipPermissions.isGranted, true)))
                    .limit(1);
                return membershipPerm.length > 0;
            }
            return false;
        }
        catch (error) {
            console.error('Permission check error:', error);
            return false;
        }
    }
    /**
     * Get all permissions for a user
     */
    static async getUserPermissions(userId, membershipType) {
        try {
            // Get individual user permissions
            const userPerms = await db
                .select()
                .from(userPermissions)
                .where(and(eq(userPermissions.userId, userId), eq(userPermissions.isGranted, true)));
            // Get membership-based permissions
            const membershipPerms = await db
                .select()
                .from(membershipPermissions)
                .where(and(eq(membershipPermissions.membershipType, membershipType), eq(membershipPermissions.isGranted, true)));
            // Combine permissions
            const allPermissions = new Set();
            userPerms.forEach(perm => allPermissions.add(perm.permissionName));
            membershipPerms.forEach(perm => allPermissions.add(perm.permissionName));
            const isAdmin = allPermissions.has('system_settings') ||
                allPermissions.has('manage_users') ||
                allPermissions.has('manage_permissions');
            return {
                userId,
                membershipType,
                permissions: Array.from(allPermissions),
                isAdmin
            };
        }
        catch (error) {
            console.error('Get user permissions error:', error);
            return {
                userId,
                membershipType,
                permissions: [],
                isAdmin: false
            };
        }
    }
    /**
     * Get all available permissions
     */
    static async getAllPermissions() {
        try {
            const perms = await db
                .select()
                .from(permissions)
                .where(eq(permissions.isActive, true))
                .orderBy(permissions.category, permissions.name);
            return perms;
        }
        catch (error) {
            console.error('Get all permissions error:', error);
            return [];
        }
    }
    /**
     * Get permissions by category
     */
    static async getPermissionsByCategory(category) {
        try {
            const perms = await db
                .select()
                .from(permissions)
                .where(and(eq(permissions.category, category), eq(permissions.isActive, true)))
                .orderBy(permissions.name);
            return perms;
        }
        catch (error) {
            console.error('Get permissions by category error:', error);
            return [];
        }
    }
    /**
     * Grant permission to a user
     */
    static async grantPermission(userId, permissionName, grantedBy, expiresAt, notes) {
        try {
            // First check if permission exists
            const perm = await db
                .select()
                .from(permissions)
                .where(eq(permissions.name, permissionName))
                .limit(1);
            if (perm.length === 0) {
                console.error(`Permission '${permissionName}' not found`);
                return false;
            }
            await db.insert(userPermissions).values({
                userId,
                permissionId: perm[0].id,
                permissionName,
                isGranted: true,
                grantedBy,
                expiresAt,
                notes
            });
            return true;
        }
        catch (error) {
            console.error('Grant permission error:', error);
            return false;
        }
    }
    /**
     * Revoke permission from a user
     */
    static async revokePermission(userId, permissionName) {
        try {
            await db
                .update(userPermissions)
                .set({ isGranted: false })
                .where(and(eq(userPermissions.userId, userId), eq(userPermissions.permissionName, permissionName)));
            return true;
        }
        catch (error) {
            console.error('Revoke permission error:', error);
            return false;
        }
    }
    /**
     * Check if user can perform content moderation
     */
    static async canModerate(userId, membershipType) {
        const permissions = [
            'moderate_comments',
            'moderate_articles',
            'moderate_users',
            'approve_content',
            'reject_content'
        ];
        for (const perm of permissions) {
            if (await this.hasPermission(userId, perm, membershipType)) {
                return true;
            }
        }
        return false;
    }
    /**
     * Check if user can create content
     */
    static async canCreateContent(userId, membershipType, contentType) {
        const permissionName = contentType === 'announcement' ? 'create_announcements' : 'create_articles';
        return await this.hasPermission(userId, permissionName, membershipType);
    }
    /**
     * Check if user can edit content
     */
    static async canEditContent(userId, membershipType, contentType) {
        const permissionName = contentType === 'announcement' ? 'edit_announcements' : 'edit_articles';
        return await this.hasPermission(userId, permissionName, membershipType);
    }
    /**
     * Check if user can delete content
     */
    static async canDeleteContent(userId, membershipType, contentType) {
        const permissionName = contentType === 'announcement' ? 'delete_announcements' : 'delete_articles';
        return await this.hasPermission(userId, permissionName, membershipType);
    }
    /**
     * Check if user can publish without review
     */
    static async canPublishWithoutReview(userId, membershipType) {
        return await this.hasPermission(userId, 'publish_without_review', membershipType);
    }
    /**
     * Check if user can access analytics
     */
    static async canAccessAnalytics(userId, membershipType) {
        return await this.hasPermission(userId, 'view_analytics', membershipType);
    }
    /**
     * Check if user can export data
     */
    static async canExportData(userId, membershipType) {
        return await this.hasPermission(userId, 'export_data', membershipType);
    }
    /**
     * Check if user is admin
     */
    static async isAdmin(userId, membershipType) {
        const adminPermissions = ['system_settings', 'manage_users', 'manage_permissions'];
        for (const perm of adminPermissions) {
            if (await this.hasPermission(userId, perm, membershipType)) {
                return true;
            }
        }
        return false;
    }
}
// Permission categories for frontend display
export const PERMISSION_CATEGORIES = {
    announcement: {
        name: 'Announcements',
        description: 'Create and manage official announcements',
        permissions: [
            'create_announcements',
            'edit_announcements',
            'delete_announcements',
            'pin_announcements'
        ]
    },
    news: {
        name: 'News Articles',
        description: 'Create and manage news articles',
        permissions: [
            'create_articles',
            'edit_articles',
            'delete_articles',
            'feature_articles',
            'fact_check_articles',
            'publish_without_review'
        ]
    },
    moderation: {
        name: 'Content Moderation',
        description: 'Moderate user-generated content',
        permissions: [
            'moderate_comments',
            'moderate_articles',
            'moderate_users',
            'approve_content',
            'reject_content'
        ]
    },
    analytics: {
        name: 'Analytics & Data',
        description: 'Access platform analytics and data',
        permissions: [
            'view_analytics',
            'export_data',
            'view_user_activity'
        ]
    },
    admin: {
        name: 'Administration',
        description: 'System administration capabilities',
        permissions: [
            'manage_users',
            'manage_permissions',
            'system_settings'
        ]
    }
};
// Membership permission summaries
export const MEMBERSHIP_PERMISSIONS = {
    citizen: {
        name: 'Citizen',
        description: 'Basic civic engagement access',
        permissions: [
            'create_announcements',
            'create_articles',
            'moderate_comments',
            'view_analytics'
        ]
    },
    press: {
        name: 'Press',
        description: 'Enhanced media and journalism access',
        permissions: [
            'create_announcements',
            'edit_announcements',
            'create_articles',
            'edit_articles',
            'publish_without_review',
            'moderate_comments',
            'moderate_articles',
            'approve_content',
            'reject_content',
            'view_analytics',
            'export_data',
            'view_user_activity',
            'fact_check_articles',
            'feature_articles'
        ]
    },
    government: {
        name: 'Government',
        description: 'Full administrative and content management access',
        permissions: [
            'create_announcements',
            'edit_announcements',
            'delete_announcements',
            'pin_announcements',
            'create_articles',
            'edit_articles',
            'delete_articles',
            'feature_articles',
            'fact_check_articles',
            'publish_without_review',
            'moderate_comments',
            'moderate_articles',
            'moderate_users',
            'approve_content',
            'reject_content',
            'view_analytics',
            'export_data',
            'view_user_activity',
            'manage_users',
            'manage_permissions',
            'system_settings'
        ]
    }
};
