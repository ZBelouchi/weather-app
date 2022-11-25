import useAsync from './useAsync'    // requires useAsync Custom Hook

const DEFAULT_OPTIONS = {
    headers: { "Content-Type": "application/json" },
}

export default function useFetch(url, options = {}, dependencies = []) {
    return useAsync(() => {
        return fetch(url, { ...DEFAULT_OPTIONS, ...options }).then(res => {
            if (res.ok) return res.json()
            return res.json().then(json => Promise.reject(json))
        })
    }, dependencies)
}

/* useFetch - runs fetch() using the useAsync custom hook and returns in the same object format
    const { loading, error, value } = useFetch(url, {fetchOptions}, [dependencies])

    loading
    error
    value
*/