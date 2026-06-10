import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/**
 * Fetch the user's row from the `profiles` table.
 * Returns null when no row exists yet (user has never uploaded a custom avatar).
 * Call sites fall back to user_metadata.avatar_url (Google OAuth photo) when null.
 */
export async function getProfile(
  userId: string
): Promise<{ avatar_url: string | null } | null> {
  const { data } = await supabase
    .from('profiles')
    .select('avatar_url')
    .eq('id', userId)
    .maybeSingle()
  return data as { avatar_url: string | null } | null
}
