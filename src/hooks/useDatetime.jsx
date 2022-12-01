import { useEffect, useState } from 'react'

export default function useDatetime(exact=false) {
    const getCurrent = () => {
        let current = new Date(Date.now())
        return current
    }

    const [datetimeObject, setDatetimeObject] = useState(getCurrent())

    useEffect(() => {
        const interval = setInterval(() => setDatetimeObject(getCurrent()), 1000)
        setDatetimeObject(getCurrent())

        
        return () => {
            clearInterval(interval)
        }
    }, exact ? undefined : [])

    return [ 
        datetimeObject,
        datetimeObject.getTime(),
        datetimeObject.toUTCString()
    ]
}

/* useDatetime - simplifies Date object by storing it in state and updating it

    const { datetime, datetimeMs, datetimeString } = useDatetime(exact)

    datetime
    datetimeMs
    datetimeString

    NOTE: exact flag determines update frequency
        if false updates every second from mount but not in sync with real time
        IF true updates every millisecond, will be accurate but take more resources
*/