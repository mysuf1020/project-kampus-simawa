/**
 * Formats a raw phone number string into a standardized format.
 *
 * The function removes all non-digit characters from the input,
 * extracts the first two digits as the country code, and groups
 * the remaining digits into chunks of four, separated by hyphens.
 * The formatted phone number is returned in the form: "+CC XXXX-XXXX-...".
 *
 * @param rawPhoneNumber - The input phone number as a string, possibly containing non-digit characters.
 * @returns The formatted phone number string with country code and grouped digits.
 */
export const phoneNumberFormat = (rawPhoneNumber: string) => {
  const digits = rawPhoneNumber.replace(/\D/g, '')

  if (digits.length <= 2) {
    return `+${digits}`
  }

  const countryCode = digits.slice(0, 2)
  const rest = digits.slice(2)

  const parts = []
  for (let i = 0; i < rest.length; i += 4) {
    parts.push(rest.slice(i, i + 4))
  }

  return `+${countryCode} ${parts.join('-')}`
}

export const formatNPWP = (input: string) => {
  return input.replace(/^(\d{2})(\d{3})(\d{3})(\d)(\d{3})(\d{3})$/, '$1.$2.$3.$4-$5.$6')
}

export const formatPhoneNumber = (input: string) => {
  return input.replace(/^(\d{2})(\d{3})(\d{4})(\d+)$/, '+$1 $2 $3 $4')
}

export const formatNumberOnly = (input: string) => {
  return input.replaceAll(/[^\d]/g, '')
}

export const isValidUrl = (value: string) => {
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}
