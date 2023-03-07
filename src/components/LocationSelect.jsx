import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
dayjs.extend(localizedFormat)

export default function LocationSelect() {
    const [search, setSearch] = useState("")
    const [results, setResults] = useState([])
    const navigate = useNavigate()

    useEffect(() => {
        fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${search}&count=100`, {method: 'GET'})
            .then(response => response.json())
            .then(json => {
                setResults(json.results || [])
            })
            .catch(err => console.log(err))
    }, [search])

    return (
        // Location Component
        <section className="location container">
            <h1 className="location__title">Select Your Location</h1>

            {/* Search Bar */}
            <span className="search">
                <label htmlFor='search__label'>Search</label>
                <input className='search__box'
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </span>
            {/* Search Results */}
            <ul className="results">
                {results.map((result) => (
                    <li className='results__item row'
                        // go to Weather with location data
                        onClick={() => {navigate(
                            "/home", 
                            {state: {
                                lat: result.latitude, 
                                lon: result.longitude,
                                primary: result.name,
                                secondary: result.admin1,
                                country: result.country
                            }}
                        )
                    }}>
                        <p className='results__value results__value--name'>{result.name}</p>
                        <p className='results__value results__value--area'>{result.admin1 || 'n/a'}</p>
                        <p className='results__value results__value--area'>{result.admin2 || 'n/a'}</p>
                        <p className='results__value results__value--area'>{result.admin3 || 'n/a'}</p>
                        <p className='results__value results__value--country'>{result.country}</p>
                        <p className='results__value results__value--time'>{dayjs().tz(result.timezone).format('LTS')}</p>
                    </li>
                ))}
            </ul>
        </section>
    )
}
