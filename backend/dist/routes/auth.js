import { Hono } from 'hono';
import { getSupabaseUserClient } from '../lib/supabase.js';
import { authMiddleware } from '../middleware/auth.js';
import { getOrCreateProfile } from '../services/profile.js';
const auth = new Hono();
auth.use('*', authMiddleware);
auth.get('/me', async (c) => {
    const user = c.get('user');
    const token = c.get('token');
    const userClient = getSupabaseUserClient(token);
    const { profile, error } = await getOrCreateProfile(userClient, user);
    if (error || !profile) {
        return c.json({
            error: 'Internal Server Error',
            message: error?.message || 'Failed to retrieve user profile'
        }, 500);
    }
    return c.json({
        user: {
            id: user.id,
            email: user.email || null
        },
        profile: {
            id: profile.id,
            username: profile.username,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
            bio: profile.bio,
            favorite_genres: profile.favorite_genres || [],
            favorite_artists: profile.favorite_artists || [],
            onboarding_completed: profile.onboarding_completed ?? false
        }
    });
});
export default auth;
