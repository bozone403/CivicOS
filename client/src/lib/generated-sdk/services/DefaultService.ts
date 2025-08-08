/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DefaultService {
    /**
     * Login with email and password
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static postApiAuthLogin(
        requestBody: {
            email: string;
            password: string;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/login',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                401: `Invalid credentials`,
            },
        });
    }
    /**
     * Get current user
     * @returns any OK
     * @throws ApiError
     */
    public static getApiAuthUser(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/auth/user',
            errors: {
                401: `Unauthorized`,
            },
        });
    }
    /**
     * Get social feed
     * @param limit
     * @param offset
     * @returns any OK
     * @throws ApiError
     */
    public static getApiSocialFeed(
        limit?: number,
        offset?: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/social/feed',
            query: {
                'limit': limit,
                'offset': offset,
            },
            errors: {
                401: `Unauthorized`,
            },
        });
    }
    /**
     * Create social post
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static postApiSocialPosts(
        requestBody: {
            content: string;
            imageUrl?: string;
            visibility?: 'public' | 'private' | 'friends';
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/social/posts',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                401: `Unauthorized`,
            },
        });
    }
    /**
     * List notifications for current user
     * @returns any OK
     * @throws ApiError
     */
    public static getApiNotifications(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/notifications',
            errors: {
                401: `Unauthorized`,
            },
        });
    }
    /**
     * Get unread notifications count
     * @returns any OK
     * @throws ApiError
     */
    public static getApiNotificationsUnreadCount(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/notifications/unread-count',
        });
    }
    /**
     * Mark all notifications as read
     * @returns any OK
     * @throws ApiError
     */
    public static patchApiNotificationsReadAll(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/notifications/read-all',
        });
    }
    /**
     * Submit identity verification
     * @param requestBody
     * @returns any Created
     * @throws ApiError
     */
    public static postApiIdentitySubmit(
        requestBody: {
            email?: string;
            termsAgreed?: boolean;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/identity/submit',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                401: `Unauthorized`,
            },
        });
    }
    /**
     * List identity verifications (admin)
     * @returns any OK
     * @throws ApiError
     */
    public static getApiAdminIdentityVerifications(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/admin/identity-verifications',
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * List news articles
     * @returns any OK
     * @throws ApiError
     */
    public static getApiNews(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/news',
        });
    }
    /**
     * Create news (admin)
     * @returns any Created
     * @throws ApiError
     */
    public static postApiNews(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/news',
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * Cast a vote
     * @param requestBody
     * @returns any Created
     * @throws ApiError
     */
    public static postApiVotingVote(
        requestBody: {
            billId?: number;
            vote?: 'yes' | 'no' | 'abstain';
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/voting/vote',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Bill not found`,
                409: `Already voted`,
            },
        });
    }
    /**
     * Get friends list
     * @returns any OK
     * @throws ApiError
     */
    public static getApiFriends(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/friends',
            errors: {
                401: `Unauthorized`,
            },
        });
    }
    /**
     * Get pending friend requests
     * @returns any OK
     * @throws ApiError
     */
    public static getApiFriendsRequests(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/friends/requests',
        });
    }
    /**
     * Send friend request
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static postApiFriendsRequest(
        requestBody: {
            toUserId: string;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/friends/request',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Accept friend request
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static postApiFriendsAccept(
        requestBody: {
            requestId: number;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/friends/accept',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Unfollow a user
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static deleteApiSocialUnfollow(
        requestBody: {
            followingId: string;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/social/unfollow',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Send a direct message
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static postApiSocialMessages(
        requestBody: {
            recipientId: string;
            content: string;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/social/messages',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * List conversations for current user
     * @returns any OK
     * @throws ApiError
     */
    public static getApiSocialConversations(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/social/conversations',
        });
    }
    /**
     * List recent comments for moderation
     * @returns any OK
     * @throws ApiError
     */
    public static getApiModerationCommentsRecent(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/moderation/comments/recent',
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * Remove a comment
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static deleteApiModerationComments(
        id: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/moderation/comments/{id}',
            path: {
                'id': id,
            },
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * List recent posts for moderation
     * @returns any OK
     * @throws ApiError
     */
    public static getApiModerationPostsRecent(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/moderation/posts/recent',
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * Remove a post
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static deleteApiModerationPosts(
        id: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/moderation/posts/{id}',
            path: {
                'id': id,
            },
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * Moderation summary counts
     * @returns any OK
     * @throws ApiError
     */
    public static getApiModerationSummary(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/moderation/summary',
        });
    }
    /**
     * Combined moderation dashboard (summary + recent posts/comments)
     * @param limit
     * @returns any OK
     * @throws ApiError
     */
    public static getApiAdminModerationDashboard(
        limit?: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/admin/moderation-dashboard',
            query: {
                'limit': limit,
            },
        });
    }
    /**
     * Platform summary for admin dashboard
     * @returns any OK
     * @throws ApiError
     */
    public static getApiAdminSummary(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/admin/summary',
        });
    }
}
