// Comprehensive Error Checker for Arobowl
// This script identifies and fixes common JavaScript errors

(function() {
    'use strict';
    
    console.log('🔍 Starting comprehensive error check...');
    
    // Check for missing functions
    const requiredFunctions = [
        'filterByCategory',
        'clearSearch',
        'clearCart',
        'closeProfileModal',
        'switchToEditProfile',
        'switchToViewProfile',
        'closeWishlistModal',
        'copyWishlistLink',
        'closeOrdersModal',
        'openCartSidebar',
        'viewProduct',
        'toggleWishlist',
        'shareProduct',
        'addToCart',
        'buyNow',
        'removeFromCart',
        'closeModal',
        'printProduct',
        'switchTab',
        'toggleFaq',
        'updateQuantity',
        'markNotificationRead',
        'closeAddressModal',
        'closeAddressFormModal',
        'closeQuantityModal',
        'selectAddress',
        'editAddress',
        'deleteAddress',
        'showAddressForm',
        'showNotification',
        'startCheckoutFlow'
    ];
    
    // Check for missing functions and create fallbacks
    requiredFunctions.forEach(funcName => {
        if (typeof window[funcName] === 'undefined') {
            console.warn(`⚠️ Missing function: ${funcName} - creating fallback`);
            
            // Create fallback function
            window[funcName] = function(...args) {
                console.log(`🔄 Fallback called for ${funcName} with args:`, args);
                
                // Special handling for specific functions
                if (funcName === 'clearCart') {
                    if (confirm('Are you sure you want to clear your cart?')) {
                        localStorage.removeItem('cart');
                        if (typeof updateCartCount === 'function') {
                            updateCartCount();
                        }
                        if (typeof showNotification === 'function') {
                            showNotification('Cart cleared successfully', 'success');
                        } else {
                            alert('Cart cleared successfully');
                        }
                    }
                    return;
                }
                
                if (funcName === 'openCartSidebar') {
                    if (typeof showNotification === 'function') {
                        showNotification('Cart sidebar feature coming soon', 'info');
                    } else {
                        alert('Cart sidebar feature coming soon');
                    }
                    return;
                }
                
                if (funcName === 'closeModal') {
                    // Try to close any open modals
                    const modals = document.querySelectorAll('.modal');
                    modals.forEach(modal => {
                        if (modal.style.display === 'block') {
                            modal.style.display = 'none';
                        }
                    });
                    return;
                }
                
                if (funcName === 'startCheckoutFlow') {
                    if (typeof showNotification === 'function') {
                        showNotification('Checkout system not loaded yet', 'warning');
                    } else {
                        alert('Checkout system not loaded yet');
                    }
                    return;
                }
                
                // Default fallback
                if (typeof showNotification === 'function') {
                    showNotification(`Function ${funcName} not implemented yet`, 'info');
                } else {
                    console.log(`Function ${funcName} not implemented yet`);
                }
            };
        }
    });
    
    // Check for missing global variables
    if (typeof window.razorpayConfig === 'undefined') {
        console.log('⚠️ razorpayConfig not found - initializing...');
        window.razorpayConfig = {
            keyId: null,
            checkoutData: {
                product: null,
                selectedAddress: null,
                quantity: 1,
                total: 0,
                deliveryCharge: 50
            },
            userAddresses: []
        };
    }
    
    // Check for missing DOM elements and create fallbacks
    function checkRequiredElements() {
        const requiredElements = [
            'addressList',
            'addressModal',
            'addressFormModal',
            'quantityModal'
        ];
        
        requiredElements.forEach(elementId => {
            const element = document.getElementById(elementId);
            if (!element) {
                console.warn(`⚠️ Required element not found: ${elementId}`);
            }
        });
    }
    
    // Check for console errors
    const originalConsoleError = console.error;
    console.error = function(...args) {
        console.log('🚨 Console Error Detected:', ...args);
        originalConsoleError.apply(console, args);
        
        // Try to fix common errors
        const errorMessage = args.join(' ');
        
        if (errorMessage.includes('razorpayConfig is not defined')) {
            console.log('🔧 Fixing razorpayConfig error...');
            if (typeof window.razorpayConfig === 'undefined') {
                window.razorpayConfig = {
                    keyId: null,
                    checkoutData: {
                        product: null,
                        selectedAddress: null,
                        quantity: 1,
                        total: 0,
                        deliveryCharge: 50
                    },
                    userAddresses: []
                };
            }
        }
        
        if (errorMessage.includes('function is not defined')) {
            console.log('🔧 Function not defined error detected');
        }
    };
    
    // Check for unhandled promise rejections
    window.addEventListener('unhandledrejection', function(event) {
        console.error('🚨 Unhandled Promise Rejection:', event.reason);
        event.preventDefault();
    });
    
    // Check for uncaught errors
    window.addEventListener('error', function(event) {
        console.error('🚨 Uncaught Error:', event.error);
    });
    
    // Initialize error checking
    function initializeErrorChecking() {
        console.log('✅ Error checking initialized');
        checkRequiredElements();
        
        // Check again after a delay to catch dynamically loaded elements
        setTimeout(checkRequiredElements, 1000);
        setTimeout(checkRequiredElements, 3000);
    }
    
    // Run initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeErrorChecking);
    } else {
        initializeErrorChecking();
    }
    
    // Export for global access
    window.errorChecker = {
        checkRequiredElements,
        requiredFunctions,
        initializeErrorChecking
    };
    
    console.log('✅ Comprehensive error checker loaded');
})();