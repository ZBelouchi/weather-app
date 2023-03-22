import React, {useEffect, useState} from 'react'
import useAsync from './useAsync'
import useToggle from './useToggle'

export default function useAsyncCached(callback, dependencies=[], loadingValue=null) {
    const async = useAsync(callback, dependencies)
    // console.log("ASYNC: ", async);

    const [hasLoaded, toggleHasLoaded] = useToggle(false)
    const [value, setValue] = useState(loadingValue)

    useEffect(() => {
        if(!async.loading) {
            toggleHasLoaded(true)
            setValue(async.value)
        }
    }, [async])

    // console.log("VALUE: ", value);

    if (!hasLoaded) return loadingValue
    if (async.error !== undefined) return async.error
    return value
}

/* useAsyncCached - uses useAsync custom hook, but stores it's previous value during updates
i.e. caches value so it can be used during updates without the loading state setting the value back to undefined

const res = useAsyncCached(callback, dependencies=[])

res
// null on loading
// error object on error
// response data on value

//assign different value to return on loading state
const res = useAsyncCached(callback, dependencies=[], loadingValue="loading")
*/