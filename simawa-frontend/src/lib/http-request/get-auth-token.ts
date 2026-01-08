'use server'

/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from '@/lib/auth' // <-- Import auth from your Auth.js config file

/**
 * Retrieves the authentication token from the current Auth.js v5 session.
 * This function is designed to be used on the server (Server Components, Route Handlers, Server Actions).
 * It uses the auth() function from next-auth.
 * @returns {Promise<string | null>} The access token from the session, or null if not found.
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    const session = await auth() // Get the server-side session
    // IMPORTANT: The path to your token depends on your session and jwt callbacks in auth.ts.
    // You might have added the token to the session object like this: `session.accessToken`.
    // Adjust the line below to match the exact structure of YOUR session object.
    const token = (session?.user as any)?.access_token

    if (token && typeof token === 'string') {
      return token
    }
    // This warning is helpful for debugging if the token isn't where you expect it.
    console.warn(
      'getAuthToken: Token not found in session object or it was not a string.',
    )
    return null
  } catch (error) {
    // This can happen if the session is invalid, cookies are missing, or auth() is used improperly.
    console.error('Error retrieving auth session in getAuthToken:', error)
    return null
  }
}
