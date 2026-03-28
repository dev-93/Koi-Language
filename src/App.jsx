import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import LearnCard from './pages/LearnCard';
import Practice from './pages/Practice';
import useStore from './store';

function App() {
    const userProfile = useStore((state) => state.userProfile);

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={!userProfile ? <Onboarding /> : <Navigate to="/home" />} />
                <Route path="/home" element={userProfile ? <Home /> : <Navigate to="/" />} />
                <Route
                    path="/learn/:id"
                    element={userProfile ? <LearnCard /> : <Navigate to="/" />}
                />
                <Route
                    path="/practice/:id"
                    element={userProfile ? <Practice /> : <Navigate to="/" />}
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
