import React, { useEffect } from 'react'
import { useState } from 'react'
import useFetch from '../hooks/useFetch'
import useDatetime from '../hooks/useDatetime'

// import Image from './Image'
import IMAGES from '../assets/images'

export default function Weather() {
    const [weatherData, setWeatherData] = useState({
        location: "",
        temperature: {
            current: 0,
            high: 0,
            low: 0
        },
        condition: 0,
        wind: {
            speed: "",
            direction: ""
        },
        time: {
            lastUpdated: 0,
            sunrise: 0,
            sunset: 0,
            timeIcon: () => {}
        }
    })

    const [datetime, datetimeMs, datetimeString]  = useDatetime()


    // temp data for API
    const apiPath = `https://api.open-meteo.com/v1/forecast?latitude=39.34&longitude=-84.40&hourly=temperature_2m,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset&current_weather=true&temperature_unit=fahrenheit&windspeed_unit=ms&precipitation_unit=inch&timezone=America%2FNew_York`
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
                condition: json.current_weather.weathercode,
                wind: {
                    speed: json.current_weather.windspeed,
                    direction: json.current_weather.winddirection
                },
                time: {
                    lastUpdated: datetimeString,
                    sunrise: json.daily.sunrise[0],
                    sunset: json.daily.sunset[0],
                    timeIcon: () => {
                        let now = new Date(Date.now()) 

                        let sunrise = new Date(json.daily.sunrise[0])
                        let sunset = new Date(json.daily.sunset[0])
                        // 'this' doesn't work here for some reason :/

                        return now > sunrise && now < sunset ? IMAGES.sun : IMAGES.moon                        
                    }
                }
            })
        })
        .catch(err => console.log(err))
    }, [lat, lon])
    
    
    
    

    return (
        <div className="weather">
            {/* location */}
            <p>Location: {weatherData.location}</p>
            <br/>

            {/* temperature */}
            <p>Temp: {weatherData.temperature.current}</p>
            {/* temp high/low */}
            <p>High/Low: {weatherData.temperature.high} / {weatherData.temperature.low}</p>
            <br/>

            {/* date/time */}
            <p>Current Time: {datetimeString}</p>
            <p>Last Updated: {weatherData.time.lastUpdated}</p>
            <br/>

            <Condition code={weatherData.condition} time={weatherData.time.timeIcon()}/>
            <br/>
            
            {/* Wind Speed */}
            <p>Wind: {weatherData.wind.speed} {weatherData.wind.direction}</p>
        </div>
    )
}

function Condition({code, time}) {
    const CONDITIONS = {
        0: {
            description: "Clear Sky",
            iconLayers: []
        },
        1: {
            description: "Mainly Clear",
            iconLayers: [IMAGES.cloud]
        },
        2: {
            description: "Partly Cloudy",
            iconLayers: [IMAGES.cloud]
        },
        3: {
            description: "Overcast",
            iconLayers: [IMAGES.cloud]
        },
        45: {
            description: "Fog",
            iconLayers: [IMAGES.fog]
        },
        48: {
            description: "Depositing Rime Fog",
            iconLayers: [IMAGES.fog]
        },
        51: {
            description: "Light Drizzle",
            iconLayers: [IMAGES.cloud, IMAGES.rain]
        },
        53: {
            description: "Moderate Drizzle",
            iconLayers: [IMAGES.cloud, IMAGES.rain]
        },
        55: {
            description: "Dense Drizzle",
            iconLayers: [IMAGES.cloud, IMAGES.rain]
        },
        56: {
            description: "Light Freezing Drizzle",
            iconLayers: [IMAGES.cloud, IMAGES.hail]
        },
        57: {
            description: "Dense Freezing Drizzle",
            iconLayers: [IMAGES.cloud, IMAGES.hail]
        },
        61: {
            description: "Slight Rain",
            iconLayers: [IMAGES.cloud, IMAGES.hail]
        },
        63: {
            description: "Moderate Rain",
            iconLayers: [IMAGES.cloud, IMAGES.rain]
        },
        65: {
            description: "Heavy Rain",
            iconLayers: [IMAGES.cloud, IMAGES.rain]
        },
        66: {
            description: "Light Freezing Rain",
            iconLayers: [IMAGES.cloud, IMAGES.hail]
        },
        67: {
            description: "Heavy Freezing Rain",
            iconLayers: [IMAGES.cloud, IMAGES.hail]
        },
        71: {
            description: "Slight Snow Fall",
            iconLayers: [IMAGES.cloud, IMAGES.snow]
        },
        73: {
            description: "Moderate Snow Fall",
            iconLayers: [IMAGES.cloud, IMAGES.snow]
        },
        75: {
            description: "Heavy Snow Fall",
            iconLayers: [IMAGES.cloud, IMAGES.snow]
        },
        77: {
            description: "Snow Grains",
            iconLayers: [IMAGES.cloud, IMAGES.snow]
        },
        80: {
            description: "Slight Rain Showers",
            iconLayers: [IMAGES.cloud, IMAGES.rain]
        },
        81: {
            description: "Moderate Rain Showers",
            iconLayers: [IMAGES.cloud, IMAGES.rain]
        },
        82: {
            description: "Violent Rain Showers",
            iconLayers: [IMAGES.cloud, IMAGES.rain]
        },
        85: {
            description: "Slight Snow Showers",
            iconLayers: [IMAGES.cloud, IMAGES.snow]
        },
        86: {
            description: "Heavy Snow Showers",
            iconLayers: [IMAGES.cloud, IMAGES.snow]
        },
        95: {
            description: "Thunderstorm",
            iconLayers: [IMAGES.darkcloud, IMAGES.lightning]
        },
        96: {
            description: "Thunderstorm With Slight Hail",
            iconLayers: [IMAGES.darkcloud, IMAGES.lightning, IMAGES.hail]
        },
        99: {
            description: "Thunderstorm With Heavy Hail",
            iconLayers: [IMAGES.darkcloud, IMAGES.lightning, IMAGES.hail]
        },
    }
    
    return (
        <div className="weather__condition">
            {/* Weather */}
            <p>Weather: {CONDITIONS[code].description || `Invalid Weather Code '${code}'`}</p>
            <div className="weather__icon">
                <img src={time} alt="" className='weather__icon--layer'/>
                {
                    CONDITIONS[code].iconLayers.map((layer) => {return <img src={layer} alt="weather-icon-layer"  className='weather__icon--layer'/>})
                }
            </div>
        </div>
    )
}