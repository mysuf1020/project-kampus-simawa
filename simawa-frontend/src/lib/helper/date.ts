import dayjs from './dayjs'

export const DATE_FORMAT = 'DD MMM YYYY, HH:mm'

export const minutesToDays = (seconds: number): string => {
  if (seconds < 0) {
    return '0 day(s) 0 hour(s) 0 minute(s)'
  }

  const timeDuration = dayjs.duration(seconds, 'seconds')

  const days = Math.floor(timeDuration.asDays())

  const hours = timeDuration.hours()

  const minutes = timeDuration.minutes()

  return `${days} day(s) ${hours} hour(s) ${minutes} minute(s)`
}
