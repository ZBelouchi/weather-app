import React, { useEffect } from 'react'
import { useState } from 'react'
import useFetch from '../hooks/useFetch'

export default function Weather() {
    const [weatherData, setWeatherData] = useState({
        location: "",
        temperature: {
            current: 0,
            high: 0,
            low: 0
        },
        datetime: 0,
        weather: {
            condition: "",
            icon: ""
        },
        wind: {
            speed: "",
            direction: ""
        }
    })

    const conditions = {
        0: {
            description: "Clear Sky",
            icon: {}
        },
        1: {
            description: "Mainly Clear",
            icon: {}
        },
        2: {
            description: "Partly Cloudy",
            icon: {}
        },
        3: {
            description: "Overcast",
            icon: {}
        },
        45: {
            description: "Fog",
            icon: {}
        },
        48: {
            description: "Depositing Rime Fog",
            icon: {}
        },
        51: {
            description: "Light Drizzle",
            icon: {}
        },
        53: {
            description: "Moderate Drizzle",
            icon: {}
        },
        55: {
            description: "Dense Drizzle",
            icon: {}
        },
        56: {
            description: "Light Freezing Drizzle",
            icon: {}
        },
        57: {
            description: "Dense Freezing Drizzle",
            icon: {}
        },
        61: {
            description: "Slight Rain",
            icon: {}
        },
        63: {
            description: "Moderate Rain",
            icon: {}
        },
        65: {
            description: "Heavy Rain",
            icon: {}
        },
        66: {
            description: "Light Freezing Rain",
            icon: {}
        },
        67: {
            description: "Heavy Freezing Rain",
            icon: {}
        },
        71: {
            description: "Slight Snow Fall",
            icon: {}
        },
        73: {
            description: "Moderate Snow Fall",
            icon: {}
        },
        75: {
            description: "Heavy Snow Fall",
            icon: {}
        },
        77: {
            description: "Snow Grains",
            icon: {}
        },
        80: {
            description: "Slight Rain Showers",
            icon: {}
        },
        81: {
            description: "Moderate Rain Showers",
            icon: {}
        },
        82: {
            description: "Violent Rain Showers",
            icon: {}
        },
        85: {
            description: "Slight Snow Showers",
            icon: {}
        },
        86: {
            description: "Heavy Snow Showers",
            icon: {}
        },
        95: {
            description: "Thunderstorm",
            icon: {}
        },
        96: {
            description: "Thunderstorm With Slight Hail",
            icon: {}
        },
        99: {
            description: "Thunderstorm With Heavy Hail",
            icon: {}
        },
    }


    // temp data for API
    const apiPath = `https://api.open-meteo.com/v1/forecast?latitude=39.34&longitude=-84.40&hourly=temperature_2m,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min&current_weather=true&temperature_unit=fahrenheit&windspeed_unit=ms&precipitation_unit=inch&timezone=America%2FNew_York`
    const lat = 39.34
    const lon = -84.40
    const loc = "Monroe"
    const date = "2022-11-23"

    // useEffect to prevent infinite loop of api calls
    useEffect(() => {
        fetch(apiPath, {method: 'GET'})
        .then(response => response.json())
        .then(json => {
            const twentyFourTemp = json.hourly.temperature_2m.slice(0, 24)

            setWeatherData({
                location: loc,
                temperature: {
                    current: json.current_weather.temperature,
                    high: Math.max(...twentyFourTemp),
                    low: Math.min(...twentyFourTemp)
                },
                datetime: json.current_weather.time,
                weather: {
                    condition: conditions[json.current_weather.weathercode].description || `Invalid Weather Code '${json.current_weather.weathercode}'`,
                    icon: ""
                },
                wind: {
                    speed: json.current_weather.windspeed,
                    direction: json.current_weather.winddirection
                }
            })
        })
        .catch(err => console.log(err))
    }, [lat, lon])
    
    
    
    

    return (
        <div className="weather">
            {/* location */}
            <p>Location: {weatherData.location}</p>

            {/* temperature */}
            <p>Temp: {weatherData.temperature.current}</p>
            {/* temp high/low */}
            <p>High/Low: {weatherData.temperature.high} / {weatherData.temperature.low}</p>

            {/* date/time */}
            <p>Time: {weatherData.datetime}</p>

            {/* Weather */}
            <p>Weather: {weatherData.weather.condition}</p>
            {/* <img src={require(weatherData.weather.icon)} alt="weather icon" /> */}

            {/* Wind Speed */}
            <p>Wind: {weatherData.wind.speed} {weatherData.wind.direction}</p>
        </div>
    )
}
