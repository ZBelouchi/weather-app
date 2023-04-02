import React, { useEffect, useState, useRef } from "react"
import dayjs from "dayjs"

import useToggle from "../hooks/useToggle"
import useArray from "../hooks/useArray"
import useDatetime from "../hooks/useDatetime"
import useAsyncCached from "../hooks/useAsyncCached"

import Tabs from "./Tabs"
import Modal from "./Modal"

import IMAGES from '../assets/images'

export default function App() {
    const {dt, dtTz, dtTime, dtDate, dtOffset, dtFormat, dtChangeTz} = useDatetime()
    const sunTimes = useRef({rise: undefined, set: undefined})
    const [skyClass, setSkyClass] = useState('day')
    const [modifyModal, toggleModifyModal] = useToggle(false)
    const [addModal, toggleAddModal] = useToggle(false)
    const [activeMain, setActiveMain] = useState(0)
    const [activeGroups, setActiveGroups] = useState(null)
    const [activeModify, setActiveModify] = useState(null)

    const {array: locationData, set: setLocationData, update: updateLocationData, remove: removeLocationData, push: pushLocationData} = useArray([{},{},{}])
    // const {array: locationData, set: setLocationData, update: updateLocationData, remove: removeLocationData, push: pushLocationData} = useArray([
    //     {
    //         lat: 39.44034,
    //         lon: -84.36216,
    //         timezone: "America/New_York",
    //         name: "Gooberville",
    //         country: "United States",
    //         admin: ['Somewhere', 'Here', 'A Township'],
    //     },
    //     {
    //         lat:  44.91656,
    //         lon: 7.46719,
    //         timezone: "Europe/Rome",
    //         name: "Skf Industrie S.P.A.",
    //         country: "Italy",
    //         admin: ['Piedmont', 'Turin', 'Airasca'],
    //     },
    //     {
    //         // lat: 3.07014,
    //         // lon: 27.48309,
    //         // timezone: "Africa/Lubumbashi",
    //         // name: "We",
    //         // country: "DR Congo",
    //         // admin: ['Bas-Uele', 'Poko'],
    //     }
    // ])
    const weatherData = useAsyncCached(
        () => {
            if (JSON.stringify(locationData) === "[{},{},{}]") {
                return Promise.reject(new Error(`Coordinates not available in slot ${activeMain}`))
            }

            const url = "https://api.open-meteo.com/v1/forecast?" + [
                `latitude=${locationData[activeMain].lat}`,
                `longitude=${locationData[activeMain].lon}`,
                `hourly=`+[
                    `temperature_2m`,
                    `weathercode`,
                    `relativehumidity_2m`,
                    `precipitation_probability`,
                    `uv_index`
                ].join(','),
                `daily=`+[
                    `weathercode`,
                    `temperature_2m_max`,
                    `temperature_2m_min`,
                    `sunrise,sunset`
                ].join(','),
                `current_weather=true`,
                `timezone=auto`,
                `temperature_unit=fahrenheit`,
                `windspeed_unit=mph`,
                `precipitation_unit=inch`,
                `timezone=auto`,
                `start_date=${dt.format('YYYY-MM-DD')}`,
                `end_date=${dt.add(7, "days").format('YYYY-MM-DD')}`,
            ].join("&")
            
            return fetch(url, {method: 'GET'})
                .then(res => res.json())
                .then(json => {
                    console.log("made call to forecast API");
                    // console.log(json)

                    let sunrises = json.daily.sunrise
                    sunTimes.current.rise = dayjs(sunrises[0], "YYYY-MM-DDTHH:mm").tz(dtTz, true)
                    
                    let sunsets = json.daily.sunset
                    sunTimes.current.set = dayjs(sunsets[0], "YYYY-MM-DDTHH:mm").tz(dtTz, true)

                    let hourlyData = json.hourly.time.map((hour, index) => {
                        let sunIndex = sunrises.map(
                            time => time.slice(0,10)
                        ).indexOf(
                            hour.slice(0,10)
                        )
                        return {
                            hour: hour.slice(11, 16),
                            dtObj: dayjs(hour, 'YYYY-MM-DDTHH:mm').tz(dtTz, true),
                            condition: json.hourly.weathercode[index],
                            temperature: json.hourly.temperature_2m[index],
                            humidity: json.hourly.relativehumidity_2m[index],
                            precipitation: json.hourly.precipitation_probability[index],
                            uvIndex: json.hourly.uv_index[index], 
                            sunrise: dayjs(sunrises[sunIndex], "YYYY-MM-DDTHH:mm").tz(dtTz, true),
                            sunset: dayjs(sunsets[sunIndex], "YYYY-MM-DDTHH:mm").tz(dtTz, true),
                        }
                    })

                    // get high and low temperatures 
                    let hourlyTemps = hourlyData.slice(0, 24).map((hour) => {return hour.temperature})
                    let [tempMax, tempMin] = [Math.max(...hourlyTemps), Math.min(...hourlyTemps)]

                    // get wind direction from degrees
                    let degree = json.current_weather.winddirection
                    let directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
                    let index = Math.round(((degree %= 360) < 0 ? degree + 360 : degree) / 45) % 8;
                    let windDirection = directions[index];

                    // return {main: json}
                    return {
                        main: {
                            timeZone: json.timezone,
                            condition: json.current_weather.weathercode,
                            temperature: {
                                current: json.current_weather.temperature,
                                high: tempMax,
                                low: tempMin
                            },
                            wind: {
                                speed: json.current_weather.windspeed,
                                direction: windDirection
                            },
                            humidity: 0,        // new
                            uvIndex: 0,         // new
                            precipitation: 0,   // new
                            dtObj: dt,
                            sunrise: dayjs(sunrises[0], "YYYY-MM-DDTHH:mm").tz(dtTz, true),
                            sunset: dayjs(sunsets[0], "YYYY-MM-DDTHH:mm").tz(dtTz, true),
                        },
                        daily: json.daily.time.map((day, index) => {
                            return {
                                day: day,
                                dtObj: dayjs(day, 'YYYY-MM-DD'),
                                temperature : {
                                    high: json.daily.temperature_2m_max[index],
                                    low: json.daily.temperature_2m_min[index]
                                },
                                condition: json.current_weather.weathercode,
                                sunrise: dayjs(sunrises[index], "YYYY-MM-DDTHH:mm").tz(dtTz, true),
                                sunset: dayjs(sunsets[index], "YYYY-MM-DDTHH:mm").tz(dtTz, true)
                            }
                        }).slice(1),
                        hourly: hourlyData
                    }
                })
        },
        // [locationData, activeMain]
        [locationData, activeMain, dt]
    )

    // bring up add location modal if no locations are set
    useEffect(() => {
        if (JSON.stringify([...locationData]) === "[{},{},{}]") {
            toggleAddModal(true)
        }
    }, [])
    // change useDatetime timezone when needed
    useEffect(() => {
        dtChangeTz(locationData[activeMain].timezone)
    }, [locationData, activeMain])
    // update background sky color to match time/sun position
    useEffect(() => {
        if (sunTimes.current.rise === undefined) {
            setSkyClass(skyClass ?? 'day')
            return
        }
        let sunrise = sunTimes.current.rise.tz(dtTz)
        let sunset = sunTimes.current.set.tz(dtTz)

        let sky = 'day'
        if (dt !== undefined && sunset !== undefined && sunrise !== undefined) {
            let set = sunset
                .set('year', dt.year())
                .set('month', dt.month())
                .set('date', dt.date())
            let rise = sunrise
                .set('year', dt.year())
                .set('month', dt.month())
                .set('date', dt.date())
            let start = dt
                .set('hour', 0)
                .set('minute', 0)
                .set('second', 0)
            const times = {
                start: start,
                dawn:  rise,
                day:   rise.add(30, 'minutes'),
                dusk:  set,
                night: set.add(1, 'hour'),
                end:   start.add(1, 'day').subtract(1, 'millisecond')
            }

            //times: start  >  dawn  >  day >  dusk  >  night  >  end
            //set  :        night    dawn   day      dusk      night
            if      (dt.isBetween(times.start, times.dawn)) {sky = 'night'}
            else if (dt.isBetween(times.dawn, times.day))   {sky = 'dawn'}
            else if (dt.isBetween(times.day, times.dusk))   {sky = 'day'}
            else if (dt.isBetween(times.dusk, times.night)) {sky = 'dusk'}
            else if (dt.isBetween(times.night, times.end))  {sky = 'night'}
            // else: continue using previous value
        }
        setSkyClass(sky)
    }, [dt])

    return (
        // <main className={`sky--${skyClass}`}>
        <main className={`weather sky--${skyClass}`}>
            {/* Current Forecast */}
            <Tabs 
                activeTab={activeMain}
                setActiveTab={setActiveMain}
                tabs={{
                    classAppend: {
                        root: "container",
                    },
                    left: {
                        0: {
                            isHidden: Object.entries(locationData[0]).length === 0 ? true : false,
                            type: 'tab-alt',
                            alt: <WeatherTab location={locationData[0]} />,
                            component: <Weather locations={locationData} data={weatherData}/>,
                            classAppend: "current__tab",
                            onActive: toggleModifyModal,
                        },
                        1: {
                            isHidden: Object.entries(locationData[1]).length === 0 ? true : false,
                            type: 'tab-alt',
                            alt: <WeatherTab location={locationData[1]} />,
                            component: <Weather locations={locationData} data={weatherData}/>,
                            classAppend: "current__tab",
                            onActive: toggleModifyModal
                        },
                        2: {
                            isHidden: Object.entries(locationData[2]).length === 0,
                            type: 'tab-alt',
                            alt: <WeatherTab location={locationData[2]} />,
                            component: <Weather locations={locationData} data={weatherData}/>,
                            classAppend: "current__tab",
                            onActive: toggleModifyModal
                        },
                        add: {
                            isHidden: JSON.stringify(locationData) === "[{},{},{}]" || !JSON.stringify(locationData).includes("{}"),
                            type: 'basic',
                            component: (
                                <button className="add" onClick={toggleAddModal}>
                                    <img className="add__img" src={IMAGES.add} alt="add button" />
                                </button>
                            )
                        }
                    },
                    right: {
                        clock: {
                            isHidden: JSON.stringify(locationData) === "[{},{},{}]",
                            type: 'basic',
                            component: (
                                <div className="clock">
                                    <p className="clock__date">{dtFormat('dddd LL')}</p>
                                    <p className="clock__time">{dtFormat('h:mm a')}</p>
                                    {/* <p className="clock__tz">{dtTz} ({dtOffset >= 0 ? '+' : '-'}{dtOffset})</p> */}
                                </div>
                            ),
                        }
                    }
                }}
            />
            {/* Future Forecast */}
            {!(JSON.stringify(locationData) === "[{},{},{}]") &&
                <Tabs 
                    activeTab={activeGroups}
                    setActiveTab={setActiveGroups}
                    tabs={{
                        initial: 'daily',
                        classAppend: {
                            root: `container`,
                        },
                        left: {
                            daily: {
                                type: 'tab-alt',
                                alt: "Daily",
                                component: <WeatherDaily locations={locationData} data={weatherData} datetime={dt}/>,
                                classAppend: "daily__tab"
                            },
                            hourly: {
                                type: 'tab-alt',
                                alt: "Hourly",
                                component: <WeatherHourly locations={locationData} data={weatherData} datetime={dt}/>,
                                classAppend: "hourly__tab"
                            }
                        }
                    }}
                />
            }

            {/* Modify Modal */}
            <Modal visible={modifyModal} toggle={toggleModifyModal}>
                <Tabs 
                    activeTab={activeModify}
                    setActiveTab={setActiveModify}
                    tabs={{
                        right: {
                            change: {
                                type: 'tab',
                                component: (
                                    <div className="select select--modify">
                                        <h2 className="select__header">Change Location?</h2>
                                        <LocationSearch data={locationData} set={(x) => {updateLocationData(Number(activeMain), x)}} toggleModal={toggleModifyModal} includeCancel={true}/>
                                    </div>
                                ),
                                classAppend: "select__tab"
                            },
                            delete: {
                                isDisabled: JSON.stringify(locationData).endsWith(",{},{}]"),
                                type: 'tab',
                                component: (
                                    <div className="delete">
                                        <h2 className="delete__header">Stop Forecasting this location?</h2>
                                        <button className="btn btn--red"
                                            onClick={() => {
                                                // move active left (-1) if new active tab has no corresponding data
                                                if (
                                                    JSON.stringify([
                                                        ...[...locationData, {}].slice(0, Number(activeMain)),
                                                        ...[...locationData, {}].slice(Number(activeMain) + 1, [...locationData, {}].length)
                                                    ][activeMain]) === '{}'
                                                ) {
                                                    console.log("move");
                                                    setActiveMain(String(activeMain - 1))
                                                }
                                                // add new {} to the end
                                                pushLocationData({})
                                                // remove the entire {} from the location data list
                                                removeLocationData(Number(activeMain))
                                                // reset tab state
                                                setActiveModify(null)
                                                // close modal
                                                toggleModifyModal()
                                            }}
                                        >
                                            confirm
                                        </button>
                                        <button className="btn" onClick={toggleModifyModal}>cancel</button>
                                    </div>
                                ),
                                classAppend: "delete__tab"
                            }
                        }
                    }}
                />
            </Modal>
            {/* Add Modal */}
            <Modal visible={addModal} toggle={toggleAddModal} disableClickOff>
                <div className="select select--add">
                    <h2 className="select__header">Add a location:</h2>
                    <LocationSearch 
                        data={locationData} 
                        set={(x) => {
                            let newIndex = locationData.findIndex(o => {return Object.entries(o) == 0})
                            updateLocationData(
                                newIndex, 
                                x
                            )
                            setActiveMain(String(newIndex))
                        }} 
                        toggleModal={toggleAddModal}
                    />
                    {/* cancel button (don't render if no data currently exists) */}
                    {!(JSON.stringify([...locationData]) === "[{},{},{}]") && 
                        <button className="select__btn btn" onClick={toggleAddModal}>cancel</button>
                    }
                </div>
            </Modal>
        </main>
    )
}
function Loading() {
    return (
        <div className="loading">
            <div className="loading__img">
                <img src={IMAGES.loading} alt="loading wheel" />
            </div>
        </div>
    )
}
function LocationSearch({data, set, toggleModal, includeCancel}) {
    const inputRef = useRef()
    const [search, setSearch] = useState('')
    const [results, setResults] = useState([])

    useEffect(() => {
        inputRef.current.focus()
    }, [])
    useEffect(() => {
        setResults('loading')
        fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${search}&count=100`, {method: 'GET'})
        .then(res => res.json())
        .then(json => {
            console.log("made call to geocoding API");
            setResults(json.results || [])
        })
        .catch(err => console.log(err))
    }, [search])
    return (
        <>
            <div className="select__search">
                <label className="select__label" htmlFor="select-search">Search:</label>
                <input className="select__input"
                        type="text"
                        id="select-search"
                        ref={inputRef}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
            </div>
            {search.length > 0 &&
                <ul className="select__list">
                    {results === 'loading' ? <Loading /> : (results.length === 0 ? <p className="select__empty">No Results Found</p> :
                            results.map(result => {
                            if ([result.name, result.country, result.latitude, result.longitude, result.timezone].includes(undefined)) {
                                return null
                            }
                            return (
                                <li className="select__item" 
                                    key={`result-${result.name}=${result.id}`}
                                    onClick={() => {
                                        let location = {
                                            lat: result.latitude,
                                            lon: result.longitude,
                                            timezone: result.timezone,
                                            name: result.name,
                                            country: result.country,
                                            admin: [
                                                result.admin1 || null,
                                                result.admin2 || null,
                                                result.admin3 || null
                                            ].filter(x => {return x != null})
                                        }
                                        // check if location is already in use
                                        if (JSON.stringify(data).includes(JSON.stringify(location))) {
                                            alert("this location is already being forecasted")
                                            return
                                        }
                                        set(location)
                                        toggleModal()
                                    }}
                                >
                                    <h3>{result.name}, {result.country}</h3>
                                    <p>
                                        {[
                                            result.admin1 || null,
                                            result.admin2 || null,
                                            result.admin3 || null
                                        ].filter(x => {return x != null}).join(", ")}
                                    </p>
                                </li>
                            )
                        })
                    )}
                </ul>
            }
            {includeCancel &&
                <button className="btn" onClick={toggleModal}>cancel</button>
            }
        </>
    )
}

function Condition({hideIcon, hideDesc, weathercode, datetime, sunset, sunrise, iconAppend, subAppend}) {
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
    let isNighttime = false
    if (datetime !== undefined && sunset !== undefined && sunrise !== undefined) {
        let set = sunset
            .set('year', datetime.year())
            .set('month', datetime.month())
            .set('date', datetime.date())
        let rise = sunrise
            .set('year', datetime.year())
            .set('month', datetime.month())
            .set('date', datetime.date())
        isNighttime = datetime.isAfter(set.subtract(1, 'day')) && datetime.isBefore(rise) | datetime.isAfter(set)
    }

    let layers = []

    switch (weathercode) {
        case 0:
            layers.push(isNighttime ? IMAGES.moonClear : IMAGES.sunClear)
            break
        case 1:
        case 2:
        case 3:
            layers.push(isNighttime ? IMAGES.moonCloudy : IMAGES.sunCloudy, IMAGES.cloudCloudy)
            break
        default:
            layers.push(isNighttime ? IMAGES.moon : IMAGES.sun, ...CONDITIONS[weathercode].iconLayers)
            break
    }
    return (
        <>
            {!hideIcon &&
                <div className={`icon ${iconAppend}`}>
                    {layers.map((layer, index) => {return (
                        <img className={`icon__layer`} 
                            key={`icon-layer-${index}`}
                            src={layer} 
                            alt="weather-icon-layer"
                        />
                    )})}
                </div>
            }
            {!hideDesc &&
                <div className={subAppend}>
                    <p className="condition__description">{CONDITIONS[weathercode].description}</p>
                </div>
            }
        </>
    )
}

function WeatherTab({location}) {
    const {lat, lon, name, country, admin} = location
    return (
        <div className="current__tab-content">
            <h2>{name}, {country}</h2>
            <p>{[...admin].join(", ")}</p>
        </div>
    )
}
function Weather({locations, data}) {
    if (JSON.stringify(locations) === "[{},{},{}]") return null
    if (data === null | data === undefined) return <div className="current"><Loading /></div>
    // if (true) return <div className="current"><Loading /></div>
    if (data instanceof Error) return (
        <>
            <h2>Something went wrong!</h2>
            <p>{data.name}: {data.message}</p>
        </>
    )
    const main = data.main
    return (
        <div className="current">
            <div className="current__top">
                <div className="current__column current__column--temperature">
                    <div className="current__main">
                        <p className="current__temp">
                            {Math.trunc(main.temperature.current)}
                            {main.temperature.current - Math.trunc(main.temperature.current) > 0 && 
                                <span>
                                    .{String(main.temperature.current).split(".")[1]}
                                </span>
                            }
                            <sup>°F</sup>
                        </p>
                    </div>
                    <div className="current__sub">
                        <p className="current__temp current__temp--alt">
                            {((5/9) * (main.temperature.current - 32)).toFixed(1).replace('.0', '')}
                            <sup>°C</sup>
                        </p>
                    </div>
                </div>

                <div className="current__column current__column--condition">
                    <Condition 
                        iconAppend="current__main icon--main" 
                        subAppend="current__sub"
                        weathercode={main.condition} 
                        datetime={main.dtObj} 
                        sunrise={main.sunrise} 
                        sunset={main.sunset}
                        size={['5em', '5em']}
                    />
                </div>
            </div>
            
            <hr className="current__divider"/>

            <ul className="current__stats">
                <li className="current__stat">
                    <div className="current__stat-icon">
                        <img src={IMAGES.temperature} alt="temp icon" />
                    </div>
                    <p className="current__stat-value">{Math.round(main.temperature.high)}<sup>°F</sup> / {Math.round(main.temperature.low)}<sup>°F</sup></p>
                </li>
                <li className="current__stat">
                    <div className="current__stat-icon">
                        <img src={IMAGES.wind} alt="wind icon" />
                    </div>
                    <p className="current__stat-value">{main.wind.speed} mph {main.wind.direction}</p>
                </li>
                <li className="current__stat">
                    <div className="current__stat-icon">
                        <img src={IMAGES.sunrise} alt="sunrise icon" />
                    </div>
                    <p className="current__stat-value">{main.sunrise.format("h:mm a")}</p>
                </li>
                <li className="current__stat">
                    <div className="current__stat-icon">
                        <img src={IMAGES.sunset} alt="sunset icon" />
                    </div>
                    <p className="current__stat-value">{main.sunset.format("h:mm a")}</p>
                </li>
            </ul>
        </div>
    )
}
function WeatherDaily({locations, data, datetime}) {
    if (JSON.stringify(locations) === "[{},{},{}]") return null
    if (data === null | data === undefined) return <div className="daily"><Loading /></div>
    // if (true) return <div className="daily"><Loading /></div>
    if (data instanceof Error) return (
        <>
            <h2>Something went wrong!</h2>
            <p>{data.name}: {data.message}</p>
        </>
    )
    const daily = data.daily
    return (
        <ul className={`daily`}>
            {daily.map((box) => (
                <div className={`daily__cell`} key={`group-daily-${box.dtObj.format('YYYY-MM-DD/HH:mm:ss')}`}>
                    <div className="daily__box">
                        <h3 className="daily__header daily__header--top">{box.dtObj.format('dddd')}</h3>
                        <h4 className="daily__header daily__header--bottom">{box.dtObj.format('MM/DD')}</h4>
                        <Condition iconAppend="daily__condition" hideDesc weathercode={box.condition}/>
                        
                        <hr className="daily__divider"/>

                        <div className="daily__stats">
                            <p className="daily__temperature">{Math.round(box.temperature.high)}° / {Math.round(box.temperature.low)}°</p>
                        </div>
                    </div>
                </div>
            ))}
        </ul>
    )
}
function WeatherHourly({locations, data, datetime}) {
    if (JSON.stringify(locations) === "[{},{},{}]") return null
    if (data === null | data === undefined) return <div className="hourly"><Loading /></div>
    if (data instanceof Error) return (
        <>
            <h2>Something went wrong!</h2>
            <p>{data.name}: {data.message}</p>
        </>
    )
    // cut list to only x hours after present
    const hourly = data.hourly.filter((hour) => {
        return hour.dtObj.isAfter(datetime)
    }).slice(0, 24)

    return (
        <ul className={`hourly`}>
            {hourly.map((box) => (
                <div className="hourly__cell" key={`group-hourly-${box.dtObj.format('YYYY-MM-DD/HH:mm:ss')}`}>
                    <div className={`hourly__box`}>
                        <h3 className="hourly__header hourly__header--top">{box.dtObj.format('h:mm a')}</h3>
                        <Condition iconAppend="hourly__condition" hideDesc weathercode={box.condition} datetime={box.dtObj} sunrise={box.sunrise} sunset={box.sunset}/>
                        <hr className="hourly__divider"/>

                        <div className="hourly__stats">
                            <div className="hourly__stat">
                                <img src={IMAGES.temperature} alt="thermometer icon" />
                                <p className="hourly__temperature">{Math.round(box.temperature)}°F</p>
                            </div>
                            <div className="hourly__stat">
                                <img src={IMAGES.humidity} alt="humidity icon" />
                                <p>{box.humidity}%</p>
                            </div>
                            <div className="hourly__stat">
                                <img src={IMAGES.precipitation} alt="precipitation icon" />
                                <p>{box.precipitation}%</p>
                            </div>
                            <div className="hourly__stat">
                                <img src={IMAGES.uv} alt="UV index icon" />
                                <p>{Math.round(box.uvIndex)} / 10</p>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </ul>
    )
}