import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

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
        <div className="location-select">
            <label>Search</label>
            <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
            />

            <div className="search__list">
                {
                    results.map((result) => (
                        <div 
                            className='search__item'
                            onClick={() => {navigate("/home", {state: {
                                lat: result.latitude, 
                                lon: result.longitude,
                                primary: result.name,
                                secondary: result.admin1,
                                country: result.country
                            }})}}
                        >
                            <p>{result.name}</p>
                            <p>{result.admin3}</p>
                            <p>{result.admin1}</p>
                            <p>{result.country}</p>
                        </div>
                    ))
                }
            </div>
        </div>
    )
}
