/**
 * Email domain configuration from environment variable
 * Default: @raharja.info
 */
export const EMAIL_DOMAIN = process.env.NEXT_PUBLIC_EMAIL_DOMAIN || '@raharja.info'

/**
 * Get email placeholder (e.g., "nama@raharja.info")
 */
export const getEmailPlaceholder = () => `nama${EMAIL_DOMAIN}`

/**
 * Validate if email ends with the configured domain
 */
export const isValidEmailDomain = (email: string): boolean => {
  return email.toLowerCase().trim().endsWith(EMAIL_DOMAIN.toLowerCase())
}

/**
 * Get email domain validation message
 */
export const getEmailDomainError = () => `Wajib menggunakan email ${EMAIL_DOMAIN}`
