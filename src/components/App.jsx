import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import LocationSelect from './LocationSelect'
import Weather from './Weather'

export default function App() {
    return (
        <div className="container">
            <Router>
                <Routes>
                    <Route path='/' element={<LocationSelect />} />
                    <Route path='/home' element={<Weather />} />
                    <Route path='*' element={<p>Error 404</p>} />
                </Routes>
            </Router>
        </div>
    )
}