// Simple Router for SPA navigation
export class Router {
    constructor() {
        this.routes = {};
        this.currentRoute = '/';
        
        // Handle browser back/forward
        window.addEventListener('popstate', () => {
            this.navigate(window.location.pathname, false);
        });
    }
    
    // Register a route
    register(path, handler) {
        this.routes[path] = handler;
    }
    
    // Navigate to a route
    navigate(path, pushState = true) {
        if (this.routes[path]) {
            this.currentRoute = path;
            
            if (pushState) {
                window.history.pushState({}, '', path);
            }
            
            // Scroll to top
            window.scrollTo(0, 0);
            
            // Render the route
            this.routes[path]();
        } else {
            console.warn(`Route not found: ${path}`);
        }
    }
    
    // Get current route
    getCurrent() {
        return this.currentRoute;
    }
}

export const router = new Router();
