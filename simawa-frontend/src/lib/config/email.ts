/**
 * Email domain configuration (no longer restricted)
 */
export const EMAIL_DOMAIN = ''

/**
 * Get email placeholder
 */
export const getEmailPlaceholder = () => 'nama@email.com'

/**
 * Validate email format (any domain allowed)
 */
export const isValidEmailDomain = (email: string): boolean => {
  return email.toLowerCase().trim().includes('@')
}

/**
 * Get email domain validation message
 */
export const getEmailDomainError = () => 'Format email tidak valid'
