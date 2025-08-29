// Enhanced Products Page JavaScript - COMPLETE CLEAN VERSION
console.log('🔄 Loading enhanced products page...');

(function() {
    'use strict';
    
    // Local scope variables to avoid conflicts
    let productsData = [];
    let filteredProductsData = [];
    let cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
    let currentProduct = null;

    // Initialize page
    document.addEventListener('DOMContentLoaded', function() {
        initializePage();
    });

    async function initializePage() {
        await loadProducts();
        updateCartDisplay();
        setupEventListeners();
        console.log('✅ Products page initialized');
    }

    // Enhanced product loading with error handling
    async function loadProducts() {
        try {
            showLoadingState(true);
            console.log('🔄 Loading products from API...');
            
            const response = await fetch('/api/items');
            const data = await response.json();
            
            // Handle different response formats
            if (Array.isArray(data)) {
                productsData = data;
            } else if (data.items && Array.isArray(data.items)) {
                productsData = data.items;
            } else if (data.success && Array.isArray(data.data)) {
                productsData = data.data;
            } else {
                productsData = [];
            }

            // Ensure all prices are properly formatted
            productsData = productsData.map(product => ({
                ...product,
                price: parseFloat(product.price) || 0,
                image: product.images?.[0] || product.image || '/uploads/logoindex.png'
            }));

            console.log(`✅ Loaded ${productsData.length} products`);
            filteredProductsData = [...productsData];
            displayProducts();
            showLoadingState(false);

        } catch (error) {
            console.error('❌ Error loading products:', error);
            showNotification('Error loading products', 'error');
            showLoadingState(false);
        }
    }

    // Enhanced product display with buy now functionality
    function displayProducts() {
        const grid = document.getElementById('productsGrid');
        const loadingState = document.getElementById('loadingState');
        const noProductsState = document.getElementById('noProductsState');
        
        if (loadingState) loadingState.classList.add('hidden');
        
        if (filteredProductsData.length === 0) {
            if (noProductsState) noProductsState.classList.remove('hidden');
            if (grid) grid.innerHTML = '';
            return;
        }
        
        if (noProductsState) noProductsState.classList.add('hidden');
        
        if (grid) {
            grid.innerHTML = filteredProductsData.map(product => {
                const productPrice = parseFloat(product.price) || 0;
                const productId = product._id || '';
                const productName = product.name || 'Unknown Product';
                const productDescription = product.description || '';
                const productImage = product.image || '/uploads/logoindex.png';
                
                return `
                    <div class="product-card" data-id="${productId}">
                        <div class="product-image">
                            <img src="${productImage}" alt="${productName}" loading="lazy">
                            ${product.isBestSeller ? '<span class="badge bestseller">Best Seller</span>' : ''}
                            ${product.isOrganic ? '<span class="badge organic">Organic</span>' : ''}
                        </div>
                        <div class="product-info">
                            <h3 class="product-name">${productName}</h3>
                            <p class="product-description">${productDescription}</p>
                            <div class="product-pricing">
                                <span class="current-price">₹${productPrice.toFixed(2)}</span>
                                ${product.mrp && product.mrp > productPrice ? 
                                    `<span class="original-price">₹${product.mrp.toFixed(2)}</span>` : ''}
                            </div>
                            <div class="product-meta">
                                <span class="category">${product.category || 'basic'}</span>
                                <span class="stock ${product.stock > 0 ? 'in-stock' : 'out-stock'}">
                                    ${product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                                </span>
                            </div>
                            <div class="product-actions">
                                <button 
                                    class="btn-primary buy-now-btn" 
                                    ${product.stock <= 0 ? 'disabled' : ''}
                                    onclick="startEnhancedCheckout('${productId}', '${productName.replace(/'/g, "\\'")}', ${productPrice}, '${productImage}')">
                                    ${product.stock > 0 ? 'Buy Now' : 'Out of Stock'}
                                </button>
                                <button 
                                    class="btn-secondary add-to-cart-btn" 
                                    ${product.stock <= 0 ? 'disabled' : ''}
                                    onclick="addToCart('${productId}')">
                                    Add to Cart
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    // ✅ CRITICAL: Buy button should ONLY start checkout flow, NOT open Razorpay
    function startEnhancedCheckout(productId, productName, productPrice, productImage) {
        console.log('🛒 Starting ENHANCED checkout for:', productName);
        
        // Store product data
        currentProduct = {
            _id: productId,
            name: productName,
            price: parseFloat(productPrice),
            image: productImage
        };
        
        // ✅ Check if enhanced checkout is available
        if (typeof window.startCheckoutFlow === 'function') {
            console.log('✅ Calling enhanced checkout flow...');
            window.startCheckoutFlow(productId, productName, productPrice, productImage);
        } else {
            console.error('❌ Enhanced checkout system not loaded!');
            showNotification('Checkout system not available. Please refresh the page.', 'error');
        }
    }

    // Event listeners setup
    function setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', debounce(handleSearch, 300));
        }
        
        // Price range filter
        const priceRange = document.getElementById('priceRange');
        if (priceRange) {
            priceRange.addEventListener('input', handlePriceFilter);
        }
        
        // Category filter
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', handleCategoryFilter);
        }
        
        console.log('✅ Event listeners setup complete');
    }

    // Search functionality
    function handleSearch(event) {
        const searchTerm = event.target.value.toLowerCase();
        filteredProductsData = productsData.filter(product => 
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm)
        );
        displayProducts();
    }

    // Price filter
    function handlePriceFilter(event) {
        const maxPrice = parseFloat(event.target.value);
        const priceValueElement = document.getElementById('priceValue');
        if (priceValueElement) {
            priceValueElement.textContent = `₹${maxPrice}`;
        }
        
        filteredProductsData = productsData.filter(product => 
            parseFloat(product.price) <= maxPrice
        );
        displayProducts();
    }

    // Category filter
    function handleCategoryFilter(event) {
        const selectedCategory = event.target.value;
        
        if (selectedCategory === '') {
            filteredProductsData = [...productsData];
        } else {
            filteredProductsData = productsData.filter(product => 
                product.category === selectedCategory
            );
        }
        displayProducts();
    }

    // Add to cart functionality
    async function addToCart(productId) {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                showNotification('Please login to add items to cart', 'warning');
                return;
            }

            const response = await fetch('/api/cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    productId: productId,
                    quantity: 1
                })
            });
            
            if (response.ok) {
                showNotification('Product added to cart!', 'success');
                updateCartDisplay();
            } else {
                const errorData = await response.json();
                showNotification(errorData.message || 'Failed to add to cart', 'error');
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            showNotification('Error adding to cart', 'error');
        }
    }

    // Cart functionality
    function updateCartDisplay() {
        const cartCount = document.getElementById('cartCount');
        if (cartCount) {
            cartCount.textContent = cartItems.length;
        }
    }

    // Utility functions
    function showLoadingState(show) {
        const loadingState = document.getElementById('loadingState');
        if (loadingState) {
            loadingState.classList.toggle('hidden', !show);
        }
    }

    function showNotification(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
        
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

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Export functions to global scope
    window.startEnhancedCheckout = startEnhancedCheckout;
    window.addToCart = addToCart;
    
    // Filter functions
    window.applyFilters = function() {
        const searchInput = document.getElementById('searchInput');
        const priceRange = document.getElementById('priceRange');
        const categoryFilter = document.getElementById('categoryFilter');
        
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        const maxPrice = priceRange ? parseFloat(priceRange.value) : 50000;
        const selectedCategory = categoryFilter ? categoryFilter.value : '';
        
        filteredProductsData = productsData.filter(product => {
            const matchesSearch = !searchTerm || 
                product.name.toLowerCase().includes(searchTerm) ||
                product.description.toLowerCase().includes(searchTerm) ||
                product.category.toLowerCase().includes(searchTerm);
                
            const matchesPrice = parseFloat(product.price) <= maxPrice;
            const matchesCategory = !selectedCategory || product.category === selectedCategory;
            
            return matchesSearch && matchesPrice && matchesCategory;
        });
        
        displayProducts();
        showNotification('Filters applied successfully', 'success');
    };

    window.clearFilters = function() {
        const searchInput = document.getElementById('searchInput');
        const priceRange = document.getElementById('priceRange');
        const categoryFilter = document.getElementById('categoryFilter');
        const priceValue = document.getElementById('priceValue');
        
        if (searchInput) searchInput.value = '';
        if (priceRange) priceRange.value = '50000';
        if (priceValue) priceValue.textContent = '₹50000';
        if (categoryFilter) categoryFilter.value = '';
        
        filteredProductsData = [...productsData];
        displayProducts();
        showNotification('Filters cleared', 'info');
    };

    // Cart and utility functions
    window.clearCart = function() {
        cartItems = [];
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
        updateCartDisplay();
        showNotification('Cart cleared', 'info');
    };

    window.toggleCart = function() {
        const cartSidebar = document.getElementById('cartSidebar');
        if (cartSidebar) {
            cartSidebar.classList.toggle('active');
        }
    };

    window.logout = function() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('cartItems');
        window.location.href = '/login.html';
    };

})();

console.log('✅ Enhanced products script loaded successfully');
