import React, { useEffect, useState } from 'react'
import useDatetime from '../hooks/useDatetime'
import { useLocation, Link } from 'react-router-dom'

import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import isBetween from 'dayjs/plugin/isBetween'
import localizedFormat from 'dayjs/plugin/localizedFormat'
dayjs.extend(customParseFormat)
dayjs.extend(isBetween)
dayjs.extend(localizedFormat)

// import Image from './Image'
import IMAGES from '../assets/images'

export default function Weather() {
    const {dt, dtMs, dtDate, dtTime, dtOffset, dtTimezoneShift, dtFormat} = useDatetime()
    const locationState = useLocation()
    const [weatherData, setWeatherData] = useState()
    // const navigate = useNavigate()

    // redirect to select screen if no current location exists (loading to display page before select page)
    try {
        locationState.state.lat
    } catch {
        return <Link to='/' replace>error</Link>
    }

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
                            high: json.daily.temperature_2m_max[index],
                            low: json.daily.temperature_2m_min[index]
                        },
                        isNighttime: false,
                        sunrise: dayjs(json.daily.sunrise[index], 'YYYY-MM-DDTHH:mm'),
                        sunset: dayjs(json.daily.sunset[index], 'YYYY-MM-DDTHH:mm')
                    }
                })
                let hourlyData = json.hourly.time.map((hour, index) => {
                // parse data into an array of hourly weather objects

                    // TODO: this code to determine day or night can probably be condensed a lot, but it was a nightmare to get this working at all so that's a job for later
                    let times = [
                        sunset.subtract(1, 'days'),
                        sunrise,
                        sunset,
                        sunrise.add(1, 'days'),
                        sunset.add(1, 'days'),
                    ]
                    let now = dayjs(hour, 'YYYY-MM-DDTHH:mm')
                    let night = false
                    if (now.isBetween(times[0], times[1])) {
                        night = true
                    } else if (now.isBetween(times[1], times[2])) {
                        night = false
                    } else if (now.isBetween(times[2], times[3])) {
                        night = true
                    } else if (now.isBetween(times[3], times[4])) {
                        night = false
                    } else {
                        night = null
                    }

                    return {
                        time: dayjs(hour, 'YYYY-MM-DDTHH:mm'),
                        condition: json.hourly.weathercode[index],
                        temperature: json.hourly.temperature_2m[index],
                        isNighttime: night
                        // now > today's sunset and < tomorrow's sunrise
                        // LEFT OFF: getting this flag to work; it needs to compare the hourly time to the nearest sunset, problem is it only has one and so after the daily sunset date it stops working
                    }
                })
                // console.log((hourlyData));
                let hourlyForecast = hourlyData.filter((item) => {
                    // cut list to only x hours after present
                    return item.time.isAfter(local)
                }).slice(0, 24)
                // console.log((hourlyForecast));
                
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
                        timeZone: json.timezone,
                        condition: json.current_weather.weathercode,
                        temperature: {
                            current: json.current_weather.temperature,
                            high: Math.max(...hourlyTemps),
                            low: Math.min(...hourlyTemps)
                        },
                        wind: json.current_weather.windspeed,
                        sunrise: sunrise,
                        sunset: sunset,
                        isNighttime: local.isAfter(sunrise.subtract(1, 'day')) && local.isBefore(sunset),
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
        <section className="weather container">
            {/* <p>Current :{weatherData.current.localTime.format('lll')}</p> */}
            {/* <p>Offset :{weatherData.current.localTime.format('Z')}</p> */}
            {/* <p>Sunset  :{weatherData.current.sunset.format('lll')}</p> */}
            {/* <p>Sunrise :{weatherData.current.sunrise.format('lll')}</p> */}
            {/* <p>LSunrise :{weatherData.current.sunrise.subtract(1, 'day').format('lll')}</p> */}
            {/* <hr/> */}
            {/* <p>After Last Sunrise :{weatherData.current.localTime.isAfter(weatherData.current.sunrise.subtract(1, 'day')).toString()}</p> */}
            {/* <p>Before Sunset :{weatherData.current.localTime.isBefore(weatherData.current.sunset).toString()}</p> */}
            {/* <p>both true = Night</p> */}
            <WeatherBox data={weatherData.current}/>
            <section className="weather__group weather__group--daily">
                <h2 className='weather__header'>Daily</h2>
                <ul className="weather__list row">
                    {weatherData.daily.map((day, index) => <WeatherBoxMini data={day} key={weatherData.daily[index].time.format('weather-box-YYYY-MM-DD--HH:mm:ss:SSS')}/>)}
                </ul>
            </section>
            <section className="weather__group weather__group--hourly">
                <h2 className='weather__header'>Hourly</h2>
                <ul className="weather__list row">
                    {weatherData.hourly.map((hour, index) => <WeatherBoxMini data={hour} key={weatherData.hourly[index].time.format('weather-box-YYYY-MM-DD--HH:mm:ss:SSS')} isHourly/>)}
                </ul>
            </section>
        </section>
    )
}

function WeatherBox({data}) {
    const {location, condition, isNighttime, temperature, wind, localTime} = data

    return (
        <div className="weather__box weather__box--main">
            <div className="weather__location">
                <h2>{location.primary}</h2>
                <p>{location.secondary}, {location.country}</p>
                <br />
                <p>{localTime.format('ddd MMM D YYYY')}</p>
                <p>{localTime.format('hh:mm:ss a (Z)')}</p>
            </div>
            <div className="flex">
                <Condition code={condition} isNighttime={isNighttime}/>
                <ul className="weather__stats">
                    <li>{temperature.current} °F</li>
                    <li>{temperature.high} / {temperature.low}</li>
                    <li>{wind}mph</li>
                </ul>
            </div>
        </div>
    )
}

function WeatherBoxMini({data, isHourly}) {
    const {time, condition, temperature, isNighttime} = data

    return (
        <li className="weather__box weather__box--aux">
            <Condition code={condition} isNighttime={isNighttime} description={false}/>
            <ul className="weather__stats">
                <li>{time.format(isHourly ? 'LT' : 'dddd, MMMM D')}</li>
                <li>{isHourly ? `${temperature} °F` : `${temperature.high} / ${temperature.low} °F`}</li>
            </ul>
        </li>
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
        <div className="weather__condition">
            {description && <p>{CONDITIONS[code].description || `Invalid Weather Code '${code}'`}</p>}
            <div className="weather__icon">
                <img className='weather__icon--layer'
                    src={isNighttime ? IMAGES.moon : IMAGES.sun} 
                    alt="weather icon"
                />
                {CONDITIONS[code].iconLayers.map((layer, index) => {return (
                    <img src={layer} alt="weather-icon-layer" className='weather__icon--layer' key={`icon-layer-${index}`}/>
                )})}
            </div>
        </div>
    )
}