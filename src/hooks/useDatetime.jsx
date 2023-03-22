import { useEffect, useState } from 'react'
import dayjs from 'dayjs'                   // requires dayjs library
import Timezone from 'dayjs/plugin/timezone'
import UTC from 'dayjs/plugin/utc'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import isBetween from 'dayjs/plugin/isBetween'
import localizedFormat from 'dayjs/plugin/localizedFormat'
dayjs.extend(Timezone)
dayjs.extend(UTC)
dayjs.extend(customParseFormat)
dayjs.extend(isBetween)
dayjs.extend(localizedFormat)

export default function useDatetime(tmz, exact) {
    const [timezone, setTimezone] = useState(tmz ?? dayjs.tz.guess())
    const [datetime, setDatetime] = useState(dayjs().tz())

    useEffect(() => {
        dayjs.tz.setDefault(timezone)
    }, [])

    useEffect(() => {
        const interval = setInterval(
            () => {
                setDatetime(dayjs().tz())
            }, 
            1000
        )
        return () => {
            clearInterval(interval)
        }
    }, (exact ?? false) ? undefined : [])

    function dtChangeTz(tz=timezone) {
        dayjs.tz.setDefault(tz)
        setTimezone(tz)
        setDatetime(dayjs().tz())
    }

    function dtFormat(fstring='LLLL') {
        let d = datetime.format(fstring)
        return d
    }

    console.log(timezone);
    return {
        dt: datetime,                            // datetime object form
        dtUnix: datetime.valueOf(),              // unix timestamp form (seconds from epoch)
        dtFormat: dtFormat,                      // custom formatted string (default LLLL) (for use of extended formatting libraries without importing them)
        dtDate: datetime.format('YYYY-MM-DD'),   // formatted string for date
        dtTime: datetime.format('h:mm:ss a'),    // formatted string for time
        dtISO: datetime.toISOString(),           // formatted string in ISO format
        dtTz: timezone,                          // timezone
        dtOffset: datetime.utcOffset()/60,       // timezone offset from UTC
        dtChangeTz: dtChangeTz                   // convert to different timezone (default resets to machine timezone)
    }
}

/* useDatetime - simplifies Date object by storing it in state and updating it

    const {dt, dtUnix, dtFormat, dtDate, dtTime, dtISO, dtTz, dtOffset, dtChangeTz} = useDatetime()

    // timezone defaults to machine time, to change add a timezone value
    const {dt} = useDatetime('Europe/Berlin')
    // exact flag determines the update rate, if false it updates every second, if true every millisecond (will take more resources)
    const {dt} = useDatetime(null, true)    //NOTE: tmz must be filled in before exact (even if null)

    // real-time values
    dt
    dtUnix
    dtTz
    dtOffset

    // readable strings updated in real time
    dtDate
    dtTime
    dtISO
    dtFormat('YYYY M D')    // including method for format strings
    dtFormat('lll')         // allows use of localized strings without needing to extend the library

    // change the timezone
    dtTz                            // 'America/New_York'
    dtChangeTz('Europe/Berlin')
    dtTz                            // 'Europe/Berlin'
*/