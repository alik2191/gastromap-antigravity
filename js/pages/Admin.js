// Admin Page
import { router } from '../utils/router.js';
import { appState } from '../utils/state.js';
import { mockUsers } from '../data/mockData.js';
import { renderNavbar } from '../components/Navbar.js';

export function renderAdmin() {
    const state = appState.getState();

    if (!state.isAuthenticated || state.user?.role !== 'admin') {
        router.navigate('/dashboard');
        return;
    }

    const app = document.getElementById('app');
    const { locations } = state;

    // Calculate metrics
    const totalLocations = locations.length;
    const totalUsers = mockUsers.length;
    const premiumUsers = mockUsers.filter(u => u.subscription === 'premium').length;
    const totalRevenue = premiumUsers * 9.99; // Simple calculation

    app.innerHTML = `
        ${renderNavbar()}
        
        <div class="admin-page">
            <div class="admin-header">
                <div class="container">
                    <h1>Admin Dashboard</h1>
                    <p style="opacity: 0.9; margin-top: var(--space-2);">Manage locations, users, and platform settings</p>
                </div>
            </div>
            
            <div class="admin-content">
                <div class="container">
                    <!-- Metrics -->
                    <div class="admin-metrics">
                        <div class="metric-card">
                            <div class="metric-icon" style="background: var(--gradient-primary);">
                                🗺️
                            </div>
                            <div class="metric-info">
                                <h3>${totalLocations}</h3>
                                <p class="metric-label">Total Locations</p>
                            </div>
                        </div>
                        
                        <div class="metric-card">
                            <div class="metric-icon" style="background: var(--gradient-accent);">
                                👥
                            </div>
                            <div class="metric-info">
                                <h3>${totalUsers}</h3>
                                <p class="metric-label">Active Users</p>
                            </div>
                        </div>
                        
                        <div class="metric-card">
                            <div class="metric-icon" style="background: var(--gradient-secondary);">
                                ⭐
                            </div>
                            <div class="metric-info">
                                <h3>${premiumUsers}</h3>
                                <p class="metric-label">Premium Users</p>
                            </div>
                        </div>
                        
                        <div class="metric-card">
                            <div class="metric-icon" style="background: var(--gradient-warm);">
                                💰
                            </div>
                            <div class="metric-info">
                                <h3>$${totalRevenue.toFixed(2)}</h3>
                                <p class="metric-label">Monthly Revenue</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Tabs -->
                    <div class="tabs">
                        <ul class="tabs-list">
                            <li>
                                <button class="tab-button active" data-tab="overview">
                                    Overview
                                </button>
                            </li>
                            <li>
                                <button class="tab-button" data-tab="locations">
                                    Locations (${totalLocations})
                                </button>
                            </li>
                            <li>
                                <button class="tab-button" data-tab="users">
                                    Users (${totalUsers})
                                </button>
                            </li>
                            <li>
                                <button class="tab-button" data-tab="analytics">
                                    Analytics
                                </button>
                            </li>
                        </ul>
                    </div>
                    
                    <!-- Tab Content -->
                    <div id="adminTabContent">
                        ${renderOverviewTab(state)}
                    </div>
                </div>
            </div>
        </div>
    `;

    setupAdminListeners();
}

function renderOverviewTab(state) {
    const recentLocations = state.locations.slice(0, 5);

    return `
        <div>
            <h2 style="margin-bottom: var(--space-6);">Recent Locations</h2>
            <div class="data-table">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>City</th>
                            <th>Country</th>
                            <th>Type</th>
                            <th>Rating</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${recentLocations.map(location => `
                            <tr>
                                <td><strong>${location.name}</strong></td>
                                <td>${location.city}</td>
                                <td>${location.country}</td>
                                <td><span class="badge badge-primary">${location.type}</span></td>
                                <td>⭐ ${location.rating}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderLocationsTab(state) {
    return `
        <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-6);">
                <h2>All Locations</h2>
                <button class="btn btn-primary">
                    + Add Location
                </button>
            </div>
            
            <div class="data-table">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>City</th>
                            <th>Country</th>
                            <th>Type</th>
                            <th>Rating</th>
                            <th>Tags</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${state.locations.map(location => `
                            <tr>
                                <td><strong>${location.name}</strong></td>
                                <td>${location.city}</td>
                                <td>${location.country}</td>
                                <td><span class="badge badge-primary">${location.type}</span></td>
                                <td>⭐ ${location.rating}</td>
                                <td>
                                    ${location.tags.slice(0, 2).map(tag =>
        `<span class="badge badge-primary" style="margin-right: 4px;">${tag}</span>`
    ).join('')}
                                </td>
                                <td>
                                    <button class="btn btn-sm btn-ghost">Edit</button>
                                    <button class="btn btn-sm btn-ghost" style="color: var(--color-error);">Delete</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderUsersTab() {
    return `
        <div>
            <h2 style="margin-bottom: var(--space-6);">User Management</h2>
            
            <div class="data-table">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Joined</th>
                            <th>Visits</th>
                            <th>Subscription</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${mockUsers.map(user => `
                            <tr>
                                <td><strong>${user.name}</strong></td>
                                <td>${user.email}</td>
                                <td>
                                    <span class="badge ${user.role === 'admin' ? 'badge-primary' : 'badge-success'}">
                                        ${user.role === 'admin' ? '👑 Admin' : 'User'}
                                    </span>
                                </td>
                                <td>${user.joinedAt}</td>
                                <td>${user.visitedCount}</td>
                                <td>
                                    <span class="badge ${user.subscription === 'premium' ? 'badge-warning' : 'badge-success'}">
                                        ${user.subscription === 'premium' ? '⭐ Premium' : 'Free'}
                                    </span>
                                </td>
                                <td>
                                    <button class="btn btn-sm btn-ghost">View</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderAnalyticsTab() {
    return `
        <div>
            <h2 style="margin-bottom: var(--space-6);">Analytics & Insights</h2>
            
            <div class="grid grid-cols-2" style="margin-bottom: var(--space-8);">
                <div class="card">
                    <h3 style="margin-bottom: var(--space-4);">Top Countries</h3>
                    <div style="display: flex; flex-direction: column; gap: var(--space-3);">
                        <div style="display: flex; justify-content: space-between;">
                            <span>🇵🇱 Poland</span>
                            <strong>3 locations</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span>🇮🇹 Italy</span>
                            <strong>3 locations</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span>🇺🇸 USA</span>
                            <strong>3 locations</strong>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <h3 style="margin-bottom: var(--space-4);">Popular Types</h3>
                    <div style="display: flex; flex-direction: column; gap: var(--space-3);">
                        <div style="display: flex; justify-content: space-between;">
                            <span>🍴 Restaurant</span>
                            <strong>8 locations</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span>☕ Cafe</span>
                            <strong>3 locations</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span>🍣 Sushi</span>
                            <strong>1 location</strong>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <h3 style="margin-bottom: var(--space-4);">User Engagement</h3>
                <p style="color: var(--color-text-secondary);">
                    Average visits per user: <strong>8.7</strong><br>
                    Most active user: <strong>Admin User (45 visits)</strong><br>
                    Total visits tracked: <strong>65</strong>
                </p>
            </div>
        </div>
    `;
}

function setupAdminListeners() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContent = document.getElementById('adminTabContent');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active state
            tabButtons.forEach(b => b.classList.remove('active'));
            button.classList.add('active');

            // Render tab content
            const tab = button.dataset.tab;
            const state = appState.getState();

            if (tab === 'overview') {
                tabContent.innerHTML = renderOverviewTab(state);
            } else if (tab === 'locations') {
                tabContent.innerHTML = renderLocationsTab(state);
            } else if (tab === 'users') {
                tabContent.innerHTML = renderUsersTab();
            } else if (tab === 'analytics') {
                tabContent.innerHTML = renderAnalyticsTab();
            }
        });
    });
}
