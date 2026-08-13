import { z } from 'zod';
export const updateProfileSchema = z
    .object({
    username: z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username cannot exceed 30 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
        .optional(),
    display_name: z
        .string()
        .max(50, 'Display name cannot exceed 50 characters')
        .optional(),
    avatar_url: z
        .string()
        .url('Avatar URL must be a valid URL')
        .or(z.string().length(0))
        .optional(),
    bio: z.string().max(250, 'Bio cannot exceed 250 characters').optional()
})
    .strict();
/**
 * Retrieves the profile for the given user. If no profile exists,
 * automatically creates a default profile safely.
 */
export async function getOrCreateProfile(client, user) {
    const { data: existingProfile, error: fetchError } = await client
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
    if (fetchError) {
        return { profile: null, error: new Error(fetchError.message) };
    }
    if (existingProfile) {
        return { profile: existingProfile, error: null };
    }
    // Derive initial username from metadata or email
    let rawUsername = user.user_metadata?.username ||
        user.email?.split('@')[0] ||
        `user_${user.id.slice(0, 8)}`;
    let cleanUsername = rawUsername
        .replace(/[^a-zA-Z0-9_]/g, '_')
        .toLowerCase()
        .slice(0, 30);
    if (cleanUsername.length < 3) {
        cleanUsername = `user_${cleanUsername}_${user.id.slice(0, 4)}`;
    }
    const initialDisplayName = user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        cleanUsername;
    const newProfilePayload = {
        id: user.id,
        username: cleanUsername,
        display_name: initialDisplayName,
        avatar_url: user.user_metadata?.avatar_url || null,
        bio: null
    };
    const { data: createdProfile, error: insertError } = await client
        .from('profiles')
        .insert(newProfilePayload)
        .select('*')
        .single();
    if (insertError) {
        // If username collision occurs, retry with a unique suffix
        if (insertError.code === '23505' || insertError.message.includes('unique')) {
            const fallbackUsername = `${cleanUsername.slice(0, 20)}_${Math.floor(1000 + Math.random() * 9000)}`;
            newProfilePayload.username = fallbackUsername;
            const { data: retryProfile, error: retryError } = await client
                .from('profiles')
                .insert(newProfilePayload)
                .select('*')
                .single();
            if (retryError) {
                return { profile: null, error: new Error(retryError.message) };
            }
            return { profile: retryProfile, error: null };
        }
        return { profile: null, error: new Error(insertError.message) };
    }
    return { profile: createdProfile, error: null };
}
/**
 * Updates an existing user profile with validated input.
 */
export async function updateProfile(client, userId, updates) {
    const payload = {
        ...updates,
        updated_at: new Date().toISOString()
    };
    const { data: updatedProfile, error } = await client
        .from('profiles')
        .update(payload)
        .eq('id', userId)
        .select('*')
        .single();
    if (error) {
        if (error.code === '23505' || error.message.toLowerCase().includes('unique')) {
            return { profile: null, isDuplicateUsername: true, error: new Error('Username is already taken') };
        }
        return { profile: null, error: new Error(error.message) };
    }
    return { profile: updatedProfile, error: null };
}
