import React, { useEffect, useState, useRef } from "react"
import dayjs from "dayjs"

import useToggle from "../hooks/useToggle"
import useArray from "../hooks/useArray"
import useDatetime from "../hooks/useDatetime"
import useAsyncCached from "../hooks/useAsyncCached"

import Tabs from "./Tabs"
import Modal from "./Modal"

//TODO: add current date's hourly/daily data groups for averaging certain stats not provided by API
//TODO: format all incoming data from json for use by main and group component
//TODO: make full UI for weather/group components

//TODO: filter out invalid locations from location search (e.g. no time zone or coordinates)
//TODO: adding new location shifts active tab to new location
//TODO: make template wrapper component for components using cached data from a useAsync hook (what Weather and WeatherGroup do to prevent stutters)
//TODO: add current location selector (machine location)
//TODO: make search a deferred value to prevent excessive API calls
//TODO: possibly refine location data checks using regex
//TODO: fix hourlyTemps to use isSame if possible (didn't work before, might be able to fix it this time)
//TODO: figure out how weather data is initially returning undefined while also not loading, then returning the actual data a moment later and fix it



export default function App() {
    const {dt, dtTz, dtTime, dtDate, dtOffset, dtFormat, dtChangeTz} = useDatetime()
    const [modifyModal, toggleModifyModal] = useToggle(false)
    const [addModal, toggleAddModal] = useToggle(false)
    const [activeMain, setActiveMain] = useState(0)
    const [activeGroup, setActiveGroup] = useState('Daily')
    const {array: locationData, set: setLocationData, update: updateLocationData, remove: removeLocationData, push: pushLocationData} = useArray([
        {
            lat: 39.44034,
            lon: -84.36216,
            timezone: "America/New_York",
            name: "Monroe",
            country: "United States",
            admin: ['Ohio', 'Butler', 'Lemon Township'],
        },
        {
            // lat:  44.91656,
            // lon: 7.46719,
            // timezone: "Europe/Rome",
            // name: "Skf Industrie S.P.A.",
            // country: "Italy",
            // admin: ['Piedmont', 'Turin', 'Airasca'],
        },
        {
            // lat: 3.07014,
            // lon: 27.48309,
            // timezone: "Africa/Lubumbashi",
            // name: "We",
            // country: "DR Congo",
            // admin: ['Bas-Uele', 'Poko'],
        }
    ])
    // console.log("location data: ", locationData);

    const weatherData = useAsyncCached(
        () => {
            console.log("made call to forecast API");
            if (JSON.stringify(locationData) === "[{},{},{}]") {
                return Promise.reject(new Error(`Coordinates not available in slot ${activeMain}`))
                // console.error(`Coordinates not available in slot ${activeMain}`)
                // return Promise.reject()
            }

            const url = "https://api.open-meteo.com/v1/forecast?" + [
                `latitude=${locationData[activeMain].lat}`,
                `longitude=${locationData[activeMain].lon}`,
                `hourly=temperature_2m,weathercode`,
                `daily=weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset`,
                `current_weather=true`,
                `timezone=auto`,
                `temperature_unit=fahrenheit`,
                `windspeed_unit=mph`,
                `precipitation_unit=inch`,
                `timezone=auto`,
                // `start_date=${dt.subtract(1, "days").format('YYYY-MM-DD')}`,
                // `end_date=${dt.add(6, "days").format('YYYY-MM-DD')}`,
            ].join("&")
            
            return fetch(url, {method: 'GET'})
                .then(res => res.json())
                .then(json => {
                    console.log(json)

                    let hourlyData = json.hourly.time.map((hour, index) => {
                        return {
                            time: hour.slice(11, 16),
                            timeObj: dayjs(hour, 'YYYY-MM-DDTHH:mm'),
                            condition: json.hourly.weathercode[index],
                            temperature: json.hourly.temperature_2m[index]
                        }
                    })
                    console.log(hourlyData);

                    let hourlyForecast = hourlyData.filter((item) => {
                        // cut list to only x hours after present
                        return item.timeObj.isAfter(dt)
                    }).slice(0,24)
                    // // filtered to only hours of current day
                    let hourlyTemps = hourlyData.filter((item) => {
                        // filter out times that aren't for current day
                        return item.timeObj.format('YYYY-MM-DD') === dtDate    //NOTE: isSame method decided it didn't wanna be accurate to so I'm brute forcing it; clean up later
                    }).map((item) => {
                        // reduce items to only temp now that time isn't needed
                        return item.temperature
                    })


                    let hourly = hourlyData




                    // console.log(hourlyForecast);
                    let degree = json.current_weather.winddirection
                    let directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
                    let index = Math.round(((degree %= 360) < 0 ? degree + 360 : degree) / 45) % 8;
                    let windDirection = directions[index];
                    // return {main: json}
                    let wd = {
                        main: {
                            timeZone: json.timezone,
                            condition: json.current_weather.weathercode,
                            temperature: {
                                current: json.current_weather.temperature,
                                high: Math.max(...hourlyTemps),
                                low: Math.min(...hourlyTemps)
                            },
                            wind: {
                                speed: json.current_weather.windspeed,
                                direction: windDirection
                            },
                            humidity: 0,        // new
                            uvIndex: 0,         // new
                            precipitation: 0,   // new
                            sunrise: null,
                            sunset: null,
                            isNighttime: false,     // try to make this obsolete :(
                            localTime: null
                        },
                        groups: {
                            daily: json.daily.time.map((day, index) => {
                                return {
                                    time: day,
                                    timeObj: dayjs(day, 'YYYY-MM-DD'),
                                    temperature : {
                                        high: json.daily.temperature_2m_max[index],
                                        low: json.daily.temperature_2m_min[index]
                                    },
                                    condition: json.current_weather.weathercode
                                }
                            }),
                            hourly: hourly
                        }
                    }
                    return wd
                })
        },
        [locationData, activeMain, dt]
    )

    // console.log("weather data: ", weatherData);

    useEffect(() => {
        if (JSON.stringify([...locationData]) === "[{},{},{}]") {
            toggleAddModal(true)
        }
    }, [])

    useEffect(() => {
        dtChangeTz(locationData[activeMain].timezone)
    }, [locationData, activeMain])

    return (
        <main className='weather'>
            {/* Current Forecast */}
            <Tabs activeTabSetter={setActiveMain} tabs={{
                left: {
                    0: {
                        isHidden: Object.entries(locationData[0]).length === 0 ? true : false,
                        type: 'tab-alt',
                        alt: <WeatherTab location={locationData[0]} />,
                        component: <Weather locations={locationData} data={weatherData}/>,
                        onActive: toggleModifyModal,
                    },
                    1: {
                        isHidden: Object.entries(locationData[1]).length === 0 ? true : false,
                        type: 'tab-alt',
                        alt: <WeatherTab location={locationData[1]} />,
                        component: <Weather locations={locationData} data={weatherData}/>,
                        onActive: toggleModifyModal
                    },
                    2: {
                        isHidden: Object.entries(locationData[2]).length === 0 ? true : false,
                        type: 'tab-alt',
                        alt: <WeatherTab location={locationData[2]} />,
                        component: <Weather locations={locationData} data={weatherData}/>,
                        onActive: toggleModifyModal
                    },
                    add: {
                        isHidden: !JSON.stringify(locationData).includes("{}"),
                        type: 'basic',
                        component: <button onClick={toggleAddModal}>+</button>
                    }
                },
                right: {
                    clock: {
                        type: 'basic',
                        component: (
                            <div>
                                <p>{dtFormat('dddd LL')}</p>
                                <h2>{dtFormat('HH:mm:ss')}</h2>
                                <p>{dtTz}</p>
                            </div>
                        )
                    }
                }
            }}/>
            {/* Future Forecast */}
            <Tabs activeTabSetter={setActiveGroup} tabs={{
                shared: {
                    end: <WeatherGroup locations={locationData} data={weatherData} group={activeGroup}/>
                },
                left: {
                    daily: {
                        type: 'tab-alt',
                        alt: "Daily",
                        component: null,
                    },
                    hourly: {
                        type: 'tab-alt',
                        alt: "Hourly",
                        component: null
                    }
                }
            }}/>
            {/* Modify Modal */}
            <Modal visible={modifyModal} toggle={toggleModifyModal}>
                <Tabs tabs={{
                    shared: {
                        end: <button onClick={toggleModifyModal}>cancel</button>
                    },
                    right: {
                        change: {
                            type: 'tab',
                            component: (
                                <div>
                                    <h2>Change Location?</h2>
                                    <LocationSearch data={locationData} set={(x) => updateLocationData(activeMain, x)} toggleModal={toggleModifyModal}/>
                                </div>
                            ),
                        },
                        delete: {
                            isDisabled: JSON.stringify([...locationData]).endsWith(",{},{}]"),
                            type: 'tab',
                            component: (
                                <div>
                                    <h2>Stop Forecasting this location?</h2>
                                    <button 
                                        onClick={() => {
                                            // add new {} to the end
                                            pushLocationData({})
                                            // remove the entire {} from the location data list
                                            removeLocationData(Number(activeMain))
                                            // move active left (-1) if new active tab has no corresponding data
                                            if ([...locationData, {}][activeMain] !== {}) {
                                                setActiveMain(activeMain - 1)
                                            }
                                            // close modal
                                            toggleModifyModal()
                                        }}
                                    >Confirm</button>
                                </div>
                            ),
                        }
                    }
                }}/>
            </Modal>
            {/* Add Modal */}
            <Modal visible={addModal} toggle={toggleAddModal} disableClickOff>
                <LocationSearch 
                    data={locationData} 
                    set={(x) => {
                        updateLocationData(
                            locationData.findIndex(o => {return Object.entries(o) == 0}), 
                            x
                        )
                    }} 
                    toggleModal={toggleAddModal}
                />
                {/* cancel button (don't render if no data currently exists) */}
                {!(JSON.stringify([...locationData]) === "[{},{},{}]") && <button onClick={toggleAddModal}>cancel</button>}
            </Modal>
        </main>
    )
}
function LocationSearch({data, set, toggleModal}) {
    const inputRef = useRef()
    const [search, setSearch] = useState('')
    const [results, setResults] = useState([])

    useEffect(() => {
        inputRef.current.focus()
    }, [])
    useEffect(() => {
        console.log("made call to geocoding API");
        fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${search}&count=100`, {method: 'GET'})
        .then(res => res.json())
        .then(json => {
            setResults(json.results || [])
        })
        .catch(err => console.log(err))
    }, [search])
    return (
        <div className="select">
            <h2 className="select__header">Add a location:</h2>
            <div className="select__search">
                <label htmlFor="addSearch">Search:</label>
                <input className="select__input"
                    type="text"
                    id="addSearch"
                    ref={inputRef}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>
            {results.length <= 0 ? null : 
                <ul className="select__list">
                {results.map(result => (
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
                        <p>{result.name}</p>
                        <p>{result.admin1 ?? ''}</p>
                        <p>{result.admin2 ?? ''}</p>
                        <p>{result.admin3 ?? ''}</p>
                        <p>{result.country}</p>
                    </li>
                ))}
            </ul>
            }
        </div>
    )
}

function WeatherTab({location}) {
    const {lat, lon, name, country, admin} = location
    return (
        <div>
            <h2>{name}, {country}</h2>
            <p>{[...admin].join(", ")}</p>
        </div>
    )
}
function Weather({locations, data}) {
    if (JSON.stringify(locations) === "[{},{},{}]") return null
    if (data === null | data === undefined) return "loading"
    if (data instanceof Error) return (
        <>
            <h2>Something went wrong!</h2>
            <p>{data.name}: {data.message}</p>
        </>
    )
    return (
        <div className="weather__main">
            <p>Temp:  {data.main.temperature.current}°F</p>
            <p>{data.main.temperature.high} Hi / {data.main.temperature.low} Lo</p>
            <p>Condition: {data.main.condition}</p>
            <p>Wind {data.main.wind.speed} mph {data.main.wind.direction}</p>
            <p>UV Index {data.main.uvIndex}</p>
            <p>Percip {data.main.precipitation}</p>
            <p>Humidity {data.main.humidity}</p>
            <p>Sunrise {data.main.sunrise}</p>
            <p>Sunset {data.main.sunset}</p>
        </div>
    )
}
function WeatherGroup({locations, data, group}) {
    if (JSON.stringify(locations) === "[{},{},{}]") return null
    if (data === null | data === undefined) return "loading"
    if (data instanceof Error) return (
        <>
            <h2>Something went wrong!</h2>
            <p>{data.name}: {data.message}</p>
        </>
    )

    return (
        <ul className={`weather__group ${group}`}>
            {data.groups[group].map((box) => (
                <div className={`${group}__box`} key={`group-${group}-${box.timeObj.toISOString()}`}>
                    <p>{box.time}</p>
                        <p>{box.timeObj.toISOString()}</p>
                        {group === "daily" && 
                            <p>{box.temperature.high} Hi / {box.temperature.low} Lo</p>
                        }
                        {group === "hourly" && 
                            <p>Temp: {box.temperature}°F</p>
                        }
                        <p>Condition: {box.condition}</p>
                </div>
            ))}
        </ul>
    )
}