declare global {
  interface Number {
    mb(): number
    kb(): number
    gb(): number
  }
}

Number.prototype.mb = function (this: number) {
  return this * 1000000
}

Number.prototype.kb = function (this: number) {
  return this * 1000
}

Number.prototype.gb = function (this: number) {
  return this * 1000000000
}

export {}

/**
 * Humanize sizes passed in function
 * e.g: 5000 bytes = 5kb
 * 5000000 bytes = 5mb
 * 5000000000 bytes = 5gb
 */
export const humanizeSize = (byte: number) => {
  let divider = 1
  let sizeUnit = 'byte'
  if (byte / 1000000000.0 >= 1) {
    divider = 1000000000.0
    sizeUnit = 'GB'
  } else if (byte / 1000000.0 >= 1) {
    divider = 1000000.0
    sizeUnit = 'MB'
  } else if (byte / 1000.0 >= 1) {
    divider = 1000.0
    sizeUnit = 'KB'
  }
  const size = byte / divider
  const isDecimal = size % 1 !== 0
  const finalSize = isDecimal ? size.toFixed(1) : size.toString()
  return `${finalSize} ${sizeUnit}`
}
