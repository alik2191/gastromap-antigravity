import { lazy } from 'react';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Admin": lazy(() => import('./pages/Admin')),
    "AuthCallback": lazy(() => import('./pages/AuthCallback')),
    "CreatorDashboard": lazy(() => import('./pages/CreatorDashboard')),
    "CreatorTools": lazy(() => import('./pages/CreatorTools')),
    "Dashboard": lazy(() => import('./pages/Dashboard')),
    "Home": lazy(() => import('./pages/Home')),
    "Login": lazy(() => import('./pages/Login')),
    "LocationDetail": lazy(() => import('./pages/LocationDetail')),
    "LocationPublic": lazy(() => import('./pages/LocationPublic')),
    "Pricing": lazy(() => import('./pages/Pricing')),
    "Privacy": lazy(() => import('./pages/Privacy')),
    "Profile": lazy(() => import('./pages/Profile')),
    "Support": lazy(() => import('./pages/Support')),
    "Terms": lazy(() => import('./pages/Terms')),
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};