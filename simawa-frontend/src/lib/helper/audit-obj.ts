import { ChangedData } from '../models/common'

const compareChangedData = <T extends Record<string, unknown>>(
  prev: T,
  current: T,
  keys: string[],
): ChangedData[] => {
  const results: ChangedData[] = []

  for (const key of keys) {
    let prevValue = Object(prev)[key]
    let currentValue = Object(current)[key]

    if (!(key in prev) || !(key in current)) {
      continue
    }

    if (
      (typeof prevValue === 'string' ||
        typeof prevValue === 'boolean' ||
        typeof prevValue === 'number' ||
        prevValue === null) &&
      (typeof currentValue === 'string' ||
        typeof currentValue === 'boolean' ||
        typeof currentValue === 'number' ||
        currentValue === null)
    ) {
      if (prevValue === null) {
        prevValue = ''
      }

      if (currentValue === null) {
        currentValue = ''
      }

      if (prevValue !== currentValue) {
        results.push({
          key,
          old_value: prevValue.toString(),
          new_value: currentValue.toString(),
        })
      }
    }
  }

  return results
}

export default compareChangedData
