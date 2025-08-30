// Helper to get JWT token from localStorage
function getToken() {
  return localStorage.getItem('token');
}

// ✅ FIXED: Protected fetch function for authenticated requests
async function protectedFetch(url, options = {}) {
  const token = localStorage.getItem('token');
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
  
  const mergedOptions = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };
  
  try {
    const response = await fetch(url, mergedOptions);
    
    // If unauthorized, redirect to login
    if (response.status === 401) {
      console.log('🔐 Unauthorized request, redirecting to login');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Don't redirect immediately in all cases, let the calling function handle it
    }
    
    return response;
  } catch (error) {
    console.error('❌ Protected fetch error:', error);
    throw error;
  }
}

// Modern Toast Notification
function showNotification(message, type = 'success') {
  const toast = document.getElementById('toastNotification');
  if (!toast) return;
  toast.textContent = message;
  toast.style.background = type === 'error' ? '#f44336' : '#43a047';
  toast.style.color = '#fff';
  toast.style.display = 'block';
  toast.style.opacity = '1';
  toast.style.transition = 'opacity 0.3s';
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => { toast.style.display = 'none'; }, 300);
  }, 3000);
}

// ✅ FIXED: Enhanced Cart Functions with better error handling
async function addToCart(productId, quantity = 1) {
  console.log('🛒 Adding to cart:', { productId, quantity });
  
  // Check authentication
  const token = localStorage.getItem('token');
  if (!token) {
    showNotification('Please login to add items to cart', 'error');
    setTimeout(() => window.location.href = 'login.html', 1500);
    return;
  }
  
  try {
    const response = await protectedFetch('/api/cart/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ itemId: productId, quantity })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Cart updated:', result);
      showNotification('Product added to cart!', 'success');
      updateCartCount();
      fetchCart();
    } else {
      const error = await response.json();
      console.error('❌ Cart error:', error);
      if (response.status === 404 && error.message === 'Product not found') {
        showNotification('This product no longer exists.', 'error');
      } else if (response.status === 401) {
        showNotification('Please login to add to cart', 'error');
        setTimeout(() => window.location.href = 'login.html', 1500);
      } else {
        showNotification(error.message || 'Failed to add to cart', 'error');
      }
    }
  } catch (error) {
    console.error('❌ Error adding to cart:', error);
    showNotification('Error adding to cart. Please try again.', 'error');
  }
}

async function getCart() {
  try {
    const response = await protectedFetch('/api/cart');
    if (response.ok) {
      return await response.json();
    }
    return [];
  } catch (error) {
    console.error('Error fetching cart:', error);
    return [];
  }
}

async function updateCartCount() {
  try {
    const cart = await getCart();
    const count = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
    
    // Update all cart count elements
    const countElements = [
      document.getElementById('sidebarCartCount'),
      document.getElementById('navbarCartCount'),
      document.getElementById('cartCount')
    ].filter(Boolean);
    
    countElements.forEach(element => {
      element.textContent = count;
      element.style.display = count > 0 ? 'flex' : 'none';
    });
    
    console.log('🛒 Cart count updated:', count);
  } catch (error) {
    console.error('❌ Error updating cart count:', error);
  }
}

// ✅ FIXED: Enhanced Wishlist Functions with better error handling
async function toggleWishlist(button) {
  console.log('❤️ Toggling wishlist:', button);
  
  if (!button || !button.dataset || !button.dataset.productId) {
    console.error('❌ toggleWishlist: No productId found on button:', button);
    showNotification('Wishlist error: Product not found', 'error');
    return;
  }
  
  // Check authentication
  const token = localStorage.getItem('token');
  if (!token) {
    showNotification('Please login to manage wishlist', 'error');
    setTimeout(() => window.location.href = 'login.html', 1500);
    return;
  }
  
  try {
    button.disabled = true;
    const productId = button.dataset.productId;
    console.log('❤️ Processing wishlist for product:', productId);
    
    // Fetch current wishlist
    const wishlistRes = await protectedFetch('/api/wishlist');
    if (!wishlistRes.ok && wishlistRes.status === 401) {
      showNotification('Please login to manage wishlist', 'error');
      setTimeout(() => window.location.href = 'login.html', 1500);
      return;
    }
    
    const wishlist = wishlistRes.ok ? await wishlistRes.json() : [];
    const isInWishlist = wishlist.some(item => item._id === productId);
    const endpoint = isInWishlist ? '/api/wishlist/remove' : '/api/wishlist/add';
    
    console.log(`${isInWishlist ? '➖' : '➕'} ${isInWishlist ? 'Removing from' : 'Adding to'} wishlist`);
    
    const response = await protectedFetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ itemId: productId })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }
    
    // Update all wishlist buttons for this product
    document.querySelectorAll(`[data-product-id='${productId}']`).forEach(btn => {
      const heart = btn.querySelector('i');
      if (heart) {
        heart.classList.toggle('text-red-500', !isInWishlist);
        heart.classList.toggle('text-gray-400', isInWishlist);
      }
      btn.setAttribute('aria-pressed', !isInWishlist);
    });
    
    const action = isInWishlist ? 'Removed from wishlist' : 'Added to wishlist';
    showNotification(action, 'success');
    console.log('✅ Wishlist updated:', action);
    
  } catch (error) {
    console.error('❌ Wishlist error:', error);
    showNotification(error.message || 'Error updating wishlist', 'error');
  } finally {
    button.disabled = false;
  }
}

function updateWishlistIcon(itemId, isInWishlist) {
  const wishlistIcons = document.querySelectorAll(`.wishlist-icon[data-product-id="${itemId}"]`);
  wishlistIcons.forEach(icon => {
    const heartIcon = icon.querySelector('i');
    if (heartIcon) {
      heartIcon.classList.toggle('text-red-500', isInWishlist);
      heartIcon.classList.toggle('text-gray-400', !isInWishlist);
    }
  });
}

// Display Cart
async function fetchCart() {
  try {
    const response = await protectedFetch('/api/cart');
  const cart = await response.json();
  renderCartSidebar(cart);
  } catch (error) {
    renderCartSidebar([]);
  }
}

function renderCartSidebar(cart) {
  const cartItemsContainer = document.getElementById('cartItems');
  const sidebarCartCount = document.getElementById('sidebarCartCount');
  const cartSubtotal = document.getElementById('cartSubtotal');
  let subtotal = 0;
  cartItemsContainer.innerHTML = '';
  if (!cart || cart.length === 0) {
    cartItemsContainer.innerHTML = '<p class="text-gray-500 text-center py-8">Your cart is empty</p>';
    if (sidebarCartCount) sidebarCartCount.textContent = 0;
    if (cartSubtotal) cartSubtotal.textContent = '₹0';
    return;
  }
  if (sidebarCartCount) sidebarCartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
  cart.forEach(item => {
    const product = item.product;
    if (!product) return;
    const itemTotal = product.price * item.quantity;
    subtotal += itemTotal;
    cartItemsContainer.innerHTML += `
      <div class="flex items-center mb-4 border-b pb-4">
        <img src="${product.image ? '/uploads/' + product.image : '/uploads/logoindex.png'}" alt="${product.name}" class="w-16 h-16 object-cover rounded mr-4">
        <div class="flex-1">
          <div class="font-semibold text-gray-900">${product.name}</div>
          <div class="text-gray-600 text-sm">₹${product.price} x ${item.quantity}</div>
          <div class="text-blue-600 font-bold">₹${itemTotal}</div>
        </div>
        <div class="flex flex-col items-center ml-2">
          <button onclick="updateCartItem('${product._id}', ${item.quantity - 1})" class="text-gray-500 hover:text-blue-600 text-lg mb-1" ${item.quantity <= 1 ? 'disabled' : ''}>-</button>
          <span>${item.quantity}</span>
          <button onclick="updateCartItem('${product._id}', ${item.quantity + 1})" class="text-gray-500 hover:text-blue-600 text-lg mt-1">+</button>
          <button onclick="removeFromCart('${product._id}')" class="text-red-500 hover:text-red-700 mt-2"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      `;
    });
  if (cartSubtotal) cartSubtotal.textContent = `₹${subtotal}`;
}

// Display Wishlist
async function fetchWishlist() {
  try {
    const response = await protectedFetch('/api/wishlist');
    if (!response.ok) return;
    const wishlist = await response.json();
    const wishlistContainer = document.getElementById('wishlist-section');
    if (!wishlistContainer) return;
    wishlistContainer.innerHTML = '';
    (wishlist || []).forEach(product => {
      const div = document.createElement('div');
      div.className = 'wishlist-item flex justify-between items-center';
      div.innerHTML = `
        <span>${product?.name || 'Unknown'}</span>
        <button onclick="toggleWishlist('${product._id}')" class="text-red-500">
          <i class="fas fa-heart"></i>
        </button>
      `;
      wishlistContainer.appendChild(div);
    });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
  }
}

// Additional Cart Operations
async function removeFromCart(productId) {
  await protectedFetch('/api/cart/remove', {
      method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemId: productId })
    });
      fetchCart();
}

async function updateCartItem(productId, newQuantity) {
  if (newQuantity <= 0) {
    await removeFromCart(productId);
    return;
  }
  await protectedFetch('/api/cart/update', {
      method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemId: productId, quantity: newQuantity })
    });
      fetchCart();
}

// UI Toggle Functions
function toggleCart() {
  const cartSidebar = document.getElementById('cartSidebar');
  if (cartSidebar) {
    cartSidebar.classList.toggle('open');
    if (cartSidebar.classList.contains('open')) {
      fetchCart();
    }
  }
}

function toggleUserMenu() {
  const dropdown = document.getElementById('userDropdown');
  if (dropdown) dropdown.classList.toggle('hidden');
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}

function closeModal() {
  const modal = document.getElementById('productModal');
  if (modal) modal.style.display = 'none';
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  if (window.chrome && chrome.runtime && chrome.runtime.id) {
    console.warn('Extensions may interfere with page functionality. Try disabling extensions.');
  }

  // Initialize cart and wishlist
  updateCartCount();
  fetchWishlist();

  // Attach event listeners for cart buttons
  document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const productId = this.closest('.product').dataset.productId;
      console.log('Frontend: addToCart called with productId:', productId);
      addToCart(productId);
    });
  });

  // Attach event listeners for wishlist buttons
  document.querySelectorAll('.wishlist-icon').forEach(btn => {
    btn.addEventListener('click', function() {
      const productId = this.dataset.item;
      toggleWishlist(this);
    });
  });

  // Initialize other UI elements
  const cartBtn = document.getElementById('cartBtn');
  const miniCart = document.getElementById('miniCartPreview');
  const cartSidebar = document.getElementById('cartSidebar');
  const closeCartBtn = document.getElementById('closeCart');

  if (cartBtn && miniCart) {
    cartBtn.addEventListener('mouseenter', showMiniCart);
    cartBtn.addEventListener('mouseleave', () => setTimeout(hideMiniCart, 300));
    miniCart.addEventListener('mouseenter', () => miniCart.classList.remove('hidden'));
    miniCart.addEventListener('mouseleave', hideMiniCart);
    cartBtn.addEventListener('click', openCartSidebar);
  }
  if (closeCartBtn && cartSidebar) {
    closeCartBtn.addEventListener('click', closeCartSidebar);
  }

  const userMenuBtn = document.getElementById('userMenuBtn');
  if (userMenuBtn) userMenuBtn.addEventListener('click', toggleUserMenu);

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', logout);

  const closeModalBtn = document.getElementById('closeModal');
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);

  const productModal = document.getElementById('productModal');
  if (productModal) productModal.addEventListener('click', function(e) {
    if (e.target === this) closeModal();
  });

  // --- Global Image Fallback for 404s ---
  document.addEventListener('error', (e) => {
    if (e.target.tagName === 'IMG') {
      e.target.src = '/uploads/placeholder-product.jpg';
      e.target.alt = 'Image not available';
      e.target.classList.add('border', 'border-gray-200');
    }
  }, true);

  // --- Extension and Resource Loading Issues ---
  document.addEventListener('DOMContentLoaded', function() {
    // Check for extension interference
    if (window.chrome && chrome.runtime && chrome.runtime.id) {
      console.warn('Extensions may interfere with page functionality');
    }

    // Load fallback images for missing resources
    document.querySelectorAll('img').forEach(img => {
      img.addEventListener('error', function() {
        this.src = '/uploads/placeholder-product.jpg'; // Make sure this file exists!
        this.alt = 'Image not available';
      });
    });
  });

  // Attach listeners to product card action buttons for modern UX
  attachProductCardListeners();

  if (cartBtn) {
    cartBtn.onclick = null;
    cartBtn.addEventListener('click', function(e) {
      e.preventDefault();
      if (typeof openCartSidebar === 'function') {
        openCartSidebar();
      } else if (typeof toggleCartSidebar === 'function') {
        toggleCartSidebar();
      } else {
        console.warn('No cart sidebar function found');
      }
    });
  }

  const productsGrid = document.getElementById('productsGrid');
  if (productsGrid) {
    productsGrid.addEventListener('click', function(e) {
      // Cart icon
      const cartBtn = e.target.closest('.cart-icon');
      if (cartBtn) {
        e.preventDefault();
        const productId = cartBtn.getAttribute('data-item');
        if (productId) addToCart(productId, 1);
        return;
      }
      // Wishlist icon
      const wishlistBtn = e.target.closest('.wishlist-icon');
      if (wishlistBtn) {
        e.preventDefault();
        const productId = wishlistBtn.getAttribute('data-product-id');
        if (productId) toggleWishlist(wishlistBtn);
        return;
      }
    });
  }

  const searchBarIds = ['mainSearchInput', 'mobileSearchInput', 'filterSearchInput'];
  searchBarIds.forEach(function(id) {
    const searchBar = document.getElementById(id);
    if (searchBar) {
      searchBar.addEventListener('focus', function() {
        document.body.style.overflow = 'hidden';
      });
      searchBar.addEventListener('blur', function() {
        document.body.style.overflow = '';
      });
    }
  });
});

async function handleProductSubmit(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const productId = document.getElementById('productId').value;
  const token = localStorage.getItem('token');
  
  // DO NOT append seller to formData; seller is set by backend from the authenticated user
  // formData.append('seller', ...); // <-- Do NOT do this
  
  try {
    const url = productId ? `/api/items/${productId}` : '/api/items';
    const method = productId ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method,
      headers: { 
        'Authorization': `Bearer ${token}`
        // Don't set Content-Type for FormData - browser will set it automatically
      },
      body: formData
    });

    if (response.ok) {
      showNotification('Product submitted successfully');
      // Handle successful submission
    } else {
      const error = await response.json();
      showNotification(error.error || 'Failed to submit product', 'error');
    }
  } catch (error) {
    console.error('Error submitting product:', error);
    showNotification('Error submitting product', 'error');
  }
}

// --- Global Promise Rejection Handler ---
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled rejection:', event.reason);
  // Optionally show a toast or notification
  // showNotification('Something went wrong. Please try again.', 'error');
});

// --- Global Error Listeners ---
window.addEventListener('error', function(event) {
  console.error('Global error:', event.error);
  // Optionally: showNotification('A script error occurred.', 'error');
});

window.addEventListener('unhandledrejection', function(event) {
  console.error('Unhandled rejection:', event.reason);
  // Optionally: showNotification('An operation failed. Please try again.', 'error');
});

// Cart Sidebar and Mini Cart Logic
function showMiniCart() {
  if (cartSidebar && cartSidebar.style.display === 'block') return;
  updateMiniCart();
  miniCart.classList.remove('hidden');
}
function hideMiniCart() {
  miniCart.classList.add('hidden');
}
function openCartSidebar() {
  const cartSidebar = document.getElementById('cartSidebar');
  if (cartSidebar) {
    cartSidebar.style.display = 'block';
    setTimeout(() => cartSidebar.classList.add('open'), 10);
    fetchCart(); // Refresh cart items
  }
}
function closeCartSidebar() {
  const cartSidebar = document.getElementById('cartSidebar');
  if (cartSidebar) {
    cartSidebar.classList.remove('open');
    setTimeout(() => (cartSidebar.style.display = 'none'), 300);
  }
}

// Attach listeners to product card action buttons for modern UX
function attachProductCardListeners() {
  // Only keep quick view/eye icon logic if needed, remove cart/wishlist direct listeners
  document.querySelectorAll('.bg-white[aria-label="Quick View"]').forEach(btn => {
    btn.onclick = function(e) {
      e.preventDefault();
      const productId = btn.closest('.product-card').querySelector('.cart-icon').getAttribute('data-item');
      if (productId) viewProduct(productId);
    };
    btn.setAttribute('tabindex', '0');
  });
}

// Product Modal Logic
function showProductModal(product) {
  const modalAddToCartBtn = document.getElementById('modalAddToCartBtn');
  if (modalAddToCartBtn) {
    modalAddToCartBtn.onclick = () => addToCart(product._id, 1);
  }
  document.getElementById('modalProductImage').src = product.image || 'default.jpg';
  document.getElementById('modalProductName').textContent = product.name;
  document.getElementById('modalProductPrice').textContent = `₹${product.price}`;
  document.getElementById('modalProductDescription').textContent = product.description || '';
  document.getElementById('productModal').classList.remove('hidden');
}
const closeProductModalBtn = document.getElementById('closeProductModal');
if (closeProductModalBtn) {
  closeProductModalBtn.onclick = () => {
    document.getElementById('productModal').classList.add('hidden');
  };
}
const closeCartBtn = document.getElementById('closeCart');
if (closeCartBtn) {
  closeCartBtn.onclick = closeCartSidebar;
}
const clearCartBtn = document.getElementById('clearCartBtn');
if (clearCartBtn) {
  clearCartBtn.onclick = async function() {
    await clearCart();
    fetchCart();
  };
}
const checkoutBtn = document.getElementById('checkoutBtn');
if (checkoutBtn) {
  checkoutBtn.onclick = async function() {
    try {
      // Get cart items
      const cart = await getCart();
      if (!cart || cart.length === 0) {
        showNotification('Your cart is empty', 'error');
        return;
      }
      
      // Start checkout flow with cart
      if (window.startCheckoutFlow) {
        window.startCheckoutFlow();
      } else {
        showNotification('Checkout functionality is being updated', 'error');
      }
    } catch (error) {
      showNotification('Error processing checkout', 'error');
    }
  };
}

async function clearCart() {
  await protectedFetch('/api/cart/clear', {
    method: 'POST'
  });
  fetchCart();
}

// Start Checkout Flow - main entry point for checkout
window.startCheckoutFlow = function(productId, productName, productPrice, productImage) {
  if (!getToken()) {
    showNotification('Please login to continue', 'error');
    return;
  }
  
  if (productId) {
    // Single product checkout (Buy Now)
    openAddressSelectionModal(productId);
  } else {
    // Cart checkout - show cart checkout modal
    showCartCheckoutModal();
  }
};

// Cart Checkout Modal
async function showCartCheckoutModal() {
  try {
    const cart = await getCart();
    if (!cart || cart.length === 0) {
      showNotification('Your cart is empty', 'error');
      return;
    }
    
    // Calculate total
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Show address selection for cart
    openCartAddressSelectionModal(cart, total);
  } catch (error) {
    showNotification('Error loading cart', 'error');
  }
}

// Buy Now (Checkout Modal) Logic
async function buyNow(productId) {
  try {
    // Use the new checkout flow
    window.startCheckoutFlow(productId);
  } catch (err) {
    showNotification('Could not open checkout. Please try again.', 'error');
    console.error(err);
  }
}

// --- Checkout Modal Quantity & Close Logic ---
function setupCheckoutModalEvents() {
  const qtyInput = document.getElementById('checkoutQuantity');
  const qtyMinus = document.getElementById('qtyMinus');
  const qtyPlus = document.getElementById('qtyPlus');
  const closeBtn = document.getElementById('closeCheckoutModal');
  const modal = document.getElementById('checkoutModal');

  function updateTotal() {
    const price = parseFloat(document.getElementById('checkoutProductPrice').textContent.replace(/[^\d.]/g, ''));
    const qty = parseInt(qtyInput.value) || 1;
    document.getElementById('checkoutTotal').textContent = `₹${(price * qty).toFixed(2)}`;
    document.getElementById('checkoutSubtotal').textContent = `₹${(price * qty).toFixed(2)}`;
  }

  if (qtyMinus) {
    qtyMinus.onclick = function() {
      let val = parseInt(qtyInput.value) || 1;
      if (val > 1) qtyInput.value = val - 1;
      updateTotal();
    };
  }
  if (qtyPlus) {
    qtyPlus.onclick = function() {
      let val = parseInt(qtyInput.value) || 1;
      qtyInput.value = val + 1;
      updateTotal();
    };
  }
  if (qtyInput) {
    qtyInput.oninput = updateTotal;
  }
  if (closeBtn) {
    closeBtn.onclick = function() {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    };
  }
}
// Call this after DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupCheckoutModalEvents);
} else {
  setupCheckoutModalEvents();
}

// --- Address Form: Auto-fetch State/Country from Pincode & Save Handler ---
function setupAddressFormEvents() {
  const pincodeInput = document.getElementById('addressPincode');
  const stateInput = document.getElementById('addressState');
  const countryInput = document.getElementById('addressCountry');
  const saveBtn = document.getElementById('saveAddressBtn');

  // Auto-fetch state/country when pincode is 6 digits
  if (pincodeInput) {
    pincodeInput.addEventListener('input', async function() {
      const pincode = this.value.trim();
      if (/^\d{6}$/.test(pincode)) {
        // Use Postalpincode.in API
        try {
          stateInput.value = '...';
          countryInput.value = '...';
          const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
          const data = await res.json();
          if (data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
            stateInput.value = data[0].PostOffice[0].State || '';
            countryInput.value = data[0].PostOffice[0].Country || '';
          } else {
            stateInput.value = '';
            countryInput.value = '';
          }
        } catch (err) {
          stateInput.value = '';
          countryInput.value = '';
        }
      } else {
        stateInput.value = '';
        countryInput.value = '';
      }
    });
  }

  // Save Address handler
  if (saveBtn) {
    saveBtn.onclick = async function(e) {
      e.preventDefault();
      const name = document.getElementById('addressName').value.trim();
      const mobile = document.getElementById('addressMobile').value.trim();
      const address = document.getElementById('addressLine').value.trim();
      const pincode = pincodeInput.value.trim();
      const state = stateInput.value.trim();
      const country = countryInput.value.trim();
      if (!name || !mobile || !address || !pincode) {
        showNotification('Please fill all required fields', 'error');
        return;
      }
      // Send to backend
      try {
        const res = await protectedFetch('/api/user/addresses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name, mobile, address, pincode, state, country })
        });
        if (res.ok) {
          showNotification('Address saved successfully!', 'success');
        // Clear form fields
        document.getElementById('addressName').value = '';
        document.getElementById('addressMobile').value = '';
        document.getElementById('addressLine').value = '';
        document.getElementById('addressPincode').value = '';
        document.getElementById('addressState').value = '';
        document.getElementById('addressCountry').value = '';
          // Optionally refresh address book UI here
        } else {
          const err = await res.json();
          showNotification(err.message || 'Failed to save address', 'error');
        }
      } catch (err) {
        showNotification('Error saving address', 'error');
      }
    };
  }
}
// Call this after DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupAddressFormEvents);
} else {
  setupAddressFormEvents();
}

// --- Show/Hide Address Form Logic ---
function setupAddNewAddressButton() {
  const addNewAddressBtn = document.getElementById('addNewAddressBtn');
  const addressForm = document.getElementById('addressForm');
  const cancelAddressBtn = document.getElementById('cancelAddressBtn');
  if (addNewAddressBtn && addressForm) {
    addNewAddressBtn.onclick = function() {
      addressForm.style.display = 'block';
      addNewAddressBtn.style.display = 'none';
      // Optionally clear form fields
      addressForm.querySelectorAll('input, textarea').forEach(f => f.value = '');
    };
  }
  if (cancelAddressBtn && addressForm && addNewAddressBtn) {
    cancelAddressBtn.onclick = function() {
      addressForm.style.display = 'none';
      addNewAddressBtn.style.display = 'block';
    };
  }
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupAddNewAddressButton);
} else {
  setupAddNewAddressButton();
}

// --- Global Protected Fetch Helper ---
async function protectedFetch(url, options = {}) {
  const token = localStorage.getItem('token');
  if (!token) {
    showNotification('Please log in to continue', 'error');
    window.location.href = 'login.html';
    throw new Error('No token');
  }
  options.headers = options.headers || {};
  options.headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, options);
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem('token');
    showNotification('Session expired. Please log in again.', 'error');
    window.location.href = 'login.html';
    throw new Error('Unauthorized');
  }
  return res;
}

// Update event delegation for Add/Edit Details button in seller dashboard
if (window.location.pathname.includes('seller-dashboard.html')) {
  document.addEventListener('click', function (e) {
    if (e.target.classList.contains('edit-details-btn')) {
      const productId = e.target.dataset.productId;
      openDetailsEditor(productId);
    }
  });
}

// Robust section extraction function for product details tabs
function extractSection(doc, sectionNames) {
  // 1. Try to find real headings (h1-h6)
  const headings = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  for (let i = 0; i < headings.length; i++) {
    const text = headings[i].textContent.trim().toLowerCase();
    if (sectionNames.some(name => text === name.toLowerCase())) {
      // Collect all nodes until the next heading of same or higher level
      const section = [];
      let node = headings[i].nextSibling;
      while (node && !(node.nodeType === 1 && /^H[1-6]$/.test(node.tagName))) {
        if (node.nodeType === 1) section.push(node.outerHTML);
        else if (node.nodeType === 3) section.push(node.textContent);
        node = node.nextSibling;
      }
      return section.join('');
    }
  }

  // 2. Fallback: look for <p><strong>Section</strong></p>
  const strongParas = Array.from(doc.querySelectorAll('p > strong'));
  for (let i = 0; i < strongParas.length; i++) {
    const text = strongParas[i].textContent.trim().toLowerCase();
    if (sectionNames.some(name => text === name.toLowerCase())) {
      // Collect all nodes until the next <p><strong>...</strong></p> or heading
      const section = [];
      let node = strongParas[i].parentElement.nextSibling;
      while (
        node &&
        !(
          (node.nodeType === 1 && /^H[1-6]$/.test(node.tagName)) ||
          (node.nodeType === 1 && node.tagName === 'P' && node.querySelector('strong'))
        )
      ) {
        if (node.nodeType === 1) section.push(node.outerHTML);
        else if (node.nodeType === 3) section.push(node.textContent);
        node = node.nextSibling;
      }
      return section.join('');
    }
  }

  // 3. Not found
  return '';
}

// Only run this block on product details page where 'product' is defined
// if (typeof product !== 'undefined' && product && product.details && product.details.trim()) {
//   const parser = new DOMParser();
//   const doc = parser.parseFromString(product.details, 'text/html');
//
//   const overviewHtml = extractSection(doc, ['Overview']);
//   const specsHtml = extractSection(doc, ['Specifications', 'Specs']);
//   const featuresHtml = extractSection(doc, ['Features']);
//   const usageHtml = extractSection(doc, ['Usage', 'How to Use']);
//   const faqsHtml = extractSection(doc, ['FAQs', 'FAQ']);
//
//   const detailsElem = document.getElementById('product-details');
//   if (detailsElem) {
//     detailsElem.innerHTML = `
//       <div class="section-title">Product Details</div>
//       <div class="details-tabs" style="display:flex;gap:12px;margin-bottom:18px;">
//         <button class="tab-btn active" data-tab="overview"><i class="fas fa-info-circle"></i> Overview</button>
//         <button class="tab-btn" data-tab="specs"><i class="fas fa-list-alt"></i> Specifications</button>
//         <button class="tab-btn" data-tab="features"><i class="fas fa-star"></i> Features</button>
//         <button class="tab-btn" data-tab="usage"><i class="fas fa-cogs"></i> Usage</button>
//         <button class="tab-btn" data-tab="faqs"><i class="fas fa-question-circle"></i> FAQs</button>
//       </div>
//       <div class="tab-content" id="overviewTab">${overviewHtml || '<div>No overview provided.</div>'}</div>
//       <div class="tab-content" id="specsTab" style="display:none;">${specsHtml || '<div>No specifications provided.</div>'}</div>
//       <div class="tab-content" id="featuresTab" style="display:none;">${featuresHtml || '<div>No features provided.</div>'}</div>
//       <div class="tab-content" id="usageTab" style="display:none;">${usageHtml || '<div>No usage information provided.</div>'}</div>
//       <div class="tab-content" id="faqsTab" style="display:none;">${faqsHtml || '<div>No FAQs provided.</div>'}</div>
//     `;
//
//     // Tab switching logic
//     detailsElem.querySelectorAll('.tab-btn').forEach(btn => {
//       btn.onclick = function() {
//         detailsElem.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
//         btn.classList.add('active');
//         detailsElem.querySelectorAll('.tab-content').forEach(tc => tc.style.display = 'none');
//         if (btn.dataset.tab === 'overview') detailsElem.querySelector('#overviewTab').style.display = '';
//         if (btn.dataset.tab === 'specs') detailsElem.querySelector('#specsTab').style.display = '';
//         if (btn.dataset.tab === 'features') detailsElem.querySelector('#featuresTab').style.display = '';
//         if (btn.dataset.tab === 'usage') detailsElem.querySelector('#usageTab').style.display = '';
//         if (btn.dataset.tab === 'faqs') detailsElem.querySelector('#faqsTab').style.display = '';
//       };
//     });
//   }
// }

// ========== ADMIN NOTIFICATIONS & OFFERS ==========

// 1. Offer/Promo Notification Form
const adminOfferForm = document.getElementById('adminOfferForm');
if (adminOfferForm) {
  adminOfferForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const statusDiv = document.getElementById('offerFormStatus');
    statusDiv.textContent = '';
    const message = document.getElementById('offerMessage').value.trim();
    const targetRole = document.getElementById('offerTargetRole').value;
    const icon = document.getElementById('offerIcon').value;
    try {
      const res = await protectedFetch('/api/notifications/admin/send-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, targetRole, icon })
      });
      if (res.ok) {
        statusDiv.textContent = 'Offer notification sent!';
        statusDiv.className = 'text-green-600';
        adminOfferForm.reset();
      } else {
        const err = await res.json();
        statusDiv.textContent = err.message || 'Failed to send notification.';
        statusDiv.className = 'text-red-600';
      }
    } catch (err) {
      statusDiv.textContent = 'Error sending notification.';
      statusDiv.className = 'text-red-600';
    }
  });
}

// 2. Admin Notification Bell & Dropdown
const adminNotificationBtn = document.getElementById('adminNotificationBtn');
const adminNotificationDropdown = document.getElementById('adminNotificationDropdown');
const adminNotificationCount = document.getElementById('adminNotificationCount');
const adminNotificationsList = document.getElementById('adminNotificationsList');
const adminNoNotifications = document.getElementById('adminNoNotifications');
const adminMarkAllReadBtn = document.getElementById('adminMarkAllReadBtn');

let adminNotifications = [];
let adminUnreadCount = 0;

async function fetchAdminNotifications() {
  try {
    const res = await protectedFetch('/api/notifications/admin');
    if (!res.ok) throw new Error('Failed to fetch notifications');
    adminNotifications = await res.json();
    renderAdminNotifications();
  } catch (err) {
    adminNotifications = [];
    renderAdminNotifications();
  }
}

function renderAdminNotifications() {
  adminNotificationsList.innerHTML = '';
  adminUnreadCount = 0;
  if (!adminNotifications.length) {
    adminNoNotifications.classList.remove('hidden');
    adminNotificationCount.classList.add('hidden');
    return;
  }
  adminNoNotifications.classList.add('hidden');
  adminNotifications.forEach(n => {
    const isUnread = !n.read;
    if (isUnread) adminUnreadCount++;
    const icon = n.icon ? `<i class="fas ${n.icon} text-lg mr-2"></i>` : '';
    const typeClass = n.type === 'offer' ? 'bg-blue-50' : n.type === 'order' ? 'bg-green-50' : 'bg-gray-50';
    const item = document.createElement('div');
    item.className = `flex items-start px-4 py-3 ${typeClass} ${isUnread ? 'font-semibold' : ''}`;
    item.innerHTML = `
      <div class="mr-3 mt-1">${icon}</div>
      <div class="flex-1">
        <div class="text-sm text-gray-900">${n.message}</div>
        <div class="text-xs text-gray-500 mt-1">${new Date(n.createdAt).toLocaleString()}</div>
      </div>
      ${isUnread ? `<button class="ml-2 text-xs text-blue-600 hover:underline" onclick="markAdminNotificationRead('${n._id}')">Mark read</button>` : ''}
    `;
    adminNotificationsList.appendChild(item);
  });
  if (adminUnreadCount > 0) {
    adminNotificationCount.textContent = adminUnreadCount;
    adminNotificationCount.classList.remove('hidden');
  } else {
    adminNotificationCount.classList.add('hidden');
  }
}

window.markAdminNotificationRead = async function(id) {
  try {
    await protectedFetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
    fetchAdminNotifications();
  } catch {}
};

if (adminNotificationBtn && adminNotificationDropdown) {
  adminNotificationBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    adminNotificationDropdown.classList.toggle('hidden');
    if (!adminNotificationDropdown.classList.contains('hidden')) fetchAdminNotifications();
  });
  document.addEventListener('click', function(e) {
    if (!adminNotificationDropdown.classList.contains('hidden')) {
      if (!adminNotificationDropdown.contains(e.target) && e.target !== adminNotificationBtn) {
        adminNotificationDropdown.classList.add('hidden');
      }
    }
  });
}
if (adminMarkAllReadBtn) {
  adminMarkAllReadBtn.addEventListener('click', async function() {
    try {
      await protectedFetch('/api/notifications/mark-all-read', { method: 'PATCH' });
      fetchAdminNotifications();
    } catch {}
  });
}
// Poll every 15s
if (adminNotificationBtn) setInterval(fetchAdminNotifications, 15000);

// 3. Admin Notification Settings
const adminNotifSettingsForm = document.getElementById('adminNotifSettingsForm');
if (adminNotifSettingsForm) {
  // Load current settings
  async function loadAdminNotifSettings() {
    try {
      const res = await protectedFetch('/api/notifications/settings');
      if (!res.ok) throw new Error();
      const settings = await res.json();
      document.getElementById('notifOrder').checked = !!settings.order;
      document.getElementById('notifOffer').checked = !!settings.offer;
      document.getElementById('notifSystem').checked = !!settings.system;
      document.getElementById('notifAdmin').checked = !!settings.admin;
      document.getElementById('notifSeller').checked = !!settings.seller;
    } catch {}
  }
  loadAdminNotifSettings();
  adminNotifSettingsForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const statusDiv = document.getElementById('notifSettingsStatus');
    statusDiv.textContent = '';
    const body = {
      order: document.getElementById('notifOrder').checked,
      offer: document.getElementById('notifOffer').checked,
      system: document.getElementById('notifSystem').checked,
      admin: document.getElementById('notifAdmin').checked,
      seller: document.getElementById('notifSeller').checked
    };
    try {
      const res = await protectedFetch('/api/notifications/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        statusDiv.textContent = 'Preferences saved!';
        statusDiv.className = 'text-green-600';
      } else {
        statusDiv.textContent = 'Failed to save preferences.';
        statusDiv.className = 'text-red-600';
      }
    } catch {
      statusDiv.textContent = 'Error saving preferences.';
      statusDiv.className = 'text-red-600';
    }
  });
}

// ========== SELLER NOTIFICATION SETTINGS ==========
const sellerNotifSettingsForm = document.getElementById('sellerNotifSettingsForm');
if (sellerNotifSettingsForm) {
  async function loadSellerNotifSettings() {
    try {
      const res = await protectedFetch('/api/notifications/settings');
      if (!res.ok) throw new Error();
      const settings = await res.json();
      document.getElementById('sellerNotifOrder').checked = !!settings.order;
      document.getElementById('sellerNotifOffer').checked = !!settings.offer;
      document.getElementById('sellerNotifSystem').checked = !!settings.system;
      document.getElementById('sellerNotifAdmin').checked = !!settings.admin;
      document.getElementById('sellerNotifSeller').checked = !!settings.seller;
    } catch {}
  }
  loadSellerNotifSettings();
  sellerNotifSettingsForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const statusDiv = document.getElementById('sellerNotifSettingsStatus');
    statusDiv.textContent = '';
    const body = {
      order: document.getElementById('sellerNotifOrder').checked,
      offer: document.getElementById('sellerNotifOffer').checked,
      system: document.getElementById('sellerNotifSystem').checked,
      admin: document.getElementById('sellerNotifAdmin').checked,
      seller: document.getElementById('sellerNotifSeller').checked
    };
    try {
      const res = await protectedFetch('/api/notifications/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        statusDiv.textContent = 'Preferences saved!';
        statusDiv.className = 'text-green-600';
      } else {
        statusDiv.textContent = 'Failed to save preferences.';
        statusDiv.className = 'text-red-600';
      }
    } catch {
      statusDiv.textContent = 'Error saving preferences.';
      statusDiv.className = 'text-red-600';
    }
  });
}

// ========== USER NOTIFICATION BELL & DROPDOWN ==========
const userNotificationBell = document.getElementById('notificationBell');
const userNotificationDropdown = document.getElementById('notificationDropdown');
const userNotificationBadge = document.getElementById('notificationBadge');
const userNotificationList = document.getElementById('notificationList');
const userNoNotifications = document.getElementById('noNotifications');

let userNotifications = [];
let userUnreadCount = 0;

async function fetchUserNotifications() {
  try {
    const res = await protectedFetch('/api/notifications');
    if (!res.ok) throw new Error('Failed to fetch notifications');
    userNotifications = await res.json();
    renderUserNotifications();
  } catch (err) {
    userNotifications = [];
    renderUserNotifications();
  }
}

function renderUserNotifications() {
  userNotificationList.innerHTML = '';
  userUnreadCount = 0;
  if (!userNotifications.length) {
    userNoNotifications.classList.remove('hidden');
    userNotificationBadge.classList.add('hidden');
    return;
  }
  userNoNotifications.classList.add('hidden');
  userNotifications.forEach(n => {
    const isUnread = !n.read;
    if (isUnread) userUnreadCount++;
    const icon = n.icon ? `<i class=\"fas ${n.icon} text-lg mr-2\"></i>` : '';
    const typeClass = n.type === 'offer' ? 'bg-blue-50' : n.type === 'order' ? 'bg-green-50' : 'bg-gray-50';
    const item = document.createElement('div');
    item.className = `flex items-start px-4 py-3 ${typeClass} ${isUnread ? 'font-semibold' : ''}`;
    item.innerHTML = `
      <div class=\"mr-3 mt-1\">${icon}</div>
      <div class=\"flex-1\">
        <div class=\"text-sm text-gray-900\">${n.message}</div>
        <div class=\"text-xs text-gray-500 mt-1\">${new Date(n.createdAt).toLocaleString()}</div>
      </div>
      ${isUnread ? `<button class=\"ml-2 text-xs text-blue-600 hover:underline\" onclick=\"markUserNotificationRead('${n._id}')\">Mark read</button>` : ''}
    `;
    userNotificationList.appendChild(item);
  });
  if (userUnreadCount > 0) {
    userNotificationBadge.textContent = userUnreadCount;
    userNotificationBadge.classList.remove('hidden');
  } else {
    userNotificationBadge.classList.add('hidden');
  }
}

window.markUserNotificationRead = async function(id) {
  try {
    await protectedFetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
    fetchUserNotifications();
  } catch {}
};

if (userNotificationBell && userNotificationDropdown) {
  userNotificationBell.addEventListener('click', function(e) {
    e.stopPropagation();
    userNotificationDropdown.classList.toggle('hidden');
    if (!userNotificationDropdown.classList.contains('hidden')) fetchUserNotifications();
  });
  document.addEventListener('click', function(e) {
    if (!userNotificationDropdown.classList.contains('hidden')) {
      if (!userNotificationDropdown.contains(e.target) && e.target !== userNotificationBell) {
        userNotificationDropdown.classList.add('hidden');
      }
    }
  });
}
// Poll every 15s
if (userNotificationBell) setInterval(fetchUserNotifications, 15000);

// ========== GLOBAL ERROR HANDLER FOR CHROME EXTENSIONS ==========
window.addEventListener('error', function(event) {
  // Ignore Chrome extension related errors
  if (event.error && event.error.message && 
      (event.error.message.includes('message channel closed') || 
       event.error.message.includes('contentScript') ||
       event.error.message.includes('chrome-extension') ||
       event.error.message.includes('i18next') ||
       event.filename && event.filename.includes('contentScript'))) {
    event.preventDefault();
    console.log('Chrome extension error ignored:', event.error.message);
    return false;
  }
});

// Handle unhandled promise rejections (Chrome extension related)
window.addEventListener('unhandledrejection', function(event) {
  if (event.reason && 
      ((event.reason.message && 
        (event.reason.message.includes('message channel closed') || 
         event.reason.message.includes('contentScript') ||
         event.reason.message.includes('chrome-extension') ||
         event.reason.message.includes('i18next'))) ||
       (typeof event.reason === 'string' && 
        (event.reason.includes('chrome-extension') ||
         event.reason.includes('contentScript') ||
         event.reason.includes('i18next'))))) {
    event.preventDefault();
    console.log('Chrome extension promise rejection ignored:', event.reason);
    return false;
  }
});

// Additional fetch error suppression for chrome-extension URLs
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const url = args[0];
  if (typeof url === 'string' && url.includes('chrome-extension://')) {
    console.log('Blocked chrome-extension fetch attempt:', url);
    return Promise.reject(new Error('chrome-extension fetch blocked'));
  }
  return originalFetch.apply(this, args);
};

// ========== FETCH RAZORPAY KEY FOR FRONTEND ==========
(async function fetchRazorpayKey() {
  try {
    const res = await fetch('/api/config/razorpay');
    const data = await res.json();
    window.RAZORPAY_KEY_ID = data.key;
  } catch (error) {
    console.log('Could not fetch Razorpay key, using fallback');
            window.RAZORPAY_KEY_ID = 'rzp_live_gBP9geXusrKWUg';
  }
})();

// Modern Address Selection Modal Logic
async function openAddressSelectionModal(productId) {
  const modal = document.getElementById('addressSelectionModal');
  const addressListDiv = document.getElementById('addressList');
  const addNewAddressBtn = document.getElementById('addNewAddressBtn');
  const addressForm = document.getElementById('addressForm');
  const continueBtn = document.getElementById('continueToSummaryBtn');
  const closeBtn = document.getElementById('closeAddressModal');
  const cancelAddressBtn = document.getElementById('cancelAddressBtn');
  const saveAddressBtn = document.getElementById('saveAddressBtn');

  // Always reset form/button visibility when opening modal
  if (addressForm) addressForm.style.display = 'none';
  if (addNewAddressBtn) addNewAddressBtn.style.display = 'block';

  let addresses = [];
  let selectedAddressId = null;

  async function fetchAddresses() {
    try {
      const res = await protectedFetch('/api/user/addresses');
      addresses = await res.json();
      renderAddresses();
    } catch {
      addresses = [];
      renderAddresses();
    }
  }

  function renderAddresses() {
    addressListDiv.innerHTML = '';
    if (!addresses.length) {
      addressListDiv.innerHTML = '<div class="text-gray-500">No addresses found. Please add one.</div>';
      return;
    }
    addresses.forEach((addr, index) => {
      const div = document.createElement('div');
      div.className = 'address-card border p-3 rounded mb-2 flex items-center';
      div.innerHTML = `
        <input type="radio" name="selectedAddress" value="${index}" ${addr.isDefault ? 'checked' : ''} class="mr-2" />
        <div class="flex-1">
          <div class="font-semibold">${addr.name}</div>
          <div class="text-xs">${addr.pincode}, ${addr.mobile}</div>
          <div class="text-gray-700">${addr.address}</div>
        </div>
      `;
      addressListDiv.appendChild(div);
    });
    // Set selectedAddressId
    const checked = addressListDiv.querySelector('input[name="selectedAddress"]:checked');
    selectedAddressId = checked ? checked.value : (addresses[0] ? '0' : null);
    addressListDiv.querySelectorAll('input[name="selectedAddress"]').forEach(radio => {
      radio.addEventListener('change', function() {
        selectedAddressId = this.value;
      });
    });
  }

  addNewAddressBtn.onclick = function() {
    addressForm.style.display = 'block';
    addNewAddressBtn.style.display = 'none';
  };
  cancelAddressBtn.onclick = function(e) {
    e.preventDefault();
    addressForm.style.display = 'none';
    addNewAddressBtn.style.display = 'block';
  };
  saveAddressBtn.onclick = async function(e) {
    e.preventDefault();
    const name = document.getElementById('addressName').value.trim();
    const mobile = document.getElementById('addressMobile').value.trim();
    const address = document.getElementById('addressLine').value.trim();
    const pincode = document.getElementById('addressPincode').value.trim();
    const state = document.getElementById('addressState').value.trim();
    const country = document.getElementById('addressCountry').value.trim();
    if (!name || !mobile || !address || !pincode) {
      showNotification('Please fill all required fields', 'error');
      return;
    }
    try {
      const res = await protectedFetch('/api/user/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, mobile, address, pincode, state, country })
      });
      if (res.ok) {
        showNotification('Address saved successfully!', 'success');
        // Clear form fields
        document.getElementById('addressName').value = '';
        document.getElementById('addressMobile').value = '';
        document.getElementById('addressLine').value = '';
        document.getElementById('addressPincode').value = '';
        document.getElementById('addressState').value = '';
        document.getElementById('addressCountry').value = '';
        addressForm.style.display = 'none';
        addNewAddressBtn.style.display = 'block';
        await fetchAddresses();
      } else {
        const err = await res.json();
        showNotification(err.message || 'Failed to save address', 'error');
      }
    } catch (err) {
      showNotification('Error saving address', 'error');
    }
  };
  closeBtn.onclick = function() {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  };
  continueBtn.onclick = function() {
    if (!selectedAddressId) {
      showNotification('Please select an address', 'error');
      return;
    }
    const selected = addresses[parseInt(selectedAddressId)];
    modal.style.display = 'none';
    document.body.style.overflow = '';
    openOrderSummaryModal(productId, selected);
  };
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
  await fetchAddresses();
}

// Cart Address Selection Modal
async function openCartAddressSelectionModal(cartItems, total) {
  const modal = document.getElementById('addressSelectionModal');
  const addressListDiv = document.getElementById('addressList');
  const addNewAddressBtn = document.getElementById('addNewAddressBtn');
  const addressForm = document.getElementById('addressForm');
  const continueBtn = document.getElementById('continueToSummaryBtn');
  const closeBtn = document.getElementById('closeAddressModal');
  const cancelAddressBtn = document.getElementById('cancelAddressBtn');
  const saveAddressBtn = document.getElementById('saveAddressBtn');

  // Always reset form/button visibility when opening modal
  if (addressForm) addressForm.style.display = 'none';
  if (addNewAddressBtn) addNewAddressBtn.style.display = 'block';

  let addresses = [];
  let selectedAddressId = null;

  async function fetchAddresses() {
    try {
      const res = await protectedFetch('/api/user/addresses');
      addresses = await res.json();
      renderAddresses();
    } catch {
      addresses = [];
      renderAddresses();
    }
  }

  function renderAddresses() {
    addressListDiv.innerHTML = '';
    if (!addresses.length) {
      addressListDiv.innerHTML = '<div class="text-gray-500">No addresses found. Please add one.</div>';
      return;
    }
    addresses.forEach((addr, index) => {
      const div = document.createElement('div');
      div.className = 'address-card border p-3 rounded mb-2 flex items-center';
      div.innerHTML = `
        <input type="radio" name="selectedCartAddress" value="${index}" ${addr.isDefault ? 'checked' : ''} class="mr-2" />
        <div class="flex-1">
          <div class="font-semibold">${addr.name}</div>
          <div class="text-xs">${addr.pincode}, ${addr.mobile}</div>
          <div class="text-gray-700">${addr.address}</div>
        </div>
      `;
      addressListDiv.appendChild(div);
    });
    // Set selectedAddressId
    const checked = addressListDiv.querySelector('input[name="selectedCartAddress"]:checked');
    selectedAddressId = checked ? checked.value : (addresses[0] ? '0' : null);
    addressListDiv.querySelectorAll('input[name="selectedCartAddress"]').forEach(radio => {
      radio.addEventListener('change', function() {
        selectedAddressId = this.value;
      });
    });
  }

  addNewAddressBtn.onclick = function() {
    addressForm.style.display = 'block';
    addNewAddressBtn.style.display = 'none';
  };
  cancelAddressBtn.onclick = function(e) {
    e.preventDefault();
    addressForm.style.display = 'none';
    addNewAddressBtn.style.display = 'block';
  };
  saveAddressBtn.onclick = async function(e) {
    e.preventDefault();
    const name = document.getElementById('addressName').value.trim();
    const mobile = document.getElementById('addressMobile').value.trim();
    const address = document.getElementById('addressLine').value.trim();
    const pincode = document.getElementById('addressPincode').value.trim();
    const state = document.getElementById('addressState').value.trim();
    const country = document.getElementById('addressCountry').value.trim();
    if (!name || !mobile || !address || !pincode) {
      showNotification('Please fill all required fields', 'error');
      return;
    }
    try {
      const res = await protectedFetch('/api/user/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, mobile, address, pincode, state, country })
      });
      if (res.ok) {
        showNotification('Address saved successfully!', 'success');
        // Clear form fields
        document.getElementById('addressName').value = '';
        document.getElementById('addressMobile').value = '';
        document.getElementById('addressLine').value = '';
        document.getElementById('addressPincode').value = '';
        document.getElementById('addressState').value = '';
        document.getElementById('addressCountry').value = '';
        addressForm.style.display = 'none';
        addNewAddressBtn.style.display = 'block';
        await fetchAddresses();
      } else {
        const err = await res.json();
        showNotification(err.message || 'Failed to save address', 'error');
      }
    } catch (err) {
      showNotification('Error saving address', 'error');
    }
  };
  closeBtn.onclick = function() {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  };
  continueBtn.onclick = function() {
    if (!selectedAddressId) {
      showNotification('Please select an address', 'error');
      return;
    }
    const selected = addresses[parseInt(selectedAddressId)];
    modal.style.display = 'none';
    document.body.style.overflow = '';
    openCartOrderSummaryModal(cartItems, selected, total);
  };

  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
  await fetchAddresses();
}

// Cart Order Summary Modal
async function openCartOrderSummaryModal(cartItems, addressObj, total) {
  const modal = document.getElementById('orderSummaryModal');
  const closeBtn = document.getElementById('closeSummaryModal');
  const payBtn = document.getElementById('payWithRazorpayBtn');
  
  // Create cart summary HTML
  let cartHTML = '';
  cartItems.forEach(item => {
    cartHTML += `
      <div class="flex items-center gap-4 mb-4 p-3 border rounded">
        <img src="${item.image && item.image.startsWith('http') ? item.image : `/uploads/${item.image || 'logoindex.png'}`}" 
             alt="${item.name}" class="w-16 h-16 object-cover rounded" />
        <div class="flex-1">
          <div class="font-semibold">${item.name}</div>
          <div class="text-blue-600 font-bold">₹${item.price}</div>
          <div class="text-gray-600">Qty: ${item.quantity}</div>
          <div class="text-gray-800 font-semibold">Subtotal: ₹${(item.price * item.quantity).toFixed(2)}</div>
        </div>
      </div>
    `;
  });
  
  // Update modal content
  const productInfoDiv = document.getElementById('summaryProductInfo');
  if (productInfoDiv) {
    productInfoDiv.innerHTML = `
      <div class="w-full">
        <h3 class="font-semibold text-lg mb-3">Cart Items</h3>
        ${cartHTML}
      </div>
    `;
  }
  
  const addressDiv = document.getElementById('summaryAddress');
  if (addressDiv) {
    addressDiv.innerHTML = `
      <strong>${addressObj.name}</strong><br>
      ${addressObj.address}<br>
      ${addressObj.pincode}, ${addressObj.state}<br>
      Mobile: ${addressObj.mobile}
    `;
  }
  
  const totalDiv = document.getElementById('summaryTotal');
  if (totalDiv) {
    totalDiv.textContent = `₹${total.toFixed(2)}`;
  }
  
  // Close modal
  closeBtn.onclick = function() {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  };
  
  // Payment handler for cart
  payBtn.onclick = async function() {
    const token = getToken();
    if (!token) {
      showNotification('Please login to place order', 'error');
      return;
    }
    
    payBtn.disabled = true;
    payBtn.textContent = 'Processing...';
    
    try {
      // Create order for cart items
      const orderItems = cartItems.map(item => ({
        product: item._id,
        quantity: item.quantity,
        price: item.price
      }));
      
      // Create Razorpay order for cart
      const razorpayOrderRes = await fetch('/api/orders/razorpay/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: orderItems,
          total: total
        })
      });
      
      if (!razorpayOrderRes.ok) {
        const error = await razorpayOrderRes.json();
        throw new Error(error.message || 'Failed to create payment order');
      }
      
      const razorpayOrder = await razorpayOrderRes.json();
      console.log('Razorpay order created for cart:', razorpayOrder);
      
      // Initialize Razorpay payment
      const options = {
        key: window.RAZORPAY_KEY_ID || 'rzp_live_gBP9geXusrKWUg',
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'FreshFruits',
        description: 'Fresh Fruits & Vegetables - Cart Order',
        order_id: razorpayOrder.id,
        handler: async function (response) {
          console.log('Cart payment successful:', response);
          
          try {
            // Create order data for cart
            const orderData = {
              items: orderItems,
              name: addressObj.name,
              mobile: addressObj.mobile,
              address: addressObj.address,
              pincode: addressObj.pincode,
              total: total,
              paymentMethod: 'Razorpay',
              paymentStatus: 'Completed',
              paymentId: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            };
            
            const orderRes = await fetch('/api/orders/razorpay/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                realOrderDetails: orderData
              })
            });
            
            if (orderRes.ok) {
              const result = await orderRes.json();
              showNotification('Order placed successfully!', 'success');
              modal.style.display = 'none';
              document.body.style.overflow = '';
              
              // Clear cart after successful order
              await clearCart();
              
              // Redirect to orders page or show success
              setTimeout(() => {
                if (window.location.pathname.includes('orders.html')) {
                  window.location.reload();
                } else {
                  window.location.href = '/orders.html';
                }
              }, 2000);
            } else {
              const error = await orderRes.json();
              throw new Error(error.message || 'Failed to verify payment');
            }
          } catch (error) {
            console.error('Order creation error:', error);
            showNotification('Payment successful but order creation failed. Please contact support.', 'error');
          }
        },
        prefill: {
          name: addressObj.name,
          contact: addressObj.mobile
        },
        theme: {
          color: '#22c55e'
        }
      };
      
      // Check if this is a mock order
      if (razorpayOrder.id && razorpayOrder.id.startsWith('order_mock_')) {
        console.log('Mock cart payment detected, simulating successful payment');
        const mockPaymentResponse = {
          razorpay_payment_id: 'pay_mock_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
          razorpay_order_id: razorpayOrder.id,
          razorpay_signature: 'mock_signature_' + Date.now()
        };
        setTimeout(() => options.handler(mockPaymentResponse), 1000);
      } else {
        // Real Razorpay payment
        const rzp = new Razorpay(options);
        rzp.open();
      }
      
    } catch (error) {
      console.error('Cart payment error:', error);
      showNotification(error.message || 'Payment failed. Please try again.', 'error');
    } finally {
      payBtn.disabled = false;
      payBtn.textContent = 'Pay with Razorpay';
    }
  };
  
  // Store selected address for other functions
  window.selectedAddress = addressObj;
  
  // Show the modal
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
}

// Hook into buyNow to use the new modal
const oldBuyNow = window.buyNow;
window.buyNow = function(productId) {
  openAddressSelectionModal(productId);
};

function showToast(message, type = 'success') {
  const toast = document.getElementById('toastNotification');
  if (!toast) return;
  toast.textContent = message;
  toast.style.background = type === 'error' ? '#f44336' : '#43a047';
  toast.style.display = 'block';
  toast.style.opacity = '1';
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => { toast.style.display = 'none'; }, 300);
  }, 2500);
}
function showLoadingSpinner(show) {
  const spinner = document.getElementById('loadingSpinner');
  if (!spinner) return;
  spinner.style.display = show ? 'block' : 'none';
}

// Order Summary Modal Logic (with quantity selection and improved error handling)
async function openOrderSummaryModal(productId, addressObj) {
  const modal = document.getElementById('orderSummaryModal');
  const closeBtn = document.getElementById('closeSummaryModal');
  const payBtn = document.getElementById('payWithRazorpayBtn');
  const productName = document.getElementById('summaryProductName');
  const productPrice = document.getElementById('summaryProductPrice');
  const productQtyInput = document.getElementById('summaryProductQty');
  const qtyMinus = document.getElementById('summaryQtyMinus');
  const qtyPlus = document.getElementById('summaryQtyPlus');
  const productImage = document.getElementById('summaryProductImage');
  const summaryAddress = document.getElementById('summaryAddress');
  const summaryTotal = document.getElementById('summaryTotal');
  
  // Store selected address and product globally for payment handler
  window.selectedAddress = addressObj;
  window.selectedProduct = null;
  window.selectedQuantity = 1;

  // Fetch product details
  let product;
  try {
    showLoadingSpinner(true);
    const res = await fetch(`/api/items/${productId}`);
    if (!res.ok) throw new Error('Product not found');
    product = await res.json();
    window.selectedProduct = product; // Store product globally
  } catch (err) {
    showLoadingSpinner(false);
    showNotification('Could not fetch product details.', 'error');
    return;
  } finally {
    showLoadingSpinner(false);
  }
  let qty = 1;
  function updateTotal() {
    qty = parseInt(productQtyInput.value) || 1;
    if (qty < 1) qty = 1;
    productQtyInput.value = qty;
    window.selectedQuantity = qty; // Update global quantity
    const subtotal = qty * product.price;
    const shipping = subtotal > 1000 ? 0 : 50;
    const total = subtotal + shipping;
    summaryTotal.textContent = `₹${total}`;
    return total;
  }

  // Populate modal
  productName.textContent = product.name;
  productPrice.textContent = `₹${product.price}`;
  productQtyInput.value = qty;
  productImage.src = product.image && product.image.startsWith('http') ? product.image : `/uploads/${product.image || 'logoindex.png'}`;
  summaryAddress.innerHTML = `
    <div><span class='font-semibold'>${addressObj.name}</span> (${addressObj.mobile})</div>
    <div>${addressObj.address}, ${addressObj.pincode}</div>
    <div>${addressObj.state || ''} ${addressObj.country || ''}</div>
  `;
  updateTotal();

  qtyMinus.onclick = function() {
    let val = parseInt(productQtyInput.value) || 1;
    if (val > 1) productQtyInput.value = val - 1;
    updateTotal();
  };
  qtyPlus.onclick = function() {
    let val = parseInt(productQtyInput.value) || 1;
    productQtyInput.value = val + 1;
    updateTotal();
  };
  productQtyInput.oninput = updateTotal;

  // Payment handler
  payBtn.onclick = async function() {
    payBtn.disabled = true;
    payBtn.textContent = 'Processing...';
    showLoadingSpinner(true);
    let total = updateTotal();
    
    try {
      // Get user token
      const token = localStorage.getItem('token');
      if (!token) {
        showNotification('Please login to continue', 'error');
        payBtn.disabled = false;
        payBtn.textContent = 'Place Order';
        showLoadingSpinner(false);
        return;
      }

      // Get user data
      const userObj = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = userObj._id || userObj.id;
      
      if (!userId) {
        showNotification('User not logged in. Please log in again.', 'error');
        window.location.href = '/user-signup.html';
        return;
      }

      // Place order with Razorpay payment
      const payBtn = document.getElementById('payWithRazorpayBtn');
      
      if (!token) {
        showNotification('Please login to place order', 'error');
        return;
      }
      
      if (!window.selectedAddress) {
        showNotification('Please select a shipping address', 'error');
        return;
      }
      
      payBtn.disabled = true;
      payBtn.textContent = 'Processing...';
      showLoadingSpinner(true);
      
      try {
        // Step 1: Create Razorpay order
        const razorpayOrderRes = await fetch('/api/orders/razorpay/create-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            amount: total,
            currency: 'INR'
          })
        });
        
        if (!razorpayOrderRes.ok) {
          const error = await razorpayOrderRes.json();
          throw new Error(error.message || 'Failed to create payment order');
        }
        
        const razorpayOrder = await razorpayOrderRes.json();
        console.log('Razorpay order created:', razorpayOrder);
        
        // Step 2: Initialize Razorpay payment
        const options = {
          key: window.RAZORPAY_KEY_ID || 'rzp_live_gBP9geXusrKWUg', // Use fetched key or fallback
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          name: 'FreshFruits',
          description: 'Fresh Fruits & Vegetables',
          order_id: razorpayOrder.id,
          handler: async function (response) {
            console.log('Payment successful:', response);
            
            try {
              // Step 3: Verify payment and create order
              const orderData = {
                items: [{
                  item: window.selectedProduct._id,
                  quantity: window.selectedQuantity
                }],
                recipientName: window.selectedAddress.name,
                mobile: window.selectedAddress.mobile,
                address: window.selectedAddress.address,
                pincode: window.selectedAddress.pincode,
                total: total,
                paymentMethod: 'Razorpay',
                paymentStatus: 'Completed',
                paymentId: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              };
              
              const orderRes = await fetch('/api/orders/razorpay/verify-payment', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  realOrderDetails: orderData
                })
              });
              
              if (orderRes.ok) {
                const order = await orderRes.json();
                showNotification('Order placed successfully!', 'success');
                showOrderConfirmationModal(order.order);
                
                // Refresh orders if on orders page
                if (typeof fetchAndRenderOrders === 'function') {
                  fetchAndRenderOrders();
                }
                
                // Close the modal
                setTimeout(() => {
                  const modal = document.getElementById('orderSummaryModal');
                  if (modal) {
                    modal.style.display = 'none';
                  }
                }, 3000);
              } else {
                const error = await orderRes.json();
                throw new Error(error.message || 'Failed to verify payment');
              }
            } catch (error) {
              console.error('Payment verification error:', error);
              
              // Check if it's a Chrome extension related error
              if (error.message && error.message.includes('message channel closed')) {
                showNotification('Payment completed successfully! Please check your order history.', 'success');
                // Close the modal and refresh orders
                setTimeout(() => {
                  const modal = document.getElementById('orderSummaryModal');
                  if (modal) {
                    modal.style.display = 'none';
                  }
                  if (typeof fetchAndRenderOrders === 'function') {
                    fetchAndRenderOrders();
                  }
                }, 2000);
              } else {
                showNotification('Payment verification failed. Please contact support.', 'error');
              }
            }
          },
          prefill: {
            name: window.selectedAddress.name,
            contact: window.selectedAddress.mobile
          },
          theme: {
            color: '#10B981'
          }
        };
        
        // Check if this is a mock order (for development)
        if (razorpayOrder.id && razorpayOrder.id.startsWith('order_mock_')) {
          console.log('Mock payment detected, simulating successful payment');
          
          // Simulate successful payment response for mock orders
          const mockPaymentResponse = {
            razorpay_payment_id: 'pay_mock_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            razorpay_order_id: razorpayOrder.id,
            razorpay_signature: 'mock_signature_' + Date.now()
          };
          
          // Call the payment handler directly with mock response
          setTimeout(() => options.handler(mockPaymentResponse), 1000);
          
        } else {
          // Real Razorpay payment
          const rzp = new Razorpay(options);
          rzp.open();
        }
        
      } catch (error) {
        console.error('Payment error:', error);
        showNotification(error.message || 'Payment failed. Please try again.', 'error');
      } finally {
        payBtn.disabled = false;
        payBtn.textContent = 'Pay with Razorpay';
        showLoadingSpinner(false);
      }
    } catch (error) {
      console.error('Order processing error:', error);
      showNotification(error.message || 'Failed to process order. Please try again.', 'error');
      payBtn.disabled = false;
      payBtn.textContent = 'Pay with Razorpay';
      showLoadingSpinner(false);
    }
  };
  closeBtn.onclick = function() {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  };
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
}

// Show Order Confirmation Modal
function showOrderConfirmationModal(order) {
  const modal = document.getElementById('orderConfirmationModal');
  if (!modal) {
    console.log('Order confirmation modal not found, showing success notification instead');
    showNotification('Order placed successfully! Check your order history.', 'success');
    return;
  }
  
  const orderIdDiv = document.getElementById('confirmationOrderId');
  const orderDetailsDiv = document.getElementById('confirmationOrderDetails');
  const closeBtn = document.getElementById('closeConfirmationModal');
  
  if (orderIdDiv) {
    orderIdDiv.textContent = order && order._id ? `Order ID: ${order._id}` : 'Order placed successfully!';
  }
  
  if (orderDetailsDiv) {
    orderDetailsDiv.innerHTML = order ? `
      <div><b>Product(s):</b> ${order.items && order.items.length ? order.items.map(i => i.item?.name || '').join(', ') : ''}</div>
      <div><b>Total:</b> ₹${order.total || 'N/A'}</div>
      <div><b>Status:</b> ${order.status || 'Processing'}</div>
    ` : '<div>Order details will be available in your order history.</div>';
  }
  
  if (closeBtn) {
    closeBtn.onclick = function() {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    };
  }
  
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
}

// Enhanced Real-time Order History Fetch & Render
async function fetchAndRenderOrders() {
  const ordersList = document.getElementById('ordersList');
  const ordersEmptyState = document.getElementById('ordersEmptyState');
  if (!ordersList) return;
  try {
    ordersList.innerHTML = '<div class="text-center py-8 text-gray-400">Loading orders...</div>';
    const token = localStorage.getItem('token');
    const res = await fetch('/api/orders/user', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch orders');
    const orders = await res.json();
    if (!orders.length) {
      ordersList.innerHTML = '';
      if (ordersEmptyState) ordersEmptyState.classList.remove('hidden');
      return;
    }
    if (ordersEmptyState) ordersEmptyState.classList.add('hidden');
    ordersList.innerHTML = orders.map(order => {
      const statusSteps = [
        { key: 'pending', label: 'Ordered' },
        { key: 'paid', label: 'Paid' },
        { key: 'shipped', label: 'Shipped' },
        { key: 'out_for_delivery', label: 'Out for Delivery' },
        { key: 'delivered', label: 'Delivered' },
        { key: 'cancelled', label: 'Cancelled' }
      ];
      const currentIdx = statusSteps.findIndex(s => s.key === order.status);
      let showCancelled = order.status === 'cancelled';
      let stepsToShow = showCancelled ? statusSteps.slice(0, 1).concat(statusSteps.slice(-1)) : statusSteps.slice(0, 5);
      const progressBar = `
        <div class="flex items-center justify-between mb-3">
          ${stepsToShow.map((step, idx) => `
            <div class="flex-1 flex flex-col items-center">
              <div class="w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm
                ${order.status === step.key || (!showCancelled && idx <= currentIdx) ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}
                ">
                ${idx + 1}
              </div>
              <div class="mt-1 text-xs font-medium ${order.status === step.key ? 'text-blue-700' : 'text-gray-500'}">${step.label}</div>
            </div>
            ${idx < stepsToShow.length - 1 ? `<div class="flex-1 h-1 ${(!showCancelled && idx < currentIdx) ? 'bg-blue-600' : 'bg-gray-200'}"></div>` : ''}
          `).join('')}
        </div>
      `;
      const statusColor = {
        pending: 'bg-yellow-100 text-yellow-800',
        paid: 'bg-blue-100 text-blue-800',
        shipped: 'bg-purple-100 text-purple-800',
        out_for_delivery: 'bg-orange-100 text-orange-800',
        delivered: 'bg-green-100 text-green-800',
        cancelled: 'bg-red-100 text-red-800'
      }[order.status] || 'bg-gray-100 text-gray-800';
      return `
      <div class="mb-6 border rounded-lg shadow-sm p-4 bg-white flex flex-col md:flex-row gap-4 items-center">
        <div class="flex-1 w-full">
          ${progressBar}
          <div class="flex flex-wrap gap-4 items-center mb-2">
            <span class="font-semibold">Order ID:</span> <span>${order._id}</span>
            <span class="font-semibold">Placed:</span> <span>${new Date(order.createdAt).toLocaleString()}</span>
            <span class="font-semibold">Status:</span> <span class="px-2 py-1 rounded ${statusColor}">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
          </div>
          <div class="mb-2"><span class="font-semibold">Address:</span> ${order.address}</div>
          <div class="mb-2"><span class="font-semibold">Total:</span> ₹${order.total}</div>
          <div class="mb-2"><span class="font-semibold">Items:</span> ${order.items.map(i => `${i.quantity} x ${i.item?.name || ''}`).join(', ')}</div>
        </div>
        <div class="flex gap-2 flex-1 items-center">
          ${order.items.map(i =>
            `<img src="${i.item?.image ? (i.item.image.startsWith('http') ? i.item.image : '/uploads/' + i.item.image) : '/uploads/logoindex.png'}" alt="${i.item?.name || ''}" class="w-16 h-16 object-cover rounded border" title="${i.item?.name || ''}">`
          ).join('')}
        </div>
      </div>
      `;
    }).join('');
  } catch (e) {
    ordersList.innerHTML = '<div class="text-center py-8 text-red-500">Failed to load orders.</div>';
    if (ordersEmptyState) ordersEmptyState.classList.add('hidden');
  }
}

// --- Recently Viewed Products Logic ---
function addRecentlyViewed(productId) {
  if (!productId) return;
  let viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
  viewed = viewed.filter(id => id !== productId); // Remove if already exists
  viewed.unshift(productId); // Add to front
  if (viewed.length > 10) viewed = viewed.slice(0, 10); // Keep max 10
  localStorage.setItem('recentlyViewed', JSON.stringify(viewed));
}

async function fetchAndRenderRecentlyViewed(containerId, excludeId) {
  let viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
  if (excludeId) viewed = viewed.filter(id => id !== excludeId);
  if (!viewed.length) {
    document.getElementById(containerId).innerHTML = '<div class="text-gray-400 text-center py-6">No recently viewed products.</div>';
    return;
  }
  // Fetch product details for all IDs with timeout
  const prods = await Promise.all(viewed.map(async id => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const res = await fetch(`/api/items/${id}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        console.log(`Product ${id} not found (${res.status})`);
        return null;
      }
      return await res.json();
    } catch (error) { 
      if (error.name === 'AbortError') {
        console.log(`Request timeout for product ${id}`);
      } else {
        console.log(`Error fetching product ${id}:`, error);
      }
      return null; 
    }
  }));
  const products = prods.filter(Boolean);
  if (!products.length) {
    // Clear invalid recently viewed products if all failed to load
    console.log('All recently viewed products failed to load, clearing invalid data...');
    localStorage.removeItem('recentlyViewed');
    document.getElementById(containerId).innerHTML = '<div class="text-gray-400 text-center py-6">No recently viewed products.</div>';
    return;
  }
  document.getElementById(containerId).innerHTML = `
    <div class="section-title mb-2">Recently Viewed</div>
    <div class="flex gap-4 overflow-x-auto pb-2">
      ${products.map(p => `
        <div class="related-card min-w-[180px]" onclick="window.location.href='product.html?id=${p._id}'">
          <img src="${p.image ? (p.image.startsWith('http') ? p.image : '/uploads/' + p.image) : '/uploads/logoindex.png'}" alt="${p.name}" class="w-full h-28 object-cover rounded mb-2">
          <div class="font-semibold mb-1">${p.name}</div>
          <div class="text-blue-600 font-bold">₹${p.price.toFixed(2)}</div>
        </div>
      `).join('')}
    </div>
  `;
}
function showConfirmationModal(message, actionType) {
  const modal = document.getElementById('confirmationModal');
  const msg = document.getElementById('confirmationMessage');
  const viewBtn = document.getElementById('viewActionBtn');
  const continueBtn = document.getElementById('continueShoppingBtn');
  if (!modal || !msg || !viewBtn || !continueBtn) return;
  msg.textContent = message;
  viewBtn.textContent = actionType === 'cart' ? 'View Cart' : 'View Wishlist';
  viewBtn.onclick = function() {
    modal.style.display = 'none';
    window.location.href = actionType === 'cart' ? 'cart.html' : 'wishlist-view.html';
  };
  continueBtn.onclick = function() {
    modal.style.display = 'none';
  };
  modal.style.display = 'flex';
}
// Enhanced buyNow function with loading feedback
const origBuyNow = window.buyNow;
window.buyNow = async function(productId) {
  showLoadingSpinner(true);
  try {
    // Call the original buyNow function which opens address selection
    if (typeof origBuyNow === 'function') {
      await origBuyNow(productId);
    } else {
      // Fallback to direct address selection
      await openAddressSelectionModal(productId);
    }
  } catch (e) {
    console.error('Error in buyNow:', e);
    showToast('Error placing order', 'error');
  } finally {
    showLoadingSpinner(false);
  }
};

// Sidebar navigation logic for modern dashboard
if (document.querySelectorAll('.sidebar-link').length) {
  document.querySelectorAll('.sidebar-link').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.sidebar-link').forEach(b => b.classList.remove('text-blue-700', 'font-semibold'));
      this.classList.add('text-blue-700', 'font-semibold');
      const section = this.dataset.section;
      document.querySelectorAll('main > section').forEach(sec => sec.classList.add('hidden'));
      if (section === 'logout') {
        // Handle logout logic here
        alert('Logged out!');
        return;
      }
      document.getElementById(section + 'Section').classList.remove('hidden');
    });
  });
}

// Utility function to get proper product image URL with fallbacks
function getProductImageUrl(product, index = 0) {
  // If product has images array, use it
  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    const image = product.images[index] || product.images[0];
    if (image) {
      return image.startsWith('http') ? image : `/uploads/${image}`;
    }
  }
  
  // Fallback to single image field
  if (product.image) {
    return product.image.startsWith('http') ? product.image : `/uploads/${product.image}`;
  }
  
  // Final fallback to default image
  return '/uploads/logoindex.png';
}

// Utility function to get all product images as an array
function getProductImages(product) {
  let images = [];
  
  // If product has images array, use it
  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    images = product.images.map(img => img.startsWith('http') ? img : `/uploads/${img}`);
  } else if (product.image) {
    // Fallback to single image
    images = [product.image.startsWith('http') ? product.image : `/uploads/${product.image}`];
  } else {
    // Final fallback
    images = ['/uploads/logoindex.png'];
  }
  
  return images;
}

// Clear invalid recently viewed products
function clearInvalidRecentlyViewed() {
  try {
    const viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    if (viewed.length > 0) {
      console.log('Clearing invalid recently viewed products...');
      localStorage.removeItem('recentlyViewed');
    }
  } catch (error) {
    console.log('Error clearing recently viewed products:', error);
    localStorage.removeItem('recentlyViewed');
  }
}

// Validate and clean recently viewed products
async function validateRecentlyViewed() {
  try {
    const viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    if (viewed.length === 0) return;
    
    console.log('Validating recently viewed products...');
    const validProducts = [];
    
    for (const id of viewed) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
        
        const res = await fetch(`/api/items/${id}`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (res.ok) {
          validProducts.push(id);
        }
      } catch (error) {
        console.log(`Invalid product ID: ${id}`);
      }
    }
    
    // Update localStorage with only valid products
    if (validProducts.length !== viewed.length) {
      console.log(`Cleaned recently viewed: ${viewed.length} -> ${validProducts.length} valid products`);
      localStorage.setItem('recentlyViewed', JSON.stringify(validProducts));
    }
  } catch (error) {
    console.log('Error validating recently viewed products:', error);
    localStorage.removeItem('recentlyViewed');
  }
}

// Call these functions to clean up invalid data
clearInvalidRecentlyViewed();
validateRecentlyViewed();

// Global function to manually clear recently viewed products (for debugging)
window.clearRecentlyViewed = function() {
  localStorage.removeItem('recentlyViewed');
  console.log('Recently viewed products cleared manually');
  location.reload();
};

// ✅ GLOBAL FUNCTION EXPORTS FOR CART AND WISHLIST
window.addToCart = addToCart;
window.toggleWishlist = toggleWishlist;
window.updateCartCount = updateCartCount;
window.getCart = getCart;
window.fetchCart = fetchCart;
window.showNotification = showNotification;
window.protectedFetch = protectedFetch;

console.log('✅ Global functions exported:', {
  addToCart: typeof window.addToCart,
  toggleWishlist: typeof window.toggleWishlist,
  updateCartCount: typeof window.updateCartCount,
  getCart: typeof window.getCart,
  fetchCart: typeof window.fetchCart,
  showNotification: typeof window.showNotification,
  protectedFetch: typeof window.protectedFetch
});