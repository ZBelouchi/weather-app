import React from 'react'
import ReactDOM from 'react-dom/client'

import './styles/index.sass'
import App from './components/App'
import ErrorBoundary from './components/ErrorBoundary'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        {/* <ErrorBoundary fallback={<p>something went wrong</p>} > */}
            <App />
        {/* </ErrorBoundary> */}
    </React.StrictMode>
)
