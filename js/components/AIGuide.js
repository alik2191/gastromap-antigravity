// AI Guide Component
import { appState } from '../utils/state.js';

export function renderAIGuide() {
    const state = appState.getState();

    return `
        <div class="ai-guide ${state.aiGuideOpen ? 'active' : ''}" id="aiGuide">
            <div class="ai-guide-header">
                <h2 class="ai-guide-title">AI Guide</h2>
                <button class="ai-guide-close" onclick="window.toggleAIGuide()">
                    ✕
                </button>
            </div>
            
            <div class="ai-guide-messages" id="aiMessages">
                <div class="ai-message bot">
                    <div class="ai-message-avatar bot">🤖</div>
                    <div class="ai-message-content">
                        Hello! I'm your AI culinary guide. I can help you discover amazing restaurants, cafes, and food spots based on your preferences. What are you looking for today?
                    </div>
                </div>
            </div>
            
            <div class="ai-guide-input-container">
                <div class="ai-guide-input-wrapper">
                    <input type="text" 
                           class="form-input ai-guide-input" 
                           id="aiInput"
                           placeholder="Ask me anything...">
                    <button class="btn btn-primary ai-guide-send" onclick="window.sendAIMessage()">
                        ➤
                    </button>
                </div>
            </div>
        </div>
    `;
}

// AI Guide functionality
if (typeof window !== 'undefined') {
    // Listen for toggle event
    window.addEventListener('aiGuideToggle', () => {
        const aiGuide = document.getElementById('aiGuide');
        if (aiGuide) {
            const state = appState.getState();
            if (state.aiGuideOpen) {
                aiGuide.classList.add('active');
            } else {
                aiGuide.classList.remove('active');
            }
        }
    });

    window.sendAIMessage = function () {
        const input = document.getElementById('aiInput');
        if (!input || !input.value.trim()) return;

        const message = input.value.trim();
        input.value = '';

        // Add user message
        addAIMessage(message, 'user');

        // Simulate AI response
        setTimeout(() => {
            const response = generateAIResponse(message);
            addAIMessage(response, 'bot');
        }, 1000);
    };

    function addAIMessage(content, sender) {
        const messagesContainer = document.getElementById('aiMessages');
        if (!messagesContainer) return;

        const messageHtml = `
            <div class="ai-message ${sender}">
                <div class="ai-message-avatar ${sender}">
                    ${sender === 'bot' ? '🤖' : appState.getState().user?.name?.charAt(0) || 'U'}
                </div>
                <div class="ai-message-content">
                    ${content}
                </div>
            </div>
        `;

        messagesContainer.insertAdjacentHTML('beforeend', messageHtml);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function generateAIResponse(message) {
        const lowerMessage = message.toLowerCase();
        const state = appState.getState();

        // Simple keyword matching for demo
        if (lowerMessage.includes('coffee') || lowerMessage.includes('cafe')) {
            const cafes = state.locations.filter(loc => loc.type.includes('☕'));
            if (cafes.length > 0) {
                const cafe = cafes[0];
                return `I recommend checking out <strong>${cafe.name}</strong> in ${cafe.city}! ${cafe.description}`;
            }
        }

        if (lowerMessage.includes('italian') || lowerMessage.includes('pasta')) {
            const italian = state.locations.filter(loc =>
                loc.tags.includes('Italian') || loc.tags.includes('Pasta')
            );
            if (italian.length > 0) {
                const restaurant = italian[0];
                return `For authentic Italian cuisine, I'd suggest <strong>${restaurant.name}</strong> in ${restaurant.city}. ${restaurant.description}`;
            }
        }

        if (lowerMessage.includes('fine dining') || lowerMessage.includes('michelin')) {
            const fineDining = state.locations.filter(loc =>
                loc.tags.includes('Michelin') || loc.tags.includes('Fine Dining')
            );
            if (fineDining.length > 0) {
                const restaurant = fineDining[0];
                return `For an exceptional fine dining experience, visit <strong>${restaurant.name}</strong> in ${restaurant.city}. ${restaurant.description}`;
            }
        }

        if (lowerMessage.includes('sushi') || lowerMessage.includes('japanese')) {
            const japanese = state.locations.filter(loc =>
                loc.tags.includes('Sushi') || loc.country === 'Japan'
            );
            if (japanese.length > 0) {
                const restaurant = japanese[0];
                return `For amazing Japanese cuisine, try <strong>${restaurant.name}</strong> in ${restaurant.city}. ${restaurant.description}`;
            }
        }

        // Default responses
        const defaults = [
            `I can help you find restaurants based on cuisine type, location, or dining style. Try asking about specific cuisines like Italian, Japanese, or French!`,
            `Looking for something specific? I can recommend cafes, fine dining restaurants, or casual eateries. Just let me know your preferences!`,
            `I have ${state.locations.length} amazing locations in my database. What type of cuisine are you in the mood for?`
        ];

        return defaults[Math.floor(Math.random() * defaults.length)];
    }

    // Handle Enter key in AI input
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.id === 'aiInput') {
            window.sendAIMessage();
        }
    });
}
