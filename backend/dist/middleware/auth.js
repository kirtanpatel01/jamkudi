import { createMiddleware } from 'hono/factory';
import { supabase } from '../lib/supabase.js';
/**
 * Hono authentication middleware that verifies the Supabase Bearer token
 * and attaches the authenticated user object and token to the context.
 */
export const authMiddleware = createMiddleware(async (c, next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({
            error: 'Unauthorized',
            message: 'Missing or malformed Authorization header'
        }, 401);
    }
    const token = authHeader.substring(7).trim();
    if (!token) {
        return c.json({
            error: 'Unauthorized',
            message: 'Missing access token'
        }, 401);
    }
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
        return c.json({
            error: 'Unauthorized',
            message: 'Invalid or expired access token'
        }, 401);
    }
    c.set('user', data.user);
    c.set('token', token);
    await next();
});
