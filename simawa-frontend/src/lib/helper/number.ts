export const parseDecimal = (number: string | number | undefined = '0'): number => {
  const fixed = (number || isNaN(Number(number))) ?? '0'
  if (typeof fixed === 'string') {
    return Number.parseFloat(fixed.replace(',', '.'))
  } else if (typeof fixed === 'number') {
    return Number(fixed)
  }
  return 0
}

export function isAllDigits(str: string) {
  return /^\d+$/.test(str)
}
