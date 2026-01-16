// Map View Component
import { appState } from '../utils/state.js';

export function renderMapView() {
    return `
        <div class="container">
            <div class="map-container">
                <div id="map"></div>
                
                <div class="map-filters">
                    <div class="map-filter-group">
                        <button class="map-filter-btn active" data-filter="all">
                            All Locations
                        </button>
                        <button class="map-filter-btn" data-filter="visited">
                            Visited
                        </button>
                        <button class="map-filter-btn" data-filter="wishlist">
                            Wishlist
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Initialize map after DOM is loaded
if (typeof window !== 'undefined') {
    window.initMap = function () {
        const mapElement = document.getElementById('map');
        if (!mapElement || !window.L) return;

        // Clear existing map
        if (window.mapInstance) {
            window.mapInstance.remove();
        }

        // Create map
        const map = L.map('map').setView([48.8566, 2.3522], 4); // Center on Europe
        window.mapInstance = map;

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(map);

        // Get locations and state
        const state = appState.getState();
        const { locations, visited, wishlist } = state;

        // Create marker cluster group
        const markers = L.markerClusterGroup({
            maxClusterRadius: 50,
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false
        });

        // Add markers
        locations.forEach(location => {
            const isVisited = visited.includes(location.id);
            const isWishlisted = wishlist.includes(location.id);

            // Custom icon
            const iconHtml = isVisited ? '✅' : (isWishlisted ? '❤️' : '📍');
            const customIcon = L.divIcon({
                html: `<div style="font-size: 24px;">${iconHtml}</div>`,
                className: 'custom-marker',
                iconSize: [30, 30]
            });

            const marker = L.marker([location.latitude, location.longitude], {
                icon: customIcon
            });

            // Popup content
            const popupContent = `
                <div class="map-popup">
                    <h3 class="map-popup-title">${location.name}</h3>
                    <p class="map-popup-address">${location.address}</p>
                    <div style="margin-bottom: var(--space-3);">
                        <span class="badge badge-primary">${location.type}</span>
                        ${isVisited ? '<span class="badge badge-success">✓ Visited</span>' : ''}
                        ${isWishlisted && !isVisited ? '<span class="badge badge-warning">❤️ Wishlist</span>' : ''}
                    </div>
                    <div class="map-popup-actions">
                        <button class="btn btn-sm btn-primary" onclick="window.toggleWishlist(${location.id})">
                            ${isWishlisted ? 'Remove' : 'Add to Wishlist'}
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="window.toggleVisited(${location.id})">
                            ${isVisited ? 'Unmark' : 'Mark Visited'}
                        </button>
                    </div>
                </div>
            `;

            marker.bindPopup(popupContent);
            markers.addLayer(marker);
        });

        map.addLayer(markers);

        // Fit bounds to show all markers
        if (locations.length > 0) {
            const group = new L.featureGroup(locations.map(loc =>
                L.marker([loc.latitude, loc.longitude])
            ));
            map.fitBounds(group.getBounds().pad(0.1));
        }
    };

    // Auto-initialize if map element exists
    setTimeout(() => {
        const mapElement = document.getElementById('map');
        if (mapElement && window.L) {
            window.initMap();
        }
    }, 100);
}
