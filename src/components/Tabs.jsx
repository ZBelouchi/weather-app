import React, { useEffect } from 'react'

export default function Tabs({activeTab, setActiveTab, tabs}) {
    // format tabs data from given object
    if (!tabs.hasOwnProperty('shared')) {
        tabs.shared = {
            start: null,
            end: null
        }
    } 
    tabs = {
        ...tabs,
        shared: {
            start: null,
            end: null,
            ...tabs.shared
        },
        classAppend: {
            root: null,
            left: null,
            center: null,
            right: null,
            ...tabs.classAppend
        },
        left: {...tabs.left} || {},
        center: {...tabs.center} || {},
        right: {...tabs.right} || {}
    }

    // throw error if same tab id is used twice in the component (across all groups)
    if ([...Object.keys(tabs.left), ...Object.keys(tabs.center), ...Object.keys(tabs.right)].length !== Object.keys({...tabs.left, ...tabs.center, ...tabs.right}).length) {
        throw "DuplicateKey: one or more tabs in a <Tabs /> component use the same key. This may happen if tabs object nested within the section objects (left, center, right) use the same key as another across all sections"
    }

    // set initial active tab on mount based on input from tabs object
    useEffect(() => {
        if (activeTab === null) {
            // use initial value if included
            setActiveTab(() => {
                if (tabs.hasOwnProperty('initial')) return tabs.initial
                // get first tab left to right
                for (let item of Object.entries({...tabs.left, ...tabs.center, ...tabs.right})) {
                    if (item[1].type !== 'basic' && !item[1].isDisabled && !item[1].isHidden) return item[0]
                }
            })
        }
    }, [])

    return (activeTab !== null &&
        <section className={`tabs ${tabs.classAppend.root}`}>
            <div className="tabs__header">
                {['left', 'center', 'right'].map((section) => {
                    return (
                        // Sections (left, center, right)
                        <div className={`tabs__list tabs__list--${section} ${tabs.classAppend[section]}`} key={`Tabs-${section}`}>
                            {Object.entries(tabs[section]).map((tab) => {
                                // Hidden flag true
                                if (tab[1].isHidden === true) {return}

                                // Tab
                                else if (tab[1].type === 'tab') {return (
                                    <button 
                                        className={["tabs__tab",
                                            activeTab === tab[0] ? 'tabs__tab--active' : '',
                                            tab[1].isDisabled ? 'tabs__tab--disabled' : '',
                                            tab[1].classAppend
                                        ].join(" ")}
                                        key={`Tabs-${section}-${tab[0]}`}
                                        disabled={tab[1].isDisabled}
                                        onClick={() => {
                                            if (activeTab === tab[0] && tab[1].onActive !== undefined) {
                                                tab[1].onActive()
                                            }
                                            setActiveTab(tab[0])
                                        }}
                                    >
                                        {tab[0]}
                                    </button>

                                // Tab with alternate display type
                                )} else if (tab[1].type === 'tab-alt') {return (
                                    <button
                                        className={["tabs__tab",
                                            activeTab === tab[0] ? 'tabs__tab--active' : '',
                                            tab[1].isDisabled ? 'tabs__tab--disabled' : '',
                                            tab[1].classAppend
                                        ].join(" ")}
                                        key={`Tabs-${section}-${tab[0]}`}
                                        disabled={tab[1].isDisabled}
                                        onClick={() => {
                                            if (activeTab === tab[0] && tab[1].onActive !== undefined) {
                                                tab[1].onActive()
                                            }
                                            setActiveTab(tab[0])
                                        }}
                                    >
                                        {tab[1].alt}
                                    </button>

                                // Component in tab slot
                                )} else {return (
                                    <div className={`tabs__tab tabs__tab--basic ${tab[1].classAppend}`} key={`Tabs-${section}-${tab[0]}`}>
                                        {tab[1].component}
                                    </div>
                                )}
                                
                            })}
                        </div>
                    )
                })}
            </div>
            <div className="tabs__body">
                {tabs.shared.start}
                {!({...tabs.left, ...tabs.center, ...tabs.right}[activeTab].type === 'basic') &&
                    {...tabs.left, ...tabs.center, ...tabs.right}[activeTab].component
                }
                {tabs.shared.end}
            </div>
        </section>
    )
}