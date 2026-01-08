import DayJs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import duration from 'dayjs/plugin/duration'
import relativeTime from 'dayjs/plugin/relativeTime'

DayJs.extend(duration)
DayJs.extend(relativeTime)
DayJs.extend(customParseFormat)
DayJs.locale('en')

const dayjs = DayJs

export default dayjs
