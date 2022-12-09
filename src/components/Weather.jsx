import React, { useEffect } from 'react'
import { useState } from 'react'
import useFetch from '../hooks/useFetch'
import useDatetime from '../hooks/useDatetime'
import { useLocation } from 'react-router-dom'

// import Image from './Image'
import IMAGES from '../assets/images'

function WeatherOLD() {
    const [weatherData, setWeatherData] = useState({
        location: {
            lat: "",
            lon: "",
            name: ""
        },
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
    
    
    
    
    useEffect(() => {
        fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${location.state.lat.toString()}&longitude=${location.state.lon.toString()}&hourly=temperature_2m,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset&current_weather=true&temperature_unit=fahrenheit&windspeed_unit=ms&precipitation_unit=inch&timezone=America%2FNew_York`,
            {method: 'GET'}
        )
        .then(response => response.json())
        .then(json => {
            const twentyFourTemp = json.hourly.temperature_2m.slice(0, 24)
            
            setWeatherData({
                location: {
                    lat: location.state.lat,
                    lon: location.state.lon,
                    name: `${location.state.name}, ${location.state.area}`
                },
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
    }, [datetime])
}

export default function Weather() {
    const locationState = useLocation()
    const [datetime, datetimeMs, datetimeString, datetimeOffset]  = useDatetime()
    const [weatherData, setWeatherData] = useState()

    let args = [
        `latitude=${locationState.state.lat.toString()}`,
        `longitude=${locationState.state.lon.toString()}`,
        `hourly=temperature_2m,weathercode`,
        `daily=weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset`,
        `current_weather=true`,
        `timezone=auto`,
        `temperature_unit=fahrenheit`,
        `windspeed_unit=mph`,
        `precipitation_unit=inch`,
        `timezone=auto`,
    ]
    let apiPath = "https://api.open-meteo.com/v1/forecast?" + args.join("&")

    useEffect(() => {
        fetch(apiPath, {method: 'GET'})
            .then(response => response.json())
            .then(json => {
                console.log(json)

                let sunrise = new Date(json.daily.sunrise[0])
                let sunset = new Date(json.daily.sunset[0])
                // TODO get accurate local time, not just hourly approximation
                let local = new Date(Date.parse(json.current_weather.time))

                let hourlyTemps = json.hourly.temperature_2m.map((temp, index) => {
                // parse data and make list of all hours with time and temp
                    return [new Date(json.hourly.time[index]), temp]
                }).filter((item) => {
                // filter out times that aren't for current day
                    return item[0].toDateString() === local.toDateString()
                }).map((item) => {
                // reduce items to only temp now that time isn't needed
                    return item[1]
                })

                setWeatherData({
                    location: {
                        primary: locationState.state.primary,
                        secondary: locationState.state.secondary,
                        country: locationState.state.country
                    },
                    condition: json.current_weather.weathercode,
                    temperature: {
                        current: json.current_weather.temperature,
                        high: Math.max(...hourlyTemps),
                        low: Math.min(...hourlyTemps)
                    },
                    wind: json.current_weather.windspeed,
                    sunrise: sunrise,
                    sunset: sunset,
                    isNighttime: local < sunrise,
                    localTime: local
                })
            })
            .catch(err => console.log(err))
    }, [datetime])

    // temporary fix to prevent it from trying to render with undefined data
    // works but I should find a more elegant solution later
    try {
        weatherData.location
    } catch {
        return
    }

    return (
        <div className="weather">
            <WeatherBox 
                location={weatherData.location} 
                condition={weatherData.condition} 
                isNighttime={weatherData.isNighttime}
                temperature={weatherData.temperature} 
                wind={weatherData.wind}
            />
        </div>
    )
}

function WeatherBox({location, condition, isNighttime, temperature, wind}) {
    
    return (
        <div className="weather__box">
            <div className="weather__stat weather__stat--location">
                <h2>{location.primary}</h2>
                <p>{location.secondary}, {location.country}</p>
            </div>
            <div className="row">
                <div className="">
                    <div className="weather__stat weather__stat--condition">
                        <Condition code={condition} isNighttime={isNighttime}/>
                    </div>
                </div>
                <div className="">
                    <div className="weather__stat weather__stat--temperature">
                        <p>{temperature.current} °F</p>
                        <p>{temperature.high} / {temperature.low}</p>
                    </div>
                    <div className="weather__stat weather__stat--wind">
                        <p>{wind}mph</p>
                    </div>
                </div>
            </div>
        </div>
    )
}


function Condition({code, isNighttime}) {
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
        <>
            <div className="weather__icon">
                <img src={isNighttime ? IMAGES.moon : IMAGES.sun} alt="" className='weather__icon--layer'/>
                {
                    CONDITIONS[code].iconLayers.map((layer) => {return <img src={layer} alt="weather-icon-layer"  className='weather__icon--layer'/>})
                }
            </div>
            <p>{CONDITIONS[code].description || `Invalid Weather Code '${code}'`}</p>
        </>
    )
}






/* location */
{/* <p>Location: {weatherData.location.name}</p>
<p>Latitude: {weatherData.location.lat}</p>
<p>Longitude: {weatherData.location.lon}</p>
<br/> */}

/* temperature */
{/* <p>Temp: {weatherData.temperature.current}</p> */}
/* temp high/low */
{/* <p>High/Low: {weatherData.temperature.high} / {weatherData.temperature.low}</p>
<br/> */}

/* date/time */
{/* <p>Current Time: {datetimeString}</p> */}
/* <p>Last Updated: {weatherData.time.lastUpdated}</p> */
{/* <br/> */}

{/* <Condition code={weatherData.condition} time={weatherData.time.timeIcon()}/> */}
{/* <br/> */}

/* Wind Speed */
{/* <p>Wind: {weatherData.wind.speed} {weatherData.wind.direction}</p> */}