import { Hono } from 'hono';
import { getSupabaseUserClient } from '../lib/supabase.js';
import { authMiddleware } from '../middleware/auth.js';
import { getOrCreateProfile, updateProfile, updateProfileSchema } from '../services/profile.js';
const profile = new Hono();
profile.use('*', authMiddleware);
/**
 * GET /profile
 * Retrieves the current authenticated user's profile.
 */
profile.get('/', async (c) => {
    const user = c.get('user');
    const token = c.get('token');
    const userClient = getSupabaseUserClient(token);
    const { profile: userProfile, error } = await getOrCreateProfile(userClient, user);
    if (error || !userProfile) {
        return c.json({
            error: 'Internal Server Error',
            message: error?.message || 'Failed to fetch profile'
        }, 500);
    }
    return c.json({
        profile: {
            id: userProfile.id,
            username: userProfile.username,
            display_name: userProfile.display_name,
            avatar_url: userProfile.avatar_url,
            bio: userProfile.bio,
            favorite_genres: userProfile.favorite_genres || [],
            favorite_artists: userProfile.favorite_artists || [],
            onboarding_completed: userProfile.onboarding_completed ?? false
        }
    });
});
/**
 * PATCH /profile
 * Updates allowed profile fields (username, display_name, avatar_url, bio) for the authenticated user.
 */
profile.patch('/', async (c) => {
    const user = c.get('user');
    const token = c.get('token');
    let body;
    try {
        body = await c.req.json();
    }
    catch {
        return c.json({
            error: 'Bad Request',
            message: 'Invalid JSON request body'
        }, 400);
    }
    const parseResult = updateProfileSchema.safeParse(body);
    if (!parseResult.success) {
        return c.json({
            error: 'Bad Request',
            message: 'Validation failed',
            details: parseResult.error.flatten().fieldErrors
        }, 400);
    }
    const updates = parseResult.data;
    if (Object.keys(updates).length === 0) {
        return c.json({
            error: 'Bad Request',
            message: 'No valid fields provided for update'
        }, 400);
    }
    const userClient = getSupabaseUserClient(token);
    const { profile: updatedProfile, isDuplicateUsername, error } = await updateProfile(userClient, user.id, updates);
    if (isDuplicateUsername) {
        return c.json({
            error: 'Conflict',
            message: 'Username is already taken'
        }, 409);
    }
    if (error || !updatedProfile) {
        return c.json({
            error: 'Internal Server Error',
            message: error?.message || 'Failed to update profile'
        }, 500);
    }
    return c.json({
        profile: {
            id: updatedProfile.id,
            username: updatedProfile.username,
            display_name: updatedProfile.display_name,
            avatar_url: updatedProfile.avatar_url,
            bio: updatedProfile.bio,
            favorite_genres: updatedProfile.favorite_genres || [],
            favorite_artists: updatedProfile.favorite_artists || [],
            onboarding_completed: updatedProfile.onboarding_completed ?? false
        }
    });
});
export default profile;
