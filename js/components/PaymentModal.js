// Payment Modal Component
import { appState } from '../utils/state.js';
import { router } from '../utils/router.js';
import { subscriptionManager, PLAN_FEATURES } from '../utils/subscriptionManager.js';

export function initPaymentModal() {
    // Listen for payment modal trigger
    window.addEventListener('showPayment', (e) => {
        const { tier } = e.detail;
        showPaymentModal(tier);
    });
}

function showPaymentModal(tier) {
    const plan = PLAN_FEATURES[tier];

    // Create modal overlay
    const modalHTML = `
        <div class="modal-overlay" id="paymentModal">
            <div class="modal-content payment-modal animate-scaleIn">
                <div class="modal-header">
                    <h2>Complete Your Purchase</h2>
                    <button class="modal-close" onclick="window.closePaymentModal()">✕</button>
                </div>
                
                <div class="modal-body">
                    <!-- Plan Summary -->
                    <div class="payment-summary">
                        <h3>Selected Plan: ${plan.name}</h3>
                        <div class="payment-amount">
                            <span class="amount">$${plan.price}</span>
                            <span class="interval">/${plan.interval}</span>
                        </div>
                        <p class="payment-note">Billed monthly. Cancel anytime.</p>
                    </div>
                    
                    <!-- Payment Form -->
                    <form id="paymentForm" class="payment-form">
                        <div class="form-group">
                            <label class="form-label">Card Number</label>
                            <input type="text" 
                                   class="form-input" 
                                   id="cardNumber"
                                   placeholder="1234 5678 9012 3456"
                                   maxlength="19"
                                   required>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Expiry Date</label>
                                <input type="text" 
                                       class="form-input" 
                                       id="cardExpiry"
                                       placeholder="MM/YY"
                                       maxlength="5"
                                       required>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">CVV</label>
                                <input type="text" 
                                       class="form-input" 
                                       id="cardCVV"
                                       placeholder="123"
                                       maxlength="3"
                                       required>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Cardholder Name</label>
                            <input type="text" 
                                   class="form-input" 
                                   id="cardName"
                                   placeholder="John Doe"
                                   required>
                        </div>
                        
                        <div class="payment-security">
                            <span>🔒</span>
                            <p>Your payment information is secure and encrypted</p>
                        </div>
                        
                        <button type="submit" class="btn btn-primary" style="width: 100%;">
                            Subscribe to ${plan.name} - $${plan.price}/${plan.interval}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    `;

    // Add to DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Add event listeners
    const form = document.getElementById('paymentForm');
    form.addEventListener('submit', (e) => handlePayment(e, tier));

    // Card number formatting
    const cardNumber = document.getElementById('cardNumber');
    cardNumber.addEventListener('input', formatCardNumber);

    // Expiry formatting
    const cardExpiry = document.getElementById('cardExpiry');
    cardExpiry.addEventListener('input', formatExpiry);

    // Close on overlay click
    const overlay = document.getElementById('paymentModal');
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closePaymentModal();
        }
    });
}

function formatCardNumber(e) {
    let value = e.target.value.replace(/\s/g, '');
    let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
    e.target.value = formattedValue;
}

function formatExpiry(e) {
    let value = e.target.value.replace(/\//g, '');
    if (value.length >= 2) {
        value = value.slice(0, 2) + '/' + value.slice(2, 4);
    }
    e.target.value = value;
}

async function handlePayment(e, tier) {
    e.preventDefault();

    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    // Disable button and show loading
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
        // Get user
        const state = appState.getState();
        const userId = state.user.id || state.user.email;

        // Process payment (mock)
        const subscription = subscriptionManager.purchaseSubscription(userId, tier, {
            method: 'card',
            last4: document.getElementById('cardNumber').value.slice(-4)
        });

        // Update app state
        appState.updateSubscription(subscription);

        // Close modal
        closePaymentModal();

        // Show success message
        showSuccessMessage(tier);

        // Redirect to dashboard
        setTimeout(() => {
            router.navigate('/dashboard');
        }, 2000);

    } catch (error) {
        console.error('Payment failed:', error);
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        alert('Payment failed. Please try again.');
    }
}

function closePaymentModal() {
    const modal = document.getElementById('paymentModal');
    if (modal) {
        modal.remove();
    }
}

function showSuccessMessage(tier) {
    const plan = PLAN_FEATURES[tier];
    const successHTML = `
        <div class="modal-overlay" id="successModal">
            <div class="modal-content success-modal animate-scaleIn">
                <div class="success-icon">🎉</div>
                <h2>Welcome to ${plan.name}!</h2>
                <p>Your subscription is now active. Enjoy unlimited access to all features!</p>
                <button class="btn btn-primary" onclick="document.getElementById('successModal').remove()">
                    Get Started
                </button>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', successHTML);

    // Auto-close after 3 seconds
    setTimeout(() => {
        const modal = document.getElementById('successModal');
        if (modal) modal.remove();
    }, 3000);
}

// Expose global function
if (typeof window !== 'undefined') {
    window.closePaymentModal = closePaymentModal;
}
