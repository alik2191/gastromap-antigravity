import Admin from './pages/Admin';
import AuthCallback from './pages/AuthCallback';
import CreatorDashboard from './pages/CreatorDashboard';
import CreatorTools from './pages/CreatorTools';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Login from './pages/Login';

import LocationDetail from './pages/LocationDetail';
import LocationPublic from './pages/LocationPublic';
import Pricing from './pages/Pricing';
import Privacy from './pages/Privacy';
import Profile from './pages/Profile';
import Support from './pages/Support';
import Terms from './pages/Terms';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Admin": Admin,
    "AuthCallback": AuthCallback,
    "CreatorDashboard": CreatorDashboard,
    "CreatorTools": CreatorTools,
    "Dashboard": Dashboard,
    "Home": Home,
    "Login": Login,

    "LocationDetail": LocationDetail,
    "LocationPublic": LocationPublic,
    "Pricing": Pricing,
    "Privacy": Privacy,
    "Profile": Profile,
    "Support": Support,
    "Terms": Terms,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};