// Enhanced Cart and Wishlist Management System
console.log('🔄 Loading enhanced cart and wishlist system...');

class CartWishlistManager {
    constructor() {
        this.cart = [];
        this.wishlist = [];
        this.isInitialized = false;
        this.init();
    }

    async init() {
        try {
            await this.loadCartFromDatabase();
            await this.loadWishlistFromDatabase();
            this.setupEventListeners();
            this.updateUI();
            this.isInitialized = true;
            console.log('✅ Cart and Wishlist system initialized');
        } catch (error) {
            console.error('❌ Error initializing cart/wishlist system:', error);
        }
    }

    // Database Integration Methods
    async loadCartFromDatabase() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch('/api/cart', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const cartData = await response.json();
                this.cart = cartData.map(item => ({
                    id: item.product._id || item.product,
                    name: item.product.name || 'Unknown Product',
                    price: item.product.price || 0,
                    image: item.product.image || item.product.images?.[0] || '/uploads/default-product.jpg',
                    quantity: item.quantity || 1,
                    stock: item.product.stock || 0
                }));
                console.log('✅ Cart loaded from database:', this.cart);
            }
        } catch (error) {
            console.error('❌ Error loading cart from database:', error);
        }
    }

    async loadWishlistFromDatabase() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch('/api/wishlist', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const wishlistData = await response.json();
                this.wishlist = wishlistData.map(item => ({
                    id: item._id || item,
                    name: item.name || 'Unknown Product',
                    price: item.price || 0,
                    image: item.image || item.images?.[0] || '/uploads/default-product.jpg',
                    stock: item.stock || 0
                }));
                console.log('✅ Wishlist loaded from database:', this.wishlist);
            }
        } catch (error) {
            console.error('❌ Error loading wishlist from database:', error);
        }
    }

    // Cart Methods
    async addToCart(productId, quantity = 1) {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                this.showNotification('Please login to add items to cart', 'warning');
                return false;
            }

            // Check if product is already in cart
            const existingItem = this.cart.find(item => item.id === productId);
            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                // Get product details
                const product = await this.getProductDetails(productId);
                if (!product) {
                    this.showNotification('Product not found', 'error');
                    return false;
                }

                this.cart.push({
                    id: productId,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                    quantity: quantity,
                    stock: product.stock
                });
            }

            // Save to database
            const response = await fetch('/api/cart/add', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    productId: productId,
                    quantity: quantity
                })
            });

            if (response.ok) {
                this.updateUI();
                this.showNotification('Product added to cart!', 'success');
                return true;
            } else {
                const error = await response.json();
                this.showNotification(error.message || 'Failed to add to cart', 'error');
                return false;
            }
        } catch (error) {
            console.error('❌ Error adding to cart:', error);
            this.showNotification('Error adding to cart', 'error');
            return false;
        }
    }

    async removeFromCart(productId) {
        try {
            const token = localStorage.getItem('token');
            if (!token) return false;

            // Remove from local cart
            this.cart = this.cart.filter(item => item.id !== productId);

            // Remove from database
            const response = await fetch('/api/cart/remove', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ productId })
            });

            if (response.ok) {
                this.updateUI();
                this.showNotification('Product removed from cart', 'success');
                return true;
            }
        } catch (error) {
            console.error('❌ Error removing from cart:', error);
        }
        return false;
    }

    async updateCartQuantity(productId, newQuantity) {
        try {
            const token = localStorage.getItem('token');
            if (!token) return false;

            const cartItem = this.cart.find(item => item.id === productId);
            if (!cartItem) return false;

            cartItem.quantity = Math.max(1, newQuantity);

            // Update in database
            const response = await fetch('/api/cart/update', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    productId: productId,
                    quantity: newQuantity
                })
            });

            if (response.ok) {
                this.updateUI();
                return true;
            }
        } catch (error) {
            console.error('❌ Error updating cart quantity:', error);
        }
        return false;
    }

    async clearCart() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return false;

            // Clear local cart
            this.cart = [];

            // Clear database cart
            const response = await fetch('/api/cart/clear', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                this.updateUI();
                this.showNotification('Cart cleared successfully', 'success');
                return true;
            }
        } catch (error) {
            console.error('❌ Error clearing cart:', error);
        }
        return false;
    }

    // Wishlist Methods
    async addToWishlist(productId) {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                this.showNotification('Please login to add items to wishlist', 'warning');
                return false;
            }

            // Check if already in wishlist
            if (this.wishlist.find(item => item.id === productId)) {
                this.showNotification('Product already in wishlist', 'info');
                return false;
            }

            // Get product details
            const product = await this.getProductDetails(productId);
            if (!product) {
                this.showNotification('Product not found', 'error');
                return false;
            }

            // Add to local wishlist
            this.wishlist.push({
                id: productId,
                name: product.name,
                price: product.price,
                image: product.image,
                stock: product.stock
            });

            // Save to database
            const response = await fetch('/api/wishlist/add', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ itemId: productId })
            });

            if (response.ok) {
                this.updateUI();
                this.showNotification('Product added to wishlist!', 'success');
                return true;
            } else {
                const error = await response.json();
                this.showNotification(error.message || 'Failed to add to wishlist', 'error');
                return false;
            }
        } catch (error) {
            console.error('❌ Error adding to wishlist:', error);
            this.showNotification('Error adding to wishlist', 'error');
            return false;
        }
    }

    async removeFromWishlist(productId) {
        try {
            const token = localStorage.getItem('token');
            if (!token) return false;

            // Remove from local wishlist
            this.wishlist = this.wishlist.filter(item => item.id !== productId);

            // Remove from database
            const response = await fetch('/api/wishlist/remove', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ itemId: productId })
            });

            if (response.ok) {
                this.updateUI();
                this.showNotification('Product removed from wishlist', 'success');
                return true;
            }
        } catch (error) {
            console.error('❌ Error removing from wishlist:', error);
        }
        return false;
    }

    // Utility Methods
    async getProductDetails(productId) {
        try {
            const response = await fetch(`/api/items/${productId}`);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('❌ Error fetching product details:', error);
        }
        return null;
    }

    getCartTotal() {
        return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    getCartCount() {
        return this.cart.reduce((count, item) => count + item.quantity, 0);
    }

    getWishlistCount() {
        return this.wishlist.length;
    }

    // UI Update Methods
    updateUI() {
        this.renderCart();
        this.renderWishlist();
        
        // Update cart count in header
        const cartCountElements = document.querySelectorAll('[id*="cartCount"], .cart-count');
        cartCountElements.forEach(element => {
            const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
            element.textContent = totalItems;
        });
        
        // Update wishlist count in header
        const wishlistCountElements = document.querySelectorAll('[id*="wishlistCount"], .wishlist-count');
        wishlistCountElements.forEach(element => {
            element.textContent = this.wishlist.length;
        });
    }

    updateCartCount() {
        const cartCountElements = document.querySelectorAll('[id*="cartCount"], [id*="CartCount"]');
        cartCountElements.forEach(element => {
            element.textContent = this.getCartCount();
        });
    }

    updateWishlistCount() {
        const wishlistCountElements = document.querySelectorAll('[id*="wishlistCount"], [id*="WishlistCount"]');
        wishlistCountElements.forEach(element => {
            element.textContent = this.getWishlistCount();
        });
    }

    updateCartSidebar() {
        const cartItemsContainer = document.getElementById('cartItems');
        const cartSubtotal = document.getElementById('cartSubtotal');
        const cartTotal = document.getElementById('cartTotal');
        const checkoutBtn = document.getElementById('checkoutCartBtn');

        if (!cartItemsContainer) return;

        if (this.cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
            if (cartSubtotal) cartSubtotal.textContent = '₹0';
            if (cartTotal) cartTotal.textContent = '₹0';
            if (checkoutBtn) checkoutBtn.disabled = true;
            return;
        }

        if (checkoutBtn) checkoutBtn.disabled = false;

        const cartHTML = this.cart.map(item => `
            <div class="cart-item" data-product-id="${item.id}">
                <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <div class="quantity-controls">
                        <button onclick="cartManager.updateCartQuantity('${item.id}', ${item.quantity - 1})" 
                                class="qty-btn" ${item.quantity <= 1 ? 'disabled' : ''}>-</button>
                        <span class="quantity">${item.quantity}</span>
                        <button onclick="cartManager.updateCartQuantity('${item.id}', ${item.quantity + 1})" 
                                class="qty-btn">+</button>
                    </div>
                    <p class="item-price">₹${item.price} x ${item.quantity}</p>
                </div>
                <div class="cart-item-actions">
                    <span class="item-total">₹${(item.price * item.quantity).toFixed(2)}</span>
                    <button onclick="cartManager.removeFromCart('${item.id}')" class="remove-item">×</button>
                </div>
            </div>
        `).join('');

        cartItemsContainer.innerHTML = cartHTML;

        const total = this.getCartTotal();
        if (cartSubtotal) cartSubtotal.textContent = `₹${total.toFixed(2)}`;
        if (cartTotal) cartTotal.textContent = `₹${total.toFixed(2)}`;
    }

    updateWishlistModal() {
        const wishlistContent = document.getElementById('wishlistContent');
        if (!wishlistContent) return;

        if (this.wishlist.length === 0) {
            wishlistContent.innerHTML = '<p class="text-gray-500 text-center py-8">Your wishlist is empty</p>';
            return;
        }

        const wishlistHTML = this.wishlist.map(item => `
            <div class="wishlist-item" data-product-id="${item.id}">
                <img src="${item.image}" alt="${item.name}" class="wishlist-item-image">
                <div class="wishlist-item-details">
                    <h4>${item.name}</h4>
                    <p class="item-price">₹${item.price}</p>
                </div>
                <div class="wishlist-item-actions">
                    <button onclick="cartManager.addToCart('${item.id}')" class="btn-add-to-cart">
                        Add to Cart
                    </button>
                    <button onclick="cartManager.removeFromWishlist('${item.id}')" class="btn-remove-wishlist">
                        Remove
                    </button>
                </div>
            </div>
        `).join('');

        wishlistContent.innerHTML = wishlistHTML;
    }

    // Event Listeners
    setupEventListeners() {
        // Cart toggle
        const cartToggleElements = document.querySelectorAll('[onclick*="toggleCart"], [onclick*="openCart"]');
        cartToggleElements.forEach(element => {
            element.onclick = () => this.toggleCart();
        });

        // Wishlist toggle
        const wishlistToggleElements = document.querySelectorAll('[onclick*="viewWishlist"], [onclick*="openWishlist"]');
        wishlistToggleElements.forEach(element => {
            element.onclick = () => this.toggleWishlist();
        });

        // Checkout button
        const checkoutBtn = document.getElementById('checkoutCartBtn');
        if (checkoutBtn) {
            checkoutBtn.onclick = () => this.proceedToCheckout();
        }

        // Clear cart button
        const clearCartBtn = document.getElementById('clearCartBtn');
        if (clearCartBtn) {
            clearCartBtn.onclick = () => this.clearCart();
        }
    }

    // UI Toggle Methods
    toggleCart() {
        const cartSidebar = document.getElementById('cartSidebar');
        if (cartSidebar) {
            cartSidebar.classList.toggle('active');
        }
    }

    toggleWishlist() {
        const wishlistModal = document.getElementById('wishlistModal');
        if (wishlistModal) {
            wishlistModal.style.display = wishlistModal.style.display === 'none' ? 'block' : 'none';
        }
    }

    // Checkout Methods
    proceedToCheckout() {
        if (this.cart.length === 0) {
            this.showNotification('Your cart is empty!', 'warning');
            return;
        }

        // Check if user is logged in
        const token = localStorage.getItem('token');
        if (!token) {
            this.showNotification('Please login to proceed to checkout', 'warning');
            // Redirect to login page
            window.location.href = 'login.html';
            return;
        }

        try {
            // Store cart data for checkout
            localStorage.setItem('checkoutCart', JSON.stringify(this.cart));
            localStorage.setItem('checkoutTotal', this.calculateTotal());
            
            // Redirect to checkout page
            window.location.href = 'enhanced-checkout.html';
        } catch (error) {
            console.error('Error proceeding to checkout:', error);
            this.showNotification('Error proceeding to checkout. Please try again.', 'error');
        }
    }

    // Calculate total for checkout
    calculateTotal() {
        return this.cart.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
    }

    // Notification System
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">×</button>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    // Public API Methods
    async refreshData() {
        await this.loadCartFromDatabase();
        await this.loadWishlistFromDatabase();
        this.updateUI();
    }

    // Render cart items with enhanced UI
    renderCart() {
        const cartItems = document.getElementById('cartItems');
        const cartCount = document.getElementById('cartCount');
        const cartSubtotal = document.getElementById('cartSubtotal');
        const cartTotal = document.getElementById('cartTotal');
        
        if (!cartItems) return;

        if (this.cart.length === 0) {
            cartItems.innerHTML = `
                <div class="empty-cart text-center py-8">
                    <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-shopping-cart text-gray-400 text-2xl"></i>
                    </div>
                    <p class="text-gray-500 text-lg font-medium mb-2">Your cart is empty</p>
                    <p class="text-gray-400 text-sm">Add some products to get started!</p>
                </div>
            `;
            cartCount.textContent = '0';
            cartSubtotal.textContent = '₹0';
            cartTotal.textContent = '₹0';
            return;
        }

        const cartHTML = this.cart.map(item => `
            <div class="cart-item bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div class="flex items-center space-x-4">
                    <div class="flex-shrink-0">
                        <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded-lg">
                    </div>
                    <div class="flex-1 min-w-0">
                        <h4 class="text-sm font-semibold text-gray-900 truncate">${item.name}</h4>
                        <p class="text-sm text-gray-500">₹${item.price.toFixed(2)}</p>
                        <div class="flex items-center space-x-2 mt-2">
                            <button onclick="cartManager.updateCartQuantity('${item.id}', ${item.quantity - 1})" 
                                    class="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors ${item.quantity <= 1 ? 'opacity-50 cursor-not-allowed' : ''}"
                                    ${item.quantity <= 1 ? 'disabled' : ''}>
                                <i class="fas fa-minus text-xs"></i>
                            </button>
                            <span class="text-sm font-medium text-gray-900 w-8 text-center">${item.quantity}</span>
                            <button onclick="cartManager.updateCartQuantity('${item.id}', ${item.quantity + 1})" 
                                    class="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors ${item.quantity >= item.stock ? 'opacity-50 cursor-not-allowed' : ''}"
                                    ${item.quantity >= item.stock ? 'disabled' : ''}>
                                <i class="fas fa-plus text-xs"></i>
                            </button>
                        </div>
                    </div>
                    <div class="flex flex-col items-end space-y-2">
                        <div class="text-right">
                            <p class="text-sm font-semibold text-gray-900">₹${(item.price * item.quantity).toFixed(2)}</p>
                            <p class="text-xs text-gray-500">${item.quantity} × ₹${item.price.toFixed(2)}</p>
                        </div>
                        <button onclick="cartManager.removeFromCart('${item.id}')" 
                                class="text-red-500 hover:text-red-700 transition-colors p-1">
                            <i class="fas fa-trash text-sm"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        cartItems.innerHTML = cartHTML;
        
        // Update cart count and totals
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const total = subtotal; // Add tax/shipping if needed
        
        cartCount.textContent = totalItems;
        cartSubtotal.textContent = `₹${subtotal.toFixed(2)}`;
        cartTotal.textContent = `₹${total.toFixed(2)}`;
        
        // Update cart summary visibility
        const cartSummary = document.querySelector('.cart-summary');
        if (cartSummary) {
            cartSummary.style.display = this.cart.length > 0 ? 'block' : 'none';
        }
    }
}

// Initialize the cart and wishlist manager
const cartManager = new CartWishlistManager();

// Export to global scope for compatibility
window.cartManager = cartManager;
window.addToCart = (productId, quantity) => cartManager.addToCart(productId, quantity);
window.addToWishlist = (productId) => cartManager.addToWishlist(productId);
window.removeFromCart = (productId) => cartManager.removeFromCart(productId);
window.removeFromWishlist = (productId) => cartManager.removeFromWishlist(productId);
window.toggleCart = () => cartManager.toggleCart();
window.toggleWishlist = () => cartManager.toggleWishlist();
window.proceedToCheckout = () => cartManager.proceedToCheckout();
window.clearCart = () => cartManager.clearCart();

console.log('✅ Enhanced cart and wishlist system loaded successfully');