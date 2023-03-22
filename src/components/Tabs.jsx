import React, { useEffect, useState } from 'react'

export default function Tabs({activeTabSetter, tabs}) {
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
        left: {...tabs.left} || {},
        center: {...tabs.center} || {},
        right: {...tabs.right} || {}
    }
    

    if ([...Object.keys(tabs.left), ...Object.keys(tabs.center), ...Object.keys(tabs.right)].length !== Object.keys({...tabs.left, ...tabs.center, ...tabs.right}).length) {
        throw "DuplicateKey: one or more tabs in a <Tabs /> component use the same key. This may happen if tabs object nested within the section objects (left, center, right) use the same key as another across all sections"
    }


    //TODO: possibly add 'gap' element between sections to provide bottom border
    //TODO: if possible combine shared check into initial formatting (might not be possible though)

    const [activeTab, setActiveTab] = useState(() => {
        // use initial value if included
        if (tabs.hasOwnProperty('initial')) return tabs.initial
        // get first tab left to right
        for (let item of Object.entries({...tabs.left, ...tabs.center, ...tabs.right})) {
            if (item[1].type !== 'basic') return item[0]
        }
    })

    useEffect(() => {
        if (activeTabSetter === undefined) return
        activeTabSetter(activeTab)
    }, [activeTab])




    return (
        <section className="tabs">
            <div className="tabs__header">
                {['left', 'center', 'right'].map((section) => {
                    return (
                        // Sections (left, center, right)
                        <div className={`tabs__list tabs__list--${section}`} key={`Tabs-${section}`}>
                            {Object.entries(tabs[section]).map((tab) => {
                                // Hidden flag true
                                if (tab[1].isHidden === true) {return}
                                // Tab
                                else if (tab[1].type === 'tab') {return (
                                    <button 
                                        key={`Tabs-${section}-${tab[0]}`}
                                        className={["tabs__tab",
                                            activeTab === tab[0] ? 'tabs__tab--active' : '',
                                            tab[1].isDisabled ? 'tabs__tab--disabled' : '',
                                            tab[1].classAppend
                                        ].join(" ")}
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
                                        key={`Tabs-${section}-${tab[0]}`}
                                        className={["tabs__tab",
                                            activeTab === tab[0] ? 'tabs__tab--active' : '',
                                            tab[1].isDisabled ? 'tabs__tab--disabled' : '',
                                            tab[1].classAppend
                                        ].join(" ")}
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
                                    <div className='tabs__tab tabs__tab--basic' key={`Tabs-${section}-${tab[0]}`}>
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
                {
                    {...tabs.left, ...tabs.center, ...tabs.right}[activeTab].type === 'basic' ?
                    null :
                    {...tabs.left, ...tabs.center, ...tabs.right}[activeTab].component
                }
                {tabs.shared.end}
            </div>
        </section>
    )
}


// USAGE //////////////////////////////////////////////////
function Example() {
    const [active, setActive] = useState()
    return (
        <Tabs 
            // (opt.) state setter for tracking the current active tab id
            activeTabSetter={setActive}

            // initial tabs data passed in object
            tabs={{
                // (opt.) initial tab id to be selected (defaults to left-most tab excluding basic component tabs)
                initial: 'normal',

                // (opt.) shared object given components to be present in body with all tabs
                shared: {
                    start: <p>this will be before all tab content</p>,   // (opt.) shared component inserted before tab component
                    end: <p>this will be before all tab content</p>      // (opt.) shared component inserted after tab component

                },

                // section objects for groups of tabs (left, center, right)
                left: {
                    // tab objects
                    // (tab type)
                    normal: {
                        // type - tab format
                        type: 'tab',                                // 'tab' type uses object key as tab name and label
                        component: <p>Tab Content</p>,              // component          - content given the the body of the section when the tab is active
                        classAppend: 'tabs__tab--blue',             // classAppend (opt.) - custom class added to a tab's element (not used in 'basic' type)
                        onActive: () => {alert("already in use")}   // onActive (opt.)    - function executed upon clicking a tab when it's already active (not used in 'basic' type)
                    },
                    
                    // tab-alt type
                    alternateText: {
                        type: 'tab-alt',            // 'tab-alt' type uses alt property as label (string or element)
                        alt: "Alternate Title",     // alt (only for 'tab-alt' type) - alternate value for tab label (text or element)
                        component: null,
                    },
                    alternateElement: {
                        type: 'tab-alt',
                        alt: (<>
                            <h2>Alternate Content</h2>
                            <p>Here</p>
                        </>),
                        component: null,
                    },

                    // basic type
                    basic: {
                        type: 'basic',          // 'basic' no tab functionality, just uses passes a component to occupy a tab slot
                        component: <p>Just a normal component, no tab here</p>
                        //NOTE: basic type only requires type and component props, classAppend and onActive aren't applicable
                    },

                    // hidden tabs
                    hidden: {
                        // tabs with the (optional) isHidden prop as true will not be rendered
                        isHidden: false,
                        type: 'tab',
                        component: <p>This won't be seen</p>
                    },

                    // disabled tabs (COMING SOON)
                    disabled: {
                        // tabs with the (optional) isDisabled prop as true will be displayed but will do nothing on click
                        isDisabled: false,
                        type: 'tab',
                        component: <p>This won't be seen</p>
                    }
                },

                // same formats for tab objects in the other sections
                center: {},
                right: {}
            }}
        />
    )
}

/* Style Classes /////////
tabs
    &__header
    &__list
        &--left
        &--center
        &--right
    &__tab
        &--active
        &--disabled
        &--basic
    &__body
*/