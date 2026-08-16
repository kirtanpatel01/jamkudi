import { Hono } from 'hono'
import { supabase, getSupabaseUserClient } from '../lib/supabase.js'
import { authMiddleware } from '../middleware/auth.js'
import { getOrCreateProfile } from '../services/profile.js'
import type { AppEnv } from '../types/env.js'

const auth = new Hono<AppEnv>()

/**
 * POST /auth/signup
 * Public endpoint to register a new user account with email and password.
 */
auth.post('/signup', async (c) => {
  try {
    const body = await c.req.json<{ email?: string; password?: string }>()
    if (!body.email || !body.password) {
      return c.json({ error: 'Bad Request', message: 'Email and password are required' }, 400)
    }

    const { data, error } = await supabase.auth.signUp({
      email: body.email,
      password: body.password
    })

    if (error || !data.user) {
      return c.json({ error: 'Auth Error', message: error?.message || 'Failed to sign up' }, 400)
    }

    let profileData = null;
    if (data.session?.access_token) {
      const userClient = getSupabaseUserClient(data.session.access_token)
      const { profile } = await getOrCreateProfile(userClient, data.user as any)
      profileData = profile
    }

    return c.json({
      user: {
        id: data.user.id,
        email: data.user.email || null
      },
      session: data.session
        ? {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token
          }
        : null,
      profile: profileData
    })
  } catch (err: any) {
    return c.json({ error: 'Internal Server Error', message: err.message }, 500)
  }
})

/**
 * POST /auth/login
 * Public endpoint to authenticate an existing user with email and password.
 */
auth.post('/login', async (c) => {
  try {
    const body = await c.req.json<{ email?: string; password?: string }>()
    if (!body.email || !body.password) {
      return c.json({ error: 'Bad Request', message: 'Email and password are required' }, 400)
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password
    })

    if (error || !data.user || !data.session) {
      return c.json({ error: 'Auth Error', message: error?.message || 'Invalid credentials' }, 401)
    }

    const userClient = getSupabaseUserClient(data.session.access_token)
    const { profile } = await getOrCreateProfile(userClient, data.user as any)

    return c.json({
      user: {
        id: data.user.id,
        email: data.user.email || null
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token
      },
      profile
    })
  } catch (err: any) {
    return c.json({ error: 'Internal Server Error', message: err.message }, 500)
  }
})

/**
 * GET /auth/me
 * Protected endpoint to retrieve current authenticated user and profile.
 */
auth.get('/me', authMiddleware, async (c) => {
  const user = c.get('user')
  const token = c.get('token')

  const userClient = getSupabaseUserClient(token)
  const { profile, error } = await getOrCreateProfile(userClient, user)

  if (error || !profile) {
    return c.json(
      {
        error: 'Internal Server Error',
        message: error?.message || 'Failed to retrieve user profile'
      },
      500
    )
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
  })
})

export default auth
