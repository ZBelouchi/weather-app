import { useCallback, useEffect, useState } from 'react'

export default function useAsync(callback, dependencies = []) {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState()
    const [value, setResponse] = useState()

    const callbackMemoized = useCallback(() => {
        setLoading(true)
        setError(undefined)
        setResponse(undefined)
        callback()
            .then(setResponse)
            .catch(setError)
            .finally(() => setLoading(false))
    }, dependencies)

    useEffect(() => {
        callbackMemoized()
    }, [callbackMemoized])

    return { loading, error, value }
}

/* useAsync - simplifies promises by storing data in an object

    const { loading, error, value } = useAsync(callback, dependencies)
    
    // Callback MUST return a PROMISE; e.g.
    const { loading, error, value } = useAsync(
        () => {
            return new Promise((resolve, reject) => {
                const success = true
                setTimeout(() => {
                    success ? resolve('finished') : reject('broke')
                }, 1000)
            })
        },
        []
    )

    // or multiple promises as long as it results in returning a resolved or rejected promise; e.g.
    const { loading, error, value } = useAsync(
        () => {
            if (no data) {
                return Promise.reject(new Error(...))
            }
            return fetch(...)
                .then(...)
                .then(...)
                //NOTE: do NOT use catch statements in useAsync callbacks, the returned caught error will be used as a value instead of an error 
        },
        []
    )

    loading     // true if pending, false if resolved or rejected
    {loading ? "Loading..." : null}

    value       // returned value if resolved; undefined if rejected
    error       // returned error if rejected; undefined if resolved
*/