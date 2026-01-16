// Global state management
import { subscriptionManager } from './subscriptionManager.js';

class AppState {
    constructor() {
        this.state = {
            user: null,
            isAuthenticated: false,
            subscription: null,
            locations: [],
            wishlist: [],
            visited: [],
            achievements: [],
            filters: {
                search: '',
                status: 'all', // all, visited, wishlist, not-visited
                country: 'all'
            },
            view: 'grid', // grid or map
            aiGuideOpen: false
        };

        this.listeners = [];

        // Load from localStorage
        this.loadFromStorage();
    }

    // Subscribe to state changes
    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    // Notify all listeners
    notify() {
        this.listeners.forEach(listener => listener(this.state));
    }

    // Update state
    setState(updates) {
        this.state = { ...this.state, ...updates };
        this.saveToStorage();
        this.notify();
    }

    // Get current state
    getState() {
        return this.state;
    }

    // User actions
    login(user) {
        // Load user's subscription
        const subscription = subscriptionManager.getSubscription(user.id || user.email);

        this.setState({
            user,
            isAuthenticated: true,
            subscription
        });
    }

    // Update subscription
    updateSubscription(subscription) {
        this.setState({ subscription });
    }

    // Check if user has paid subscription
    hasPaidSubscription() {
        return this.state.subscription &&
            this.state.subscription.tier !== 'free' &&
            this.state.subscription.status === 'active';
    }

    logout() {
        this.setState({
            user: null,
            isAuthenticated: false,
            subscription: null
        });
        localStorage.removeItem('gastromap_user');
    }

    // Location actions
    setLocations(locations) {
        this.setState({ locations });
    }

    addToWishlist(locationId) {
        const wishlist = [...this.state.wishlist];
        if (!wishlist.includes(locationId)) {
            wishlist.push(locationId);
            this.setState({ wishlist });
        }
    }

    removeFromWishlist(locationId) {
        const wishlist = this.state.wishlist.filter(id => id !== locationId);
        this.setState({ wishlist });
    }

    markAsVisited(locationId) {
        const visited = [...this.state.visited];
        if (!visited.includes(locationId)) {
            visited.push(locationId);
            this.setState({ visited });
            this.checkAchievements();
        }
    }

    unmarkAsVisited(locationId) {
        const visited = this.state.visited.filter(id => id !== locationId);
        this.setState({ visited });
    }

    // Filter actions
    setFilter(key, value) {
        this.setState({
            filters: {
                ...this.state.filters,
                [key]: value
            }
        });
    }

    // View actions
    setView(view) {
        this.setState({ view });
    }

    toggleAIGuide() {
        this.setState({ aiGuideOpen: !this.state.aiGuideOpen });
    }

    // Achievements
    checkAchievements() {
        const visitedCount = this.state.visited.length;
        const achievements = [...this.state.achievements];

        // First visit achievement
        if (visitedCount >= 1 && !achievements.find(a => a.id === 'first_visit')) {
            achievements.push({
                id: 'first_visit',
                unlocked: true,
                unlockedAt: new Date().toISOString()
            });
        }

        // Explorer achievement (5 visits)
        if (visitedCount >= 5 && !achievements.find(a => a.id === 'explorer')) {
            achievements.push({
                id: 'explorer',
                unlocked: true,
                unlockedAt: new Date().toISOString()
            });
        }

        // World Traveler achievement (10 visits)
        if (visitedCount >= 10 && !achievements.find(a => a.id === 'world_traveler')) {
            achievements.push({
                id: 'world_traveler',
                unlocked: true,
                unlockedAt: new Date().toISOString()
            });
        }

        this.setState({ achievements });
    }

    // Persistence
    saveToStorage() {
        try {
            localStorage.setItem('gastromap_state', JSON.stringify({
                user: this.state.user,
                isAuthenticated: this.state.isAuthenticated,
                subscription: this.state.subscription,
                wishlist: this.state.wishlist,
                visited: this.state.visited,
                achievements: this.state.achievements
            }));
        } catch (e) {
            console.error('Failed to save state:', e);
        }
    }

    loadFromStorage() {
        try {
            const saved = localStorage.getItem('gastromap_state');
            if (saved) {
                const data = JSON.parse(saved);
                this.state = { ...this.state, ...data };
            }
        } catch (e) {
            console.error('Failed to load state:', e);
        }
    }
}

export const appState = new AppState();
