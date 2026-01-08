/**
 * Converts a number to a currency string in the format of Rpx,xxx,xxx.xx
 * @param value The number to convert
 * @param decimals The number of decimal places (default: 2)
 * @return The formatted currency string
 */
export function formatCurrency(
  amount: number | string,
  decimalPlaces: number = 2,
): string {
  let numberAmount: number

  // 1. Input Validation and Conversion
  // Check if the input is a valid number or a numeric string.
  if (typeof amount === 'string') {
    // Remove non-numeric characters (except for the decimal comma) and try to convert to a number
    const sanitizedAmount = amount.replace(/[^\d,-]/g, '').replace(',', '.') // important to replace comma with dot
    numberAmount = Number(sanitizedAmount)
    if (isNaN(numberAmount)) {
      return 'Rp 0.00' // Return default for invalid input
    }
  } else if (typeof amount === 'number') {
    numberAmount = amount
  } else {
    return 'Rp 0.00'
  }

  // 2. Formatting Logic
  const negative = numberAmount < 0
  const absoluteValue = Math.abs(numberAmount)

  // Use toFixed to control decimal places.
  const formattedNumber = absoluteValue.toFixed(decimalPlaces)

  // Split the number into integer and decimal parts.
  const [integerPart, decimalPart] = formattedNumber.split('.')

  // Use regular expression for grouping thousands with a dot.
  const integerFormatted = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')

  // Combine the integer and decimal parts with "Rp" and handle negative sign
  let result = `Rp ${integerFormatted}`
  if (decimalPlaces > 0) {
    result += `,${decimalPart}`
  }
  return negative ? `-${result}` : result
}
