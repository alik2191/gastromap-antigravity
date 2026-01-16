// Location Card Component
import { appState } from '../utils/state.js';

export function renderLocationCard(location) {
    const state = appState.getState();
    const isVisited = state.visited.includes(location.id);
    const isWishlisted = state.wishlist.includes(location.id);

    return `
        <div class="location-card animate-fadeIn">
            <img src="${location.image}" 
                 alt="${location.name}" 
                 class="location-card-image"
                 loading="lazy">
            
            <div class="location-card-overlay"></div>
            
            <div class="location-card-content">
                <h3 class="location-card-title">${location.name}</h3>
                <p class="location-card-description">${location.description}</p>
                
                <div class="location-card-footer">
                    <div class="location-card-badges">
                        <span class="badge badge-primary">${location.type}</span>
                        ${isVisited ? '<span class="badge badge-success">✓ Visited</span>' : ''}
                        ${isWishlisted && !isVisited ? '<span class="badge badge-warning">❤️ Wishlist</span>' : ''}
                    </div>
                    
                    <div class="location-card-actions">
                        <button class="btn btn-icon btn-sm" 
                                onclick="window.toggleWishlist(${location.id})"
                                title="${isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}">
                            <span style="font-size: 18px;">${isWishlisted ? '❤️' : '🤍'}</span>
                        </button>
                        <button class="btn btn-icon btn-sm" 
                                onclick="window.toggleVisited(${location.id})"
                                title="${isVisited ? 'Mark as not visited' : 'Mark as visited'}">
                            <span style="font-size: 18px;">${isVisited ? '✅' : '⬜'}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Global functions for location actions
if (typeof window !== 'undefined') {
    window.toggleWishlist = (locationId) => {
        const state = appState.getState();
        if (state.wishlist.includes(locationId)) {
            appState.removeFromWishlist(locationId);
        } else {
            appState.addToWishlist(locationId);
        }
    };

    window.toggleVisited = (locationId) => {
        const state = appState.getState();
        if (state.visited.includes(locationId)) {
            appState.unmarkAsVisited(locationId);
        } else {
            appState.markAsVisited(locationId);
        }
    };
}
