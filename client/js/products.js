// Enhanced Products Page JavaScript - COMPLETE FIXED VERSION
console.log('🔄 Loading enhanced products page...');

(function() {
    'use strict';
    
    // Local scope variables
    let productsData = [];
    let filteredProductsData = [];
    let currentProduct = null;

    // Initialize page
    document.addEventListener('DOMContentLoaded', function() {
        initializePage();
    });

    async function initializePage() {
        await loadProducts();
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

    // Enhanced product display with all functionality
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
                                    `<span class="mrp-price">₹${product.mrp.toFixed(2)}</span>` : ''}
                            </div>
                            <div class="product-actions">
                                <button onclick="cartManager.addToCart('${productId}')" class="btn-cart">
                                    🛒 Add to Cart
                                </button>
                                <button onclick="cartManager.addToWishlist('${productId}')" class="btn-wishlist">
                                    ❤️ Wishlist
                                </button>
                                <button onclick="buyNow('${productId}')" class="btn-buy">
                                    💳 Buy Now
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    // Setup event listeners
    function setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', debounce(handleSearch, 300));
        }

        // Category filter
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', handleCategoryFilter);
        }

        // Price range filter
        const priceRange = document.getElementById('priceRange');
        if (priceRange) {
            priceRange.addEventListener('input', handlePriceRangeChange);
        }
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

    // Price range filter
    function handlePriceRangeChange(event) {
        const maxPrice = parseFloat(event.target.value);
        const priceValue = document.getElementById('priceValue');
        if (priceValue) {
            priceValue.textContent = `₹${maxPrice}`;
        }
        
        filteredProductsData = productsData.filter(product => 
            parseFloat(product.price) <= maxPrice
        );
        
        displayProducts();
    }

    // Buy now functionality
    async function buyNow(productId) {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                showNotification('Please login to buy products', 'warning');
                return;
            }

            // Find the product
            const product = productsData.find(p => p._id === productId);
            if (!product) {
                showNotification('Product not found', 'error');
                return;
            }

            // Store the product for checkout
            localStorage.setItem('buyNowProduct', JSON.stringify(product));
            
            // Redirect to checkout
            window.location.href = 'enhanced-checkout.html?buyNow=true';
            
        } catch (error) {
            console.error('Error with buy now:', error);
            showNotification('Error processing buy now request', 'error');
        }
    }

    // Show product modal
    function showProductModal(productId) {
        const product = productsData.find(p => p._id === productId);
        if (!product) return;

        currentProduct = product;
        window.currentProduct = product; // Make it globally accessible
        
        // Update modal content
        const modal = document.getElementById('productModal');
        const modalProductName = document.getElementById('modalProductName');
        const modalProductImage = document.getElementById('modalProductImage');
        const modalProductTitle = document.getElementById('modalProductTitle');
        const modalProductDescription = document.getElementById('modalProductDescription');
        const modalProductPrice = document.getElementById('modalProductPrice');

        if (modalProductName) modalProductName.textContent = product.name;
        if (modalProductImage) modalProductImage.src = product.image;
        if (modalProductTitle) modalProductTitle.textContent = product.name;
        if (modalProductDescription) modalProductDescription.textContent = product.description;
        if (modalProductPrice) modalProductPrice.textContent = `₹${product.price}`;

        modal.style.display = 'block';
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
        
        // Use cart manager notification if available
        if (window.cartManager && window.cartManager.showNotification) {
            window.cartManager.showNotification(message, type);
            return;
        }
        
        // Fallback notification
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
    window.buyNow = buyNow;
    window.showProductModal = showProductModal;
    
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

})();

console.log('✅ Enhanced products script loaded successfully');
