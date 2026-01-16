// Dashboard Page
import { router } from '../utils/router.js';
import { appState } from '../utils/state.js';
import { getLocationsByCountry, getCountryFlag } from '../data/mockData.js';
import { renderNavbar } from '../components/Navbar.js';
import { renderLocationCard } from '../components/LocationCard.js';
import { renderMapView } from '../components/MapView.js';
import { renderAIGuide } from '../components/AIGuide.js';

export function renderDashboard() {
    const state = appState.getState();

    if (!state.isAuthenticated) {
        router.navigate('/login');
        return;
    }

    const app = document.getElementById('app');

    app.innerHTML = `
        ${renderNavbar()}
        
        <div class="dashboard-page">
            <div class="dashboard-header">
                <div class="container">
                    <h1 class="dashboard-title">Discover Amazing Places</h1>
                    
                    <div class="dashboard-controls">
                        <div class="search-box">
                            <span class="search-icon">🔍</span>
                            <input type="text" 
                                   class="search-input" 
                                   id="searchInput"
                                   placeholder="Search locations, cities, cuisines...">
                        </div>
                        
                        <div class="toggle-group">
                            <button class="toggle-btn ${state.view === 'grid' ? 'active' : ''}" 
                                    onclick="window.switchView('grid')">
                                Grid
                            </button>
                            <button class="toggle-btn ${state.view === 'map' ? 'active' : ''}" 
                                    onclick="window.switchView('map')">
                                Map
                            </button>
                        </div>
                        
                        <div class="map-filter-group">
                            <button class="map-filter-btn ${state.filters.status === 'all' ? 'active' : ''}"
                                    onclick="window.setStatusFilter('all')">
                                All
                            </button>
                            <button class="map-filter-btn ${state.filters.status === 'visited' ? 'active' : ''}"
                                    onclick="window.setStatusFilter('visited')">
                                Visited
                            </button>
                            <button class="map-filter-btn ${state.filters.status === 'wishlist' ? 'active' : ''}"
                                    onclick="window.setStatusFilter('wishlist')">
                                Wishlist
                            </button>
                            <button class="map-filter-btn ${state.filters.status === 'not-visited' ? 'active' : ''}"
                                    onclick="window.setStatusFilter('not-visited')">
                                To Visit
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div id="dashboardContent" class="dashboard-content">
                ${state.view === 'grid' ? renderGridView() : renderMapView()}
            </div>
        </div>
        
        ${renderAIGuide()}
    `;

    // Setup event listeners
    setupDashboardListeners();
}

function renderGridView() {
    const state = appState.getState();
    const locationsByCountry = getLocationsByCountry();
    const { filters, wishlist, visited } = state;

    let html = '<div class="container">';

    Object.entries(locationsByCountry).forEach(([country, data]) => {
        const filteredLocations = filterLocations(data.locations, filters, wishlist, visited);

        if (filteredLocations.length === 0) return;

        html += `
            <div class="country-section">
                <div class="country-header">
                    <span class="country-flag">${getCountryFlag(data.code)}</span>
                    <h2 class="country-name">${country}</h2>
                    <span class="country-count">(${filteredLocations.length} locations)</span>
                </div>
                
                <div class="locations-grid">
                    ${filteredLocations.map(location => renderLocationCard(location)).join('')}
                </div>
            </div>
        `;
    });

    html += '</div>';

    return html;
}

function filterLocations(locations, filters, wishlist, visited) {
    let filtered = [...locations];

    // Filter by search
    if (filters.search) {
        const search = filters.search.toLowerCase();
        filtered = filtered.filter(loc =>
            loc.name.toLowerCase().includes(search) ||
            loc.city.toLowerCase().includes(search) ||
            loc.description.toLowerCase().includes(search) ||
            loc.tags.some(tag => tag.toLowerCase().includes(search))
        );
    }

    // Filter by status
    if (filters.status !== 'all') {
        filtered = filtered.filter(loc => {
            if (filters.status === 'visited') return visited.includes(loc.id);
            if (filters.status === 'wishlist') return wishlist.includes(loc.id);
            if (filters.status === 'not-visited') return !visited.includes(loc.id);
            return true;
        });
    }

    return filtered;
}

function setupDashboardListeners() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            appState.setFilter('search', e.target.value);
            updateDashboardContent();
        });
    }

    // View switcher
    window.switchView = (view) => {
        appState.setView(view);
        updateDashboardContent();
    };

    // Status filter
    window.setStatusFilter = (status) => {
        appState.setFilter('status', status);
        updateDashboardContent();
    };

    // Subscribe to state changes
    appState.subscribe(() => {
        const content = document.getElementById('dashboardContent');
        if (content) {
            const state = appState.getState();
            content.innerHTML = state.view === 'grid' ? renderGridView() : renderMapView();

            // Re-initialize map if in map view
            if (state.view === 'map') {
                setTimeout(() => {
                    if (window.initMap) window.initMap();
                }, 100);
            }
        }
    });
}

function updateDashboardContent() {
    const content = document.getElementById('dashboardContent');
    if (content) {
        const state = appState.getState();
        content.innerHTML = state.view === 'grid' ? renderGridView() : renderMapView();

        // Re-initialize map if in map view
        if (state.view === 'map') {
            setTimeout(() => {
                if (window.initMap) window.initMap();
            }, 100);
        }
    }
}
