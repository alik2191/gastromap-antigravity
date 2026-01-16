// Profile Page
import { router } from '../utils/router.js';
import { appState } from '../utils/state.js';
import { achievementDefinitions } from '../data/mockData.js';
import { renderNavbar } from '../components/Navbar.js';

export function renderProfile() {
    const state = appState.getState();

    if (!state.isAuthenticated) {
        router.navigate('/login');
        return;
    }

    const app = document.getElementById('app');
    const { user, visited, wishlist, locations, achievements } = state;

    // Calculate stats
    const visitedCount = visited.length;
    const wishlistCount = wishlist.length;
    const countriesVisited = new Set(
        visited.map(id => locations.find(l => l.id === id)?.country).filter(Boolean)
    ).size;

    app.innerHTML = `
        ${renderNavbar()}
        
        <div class="profile-page">
            <div class="profile-header">
                <div class="container">
                    <div class="profile-info">
                        <div class="profile-avatar">
                            ${user?.name?.charAt(0) || 'U'}
                        </div>
                        <div class="profile-details">
                            <h1>${user?.name || 'User'}</h1>
                            <p class="profile-email">${user?.email || 'user@example.com'}</p>
                            ${user?.role === 'admin' ? '<span class="badge badge-primary" style="margin-top: var(--space-2);">👑 Admin</span>' : ''}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="profile-content">
                <div class="container">
                    <!-- Stats -->
                    <div class="profile-stats">
                        <div class="stats-card">
                            <div class="stats-card-value">${visitedCount}</div>
                            <div class="stats-card-label">Places Visited</div>
                        </div>
                        <div class="stats-card" style="background: var(--gradient-secondary);">
                            <div class="stats-card-value">${countriesVisited}</div>
                            <div class="stats-card-label">Countries</div>
                        </div>
                        <div class="stats-card" style="background: var(--gradient-accent);">
                            <div class="stats-card-value">${wishlistCount}</div>
                            <div class="stats-card-label">Wishlist</div>
                        </div>
                        <div class="stats-card" style="background: var(--gradient-warm);">
                            <div class="stats-card-value">${achievements.length}</div>
                            <div class="stats-card-label">Achievements</div>
                        </div>
                    </div>
                    
                    <!-- Tabs -->
                    <div class="tabs">
                        <ul class="tabs-list">
                            <li>
                                <button class="tab-button active" data-tab="achievements">
                                    Achievements
                                </button>
                            </li>
                            <li>
                                <button class="tab-button" data-tab="visited">
                                    Visited (${visitedCount})
                                </button>
                            </li>
                            <li>
                                <button class="tab-button" data-tab="wishlist">
                                    Wishlist (${wishlistCount})
                                </button>
                            </li>
                        </ul>
                    </div>
                    
                    <!-- Tab Content -->
                    <div id="tabContent">
                        ${renderAchievementsTab(achievements, visitedCount, countriesVisited)}
                    </div>
                </div>
            </div>
        </div>
    `;

    setupProfileListeners();
}

function renderAchievementsTab(unlockedAchievements, visitedCount, countriesVisited) {
    return `
        <div class="achievements-grid">
            ${achievementDefinitions.map(achievement => {
        const isUnlocked = unlockedAchievements.some(a => a.id === achievement.id);
        let progress = 0;

        // Calculate progress
        if (achievement.id.includes('visit')) {
            progress = Math.min(100, (visitedCount / achievement.requirement) * 100);
        } else if (achievement.id === 'country_collector') {
            progress = Math.min(100, (countriesVisited / achievement.requirement) * 100);
        }

        return `
                    <div class="achievement-card ${isUnlocked ? '' : 'locked'}">
                        <div class="achievement-icon ${achievement.tier} ${isUnlocked ? '' : 'locked'}">
                            ${achievement.icon}
                        </div>
                        <div class="achievement-info">
                            <h3 class="achievement-title">${achievement.title}</h3>
                            <p class="achievement-description">${achievement.description}</p>
                            ${!isUnlocked ? `
                                <div class="achievement-progress">
                                    <div class="achievement-progress-bar" style="width: ${progress}%"></div>
                                </div>
                            ` : '<span class="badge badge-success">✓ Unlocked</span>'}
                        </div>
                    </div>
                `;
    }).join('')}
        </div>
    `;
}

function renderVisitedTab() {
    const state = appState.getState();
    const { visited, locations } = state;

    const visitedLocations = visited.map(id => locations.find(l => l.id === id)).filter(Boolean);

    if (visitedLocations.length === 0) {
        return `
            <div style="text-align: center; padding: var(--space-16);">
                <p style="font-size: var(--font-size-lg); color: var(--color-text-secondary);">
                    You haven't visited any locations yet. Start exploring!
                </p>
            </div>
        `;
    }

    return `
        <div class="locations-grid">
            ${visitedLocations.map(location => `
                <div class="location-card">
                    <img src="${location.image}" alt="${location.name}" class="location-card-image">
                    <div class="location-card-content">
                        <h3 class="location-card-title">${location.name}</h3>
                        <p class="location-card-description">${location.city}, ${location.country}</p>
                        <span class="badge badge-success">✓ Visited</span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderWishlistTab() {
    const state = appState.getState();
    const { wishlist, locations } = state;

    const wishlistLocations = wishlist.map(id => locations.find(l => l.id === id)).filter(Boolean);

    if (wishlistLocations.length === 0) {
        return `
            <div style="text-align: center; padding: var(--space-16);">
                <p style="font-size: var(--font-size-lg); color: var(--color-text-secondary);">
                    Your wishlist is empty. Add some amazing places to visit later!
                </p>
            </div>
        `;
    }

    return `
        <div class="locations-grid">
            ${wishlistLocations.map(location => `
                <div class="location-card">
                    <img src="${location.image}" alt="${location.name}" class="location-card-image">
                    <div class="location-card-content">
                        <h3 class="location-card-title">${location.name}</h3>
                        <p class="location-card-description">${location.city}, ${location.country}</p>
                        <span class="badge badge-warning">❤️ Wishlist</span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function setupProfileListeners() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContent = document.getElementById('tabContent');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active state
            tabButtons.forEach(b => b.classList.remove('active'));
            button.classList.add('active');

            // Render tab content
            const tab = button.dataset.tab;
            const state = appState.getState();

            if (tab === 'achievements') {
                const visitedCount = state.visited.length;
                const countriesVisited = new Set(
                    state.visited.map(id => state.locations.find(l => l.id === id)?.country).filter(Boolean)
                ).size;
                tabContent.innerHTML = renderAchievementsTab(state.achievements, visitedCount, countriesVisited);
            } else if (tab === 'visited') {
                tabContent.innerHTML = renderVisitedTab();
            } else if (tab === 'wishlist') {
                tabContent.innerHTML = renderWishlistTab();
            }
        });
    });
}
