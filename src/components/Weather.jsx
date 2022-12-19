import React, { useEffect, useState } from 'react'
import useDatetime from '../hooks/useDatetime'
import { useLocation } from 'react-router-dom'

import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
dayjs.extend(customParseFormat)

// import Image from './Image'
import IMAGES from '../assets/images'

export default function Weather() {
    const {dt, dtMs, dtDate, dtTime, dtOffset, dtTimezoneShift} = useDatetime()
    const locationState = useLocation()
    const [weatherData, setWeatherData] = useState(null)

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
                // console.log(json)

                let sunrise = dayjs(json.daily.sunrise[0], 'YYYY-MM-DDTHH:mm')
                let sunset = dayjs(json.daily.sunset[0], 'YYYY-MM-DDTHH:mm')
                let local = dtTimezoneShift(json.timezone)
                
                let dailyData = json.daily.time.map((day, index) => {
                // parse data into an array of daily weather objects
                    return {
                        time: dayjs(day, 'YYYY-MM-DD'),
                        condition: json.daily.weathercode[index],
                        temperature: {
                            high: json.daily.temperature_2m_min[index],
                            low: json.daily.temperature_2m_max[index]
                        },
                        isNighttime: false,
                        sunrise: json.daily.sunrise[index],
                        sunset: json.daily.sunset[index]
                    }
                })

                let hourlyData = json.hourly.time.map((hour, index) => {
                // parse data into an array of hourly weather objects
                    return {
                        time: dayjs(hour, 'YYYY-MM-DDTHH:mm'),
                        condition: json.hourly.weathercode[index],
                        temperature: json.hourly.temperature_2m[index],
                        isNighttime: true // LEFT OFF: getting this flag to work; it needs to compare the hourly time to the nearest sunset, problem is it only has one and so after the daily sunset date it stops working
                    }
                })
                let hourlyForecast = hourlyData.filter((item) => {
                    // cut list to only x hours after present
                    return item.time > local
                }).slice(0, 12)
                
                let hourlyTemps = hourlyData.filter((item) => {
                    // filter out times that aren't for current day
                    return item.time.format('YYYY-MM-DD') === local.format('YYYY-MM-DD')    //NOTE: isSame method decided it didn't wanna be accurate to so I'm brute forcing it; clean up later
                }).map((item) => {
                    // reduce items to only temp now that time isn't needed
                    return item.temperature
                })
                
                setWeatherData({
                    current: {
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
                    },
                    hourly: hourlyForecast,
                    daily: dailyData
                })
            })
            .catch(err => console.log(err))
    }, [dt])

    // temporary fix to prevent it from trying to render with undefined data
    // works but I should find a more elegant solution later
    try {
        weatherData.current
    } catch {
        return
    }

    return (
        <div className="weather">
            <WeatherBox data={weatherData.current}/>
            <div className="row">
                <div className="weather__hourly">
                    <h2>Hourly</h2>
                    {weatherData.hourly.map((hour) => <WeatherBoxMini data={hour}/>)}
                </div>
                <div className="weather__daily">
                    <h2>Daily</h2>
                    {weatherData.daily.map((day) => <WeatherBoxMini data={day}/>)}
                </div>
            </div>
        </div>
    )
}

function WeatherBox({data}) {
    const {location, condition, isNighttime, temperature, wind} = data

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

function WeatherBoxMini({data}) {
    const {time, condition, temperature, isNighttime} = data

    return (
        <div className="weather__box weather__box--mini">
            <div className="weather__stat weather__stat--condition">
                <Condition code={condition} isNighttime={isNighttime} description={false}/>
            </div>
            <div className="weather__stat weather__stat--temperature">
                {
                    typeof temperature == "number" ? 
                        <p>{temperature} °F</p> : 
                        <p>{temperature.high} / {temperature.low} °F</p>
                }
            </div>
            <p>{time.toString()} {isNighttime.toString()}</p>
        </div>
    )
}

function Condition({code, isNighttime, description=true}) {
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
            {description && <p>{CONDITIONS[code].description || `Invalid Weather Code '${code}'`}</p>}
        </>
    )
}