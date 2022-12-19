import { useEffect, useState } from 'react'
import dayjs from 'dayjs'                   // requires dayjs library
import Timezone from 'dayjs/plugin/timezone'
import UTC from 'dayjs/plugin/utc'
dayjs.extend(Timezone)
dayjs.extend(UTC)

export default function useDatetime(tmz=dayjs.tz.guess(), locale=null, exact=false) {

    const [datetime, setDatetime] = useState(dayjs().tz(tmz))

    useEffect(() => {
        const interval = setInterval(() => setDatetime(dayjs().tz(tmz)), 1000)

        return () => {
            clearInterval(interval)
        }
    }, exact ? undefined : [])

    return {
        dt: datetime,                                   // DayJS object
        dtMs: datetime.valueOf(),                       // Unix Timestamp
        dtDate: datetime.format('MMM D YYYY'),          // Date string 'Jan 1 2022'
        dtTime: datetime.format('H:mm:ss a'),           // Time String '10:30 am'
        dtOffset: datetime.utcOffset()/60,              // Offset from UTC
        dtTimezoneShift: function(tz) {                 // Day Object converted to another timezone
            return dayjs.tz(datetime, tz)
        }
    }
}

/* useDatetime - simplifies Date object by storing it in state and updating it

    const {dt, dtMs, dtDate, dtTime, dtOffset, dtTimezoneShift} = useDatetime()

    dt
    dtMs
    dtDate
    dtTime
    dtOffset

    dtTimezoneShift('Europe/Berlin')

    NOTE: exact flag determines update frequency
        if false updates every second from mount but not in sync with real time
        IF true updates every millisecond, will be accurate but take more resources
*/