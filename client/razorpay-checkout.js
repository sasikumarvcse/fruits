// Enhanced Razorpay Checkout: COMPLETE CLEAN VERSION - Address → Quantity → Payment
(function() {
    'use strict';
    
    console.log('🔄 Enhanced Razorpay checkout loading...');

    // Global configuration
    let razorpayConfig = {
        keyId: null,
        checkoutData: {
            product: null,
            selectedAddress: null,
            quantity: 1,
            total: 0,
            deliveryCharge: 50 // Fixed delivery charge
        },
        userAddresses: []
    };

    // Initialize checkout functionality
    document.addEventListener('DOMContentLoaded', function() {
        initializeEnhancedCheckout();
    });

    async function initializeEnhancedCheckout() {
        await loadRazorpayKey();
        setupCheckoutEventListeners();
        console.log('✅ Enhanced checkout system initialized');
    }

    // Load Razorpay key
    async function loadRazorpayKey() {
        try {
            const response = await fetch('/api/payment/get-key');
            const data = await response.json();
            if (data.success) {
                razorpayConfig.keyId = data.key;
                console.log('✅ Razorpay key loaded');
            }
        } catch (error) {
            console.error('❌ Failed to load Razorpay key:', error);
        }
    }

    // Setup event listeners for checkout modals
    function setupCheckoutEventListeners() {
        console.log('🔄 Setting up checkout event listeners...');

        // Address modal events
        const addAddressBtn = document.getElementById('addAddressBtn');
        if (addAddressBtn) {
            addAddressBtn.onclick = () => showAddressForm();
        }
        
        const addressNextBtn = document.getElementById('addressNextBtn');
        if (addressNextBtn) {
            addressNextBtn.onclick = () => proceedToQuantity();
        }
        
        // Address form events
        const addressForm = document.getElementById('addressForm');
        if (addressForm) {
            addressForm.onsubmit = (e) => {
                e.preventDefault();
                saveAddress();
            };
        }
        
        // Quantity control events
        const decreaseQty = document.getElementById('decreaseQty');
        if (decreaseQty) {
            decreaseQty.onclick = () => changeQuantity(-1);
        }
        
        const increaseQty = document.getElementById('increaseQty');
        if (increaseQty) {
            increaseQty.onclick = () => changeQuantity(1);
        }
        
        const quantityInput = document.getElementById('quantityInput');
        if (quantityInput) {
            quantityInput.oninput = (e) => updateQuantity(parseInt(e.target.value) || 1);
        }
        
        const proceedToPayment = document.getElementById('proceedToPayment');
        if (proceedToPayment) {
            proceedToPayment.onclick = () => initiatePayment();
        }

        const backToAddress = document.getElementById('backToAddressBtn');
        if (backToAddress) {
            backToAddress.onclick = () => goBackToAddress();
        }

        console.log('✅ Checkout event listeners setup complete');
    }

    // ✅ ENTRY POINT: Buy Now button calls this (NOT Razorpay directly)
    function startCheckoutFlow(productId, productName, productPrice, productImage) {
        console.log('🛒 Starting checkout flow for:', productName);
        console.log('🔄 Flow: Address → Quantity → Payment');
        
        razorpayConfig.checkoutData.product = {
            _id: productId,
            name: productName,
            price: parseFloat(productPrice),
            image: productImage || '/uploads/logoindex.png'
        };
        
        // ✅ STEP 1: Show address selection (NOT Razorpay)
        loadAddressesAndShow();
    }

    // Step 1: Load and show addresses
    async function loadAddressesAndShow() {
        console.log('📍 STEP 1: Loading addresses...');
        await loadUserAddresses();
        showAddressModal();
    }

    async function loadUserAddresses() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                showNotification('Please login to continue', 'warning');
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 2000);
                return;
            }

            const response = await fetch('/api/user/addresses', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                razorpayConfig.userAddresses = await response.json();
                console.log(`✅ Loaded ${razorpayConfig.userAddresses.length} addresses`);
            } else {
                razorpayConfig.userAddresses = [];
                console.log('⚠️ No addresses found or failed to load');
            }
        } catch (error) {
            console.error('❌ Error loading addresses:', error);
            razorpayConfig.userAddresses = [];
        }
    }

    function showAddressModal() {
        console.log('📍 Showing address selection modal...');
        displayAddresses();
        const modal = document.getElementById('addressModal');
        if (modal) {
            modal.style.display = 'block';
        } else {
            console.error('❌ Address modal not found!');
        }
    }

    function displayAddresses() {
        const addressList = document.getElementById('addressList');
        if (!addressList) {
            console.error('❌ Address list element not found!');
            return;
        }
        
        if (razorpayConfig.userAddresses.length === 0) {
            addressList.innerHTML = `
                <div class="no-addresses">
                    <p>No saved addresses found</p>
                    <p>Please add a delivery address to continue</p>
                </div>
            `;
            const addressNextBtn = document.getElementById('addressNextBtn');
            if (addressNextBtn) addressNextBtn.disabled = true;
            return;
        }
        
        addressList.innerHTML = razorpayConfig.userAddresses.map(address => `
            <div class="address-item ${address.isDefault ? 'default' : ''}" 
                 data-address-id="${address._id}" 
                 onclick="selectAddress('${address._id}')">
                <div class="address-header">
                    <h4>${address.name || 'Address'}</h4>
                    ${address.isDefault ? '<span class="default-badge">Default</span>' : ''}
                </div>
                <div class="address-details">
                    <p><strong>${address.recipientName || address.name || 'N/A'}</strong></p>
                    <p>${address.mobile || 'N/A'}</p>
                    <p>${address.address || 'N/A'}</p>
                    <p>PIN: ${address.pincode || 'N/A'}</p>
                </div>
                <div class="address-actions" onclick="event.stopPropagation()">
                    <button class="edit-btn" onclick="editAddress('${address._id}')">Edit</button>
                    <button class="delete-btn" onclick="deleteAddress('${address._id}')">Delete</button>
                </div>
            </div>
        `).join('');
    }

    // Address selection
    function selectAddress(addressId) {
        console.log('📍 Address selected:', addressId);
        
        // Remove previous selection
        document.querySelectorAll('.address-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Add selection to clicked item
        const selectedItem = document.querySelector(`[data-address-id="${addressId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('selected');
        }
        
        // Store selected address
        razorpayConfig.checkoutData.selectedAddress = razorpayConfig.userAddresses.find(addr => addr._id === addressId);
        
        // Enable continue button
        const addressNextBtn = document.getElementById('addressNextBtn');
        if (addressNextBtn) {
            addressNextBtn.disabled = false;
        }
        
        showNotification('Address selected successfully!', 'success');
    }

    // Address management functions
    function showAddressForm(addressId = null) {
        const modal = document.getElementById('addressFormModal');
        const title = document.getElementById('addressFormTitle');
        const form = document.getElementById('addressForm');
        
        if (addressId) {
            // Edit mode
            const address = razorpayConfig.userAddresses.find(addr => addr._id === addressId);
            if (address) {
                title.textContent = 'Edit Address';
                document.getElementById('addressId').value = address._id;
                document.getElementById('recipientName').value = address.recipientName || address.name || '';
                document.getElementById('mobile').value = address.mobile || '';
                document.getElementById('address').value = address.address || '';
                document.getElementById('pincode').value = address.pincode || '';
                document.getElementById('city').value = address.city || '';
                document.getElementById('state').value = address.state || '';
                document.getElementById('addressType').value = address.addressType || 'home';
                document.getElementById('isDefault').checked = address.isDefault || false;
            }
        } else {
            // Add mode
            title.textContent = 'Add New Address';
            form.reset();
            document.getElementById('addressId').value = '';
        }
        
        modal.style.display = 'block';
    }

    async function saveAddress() {
        const formData = new FormData(document.getElementById('addressForm'));
        const addressData = {
            recipientName: formData.get('recipientName'),
            mobile: formData.get('mobile'),
            address: formData.get('address'),
            pincode: formData.get('pincode'),
            city: formData.get('city'),
            state: formData.get('state'),
            addressType: formData.get('addressType'),
            isDefault: formData.get('isDefault') === 'on'
        };

        const addressId = formData.get('addressId');
        const isEdit = addressId && addressId.trim() !== '';

        try {
            const token = localStorage.getItem('token');
            const url = isEdit ? `/api/user/addresses/${addressId}` : '/api/user/addresses';
            const method = isEdit ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(addressData)
            });

            if (response.ok) {
                showNotification(isEdit ? 'Address updated successfully!' : 'Address added successfully!', 'success');
                closeAddressFormModal();
                
                // Reload addresses
                await loadUserAddresses();
                displayAddresses();
            } else {
                const error = await response.json();
                showNotification(error.message || 'Failed to save address', 'error');
            }
        } catch (error) {
            console.error('❌ Error saving address:', error);
            showNotification('Failed to save address', 'error');
        }
    }

    function editAddress(addressId) {
        showAddressForm(addressId);
    }

    async function deleteAddress(addressId) {
        if (!confirm('Are you sure you want to delete this address?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/user/addresses/${addressId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                showNotification('Address deleted successfully!', 'success');
                
                // Reload addresses
                await loadUserAddresses();
                displayAddresses();
                
                // If deleted address was selected, clear selection
                if (razorpayConfig.checkoutData.selectedAddress && 
                    razorpayConfig.checkoutData.selectedAddress._id === addressId) {
                    razorpayConfig.checkoutData.selectedAddress = null;
                    const addressNextBtn = document.getElementById('addressNextBtn');
                    if (addressNextBtn) addressNextBtn.disabled = true;
                }
            } else {
                const error = await response.json();
                showNotification(error.message || 'Failed to delete address', 'error');
            }
        } catch (error) {
            console.error('❌ Error deleting address:', error);
            showNotification('Failed to delete address', 'error');
        }
    }

    // Step 2: Quantity selection
    function proceedToQuantity() {
        if (!razorpayConfig.checkoutData.selectedAddress) {
            showNotification('Please select a delivery address', 'warning');
            return;
        }

        console.log('🔢 STEP 2: Proceeding to quantity selection...');
        
        // Hide address modal
        const addressModal = document.getElementById('addressModal');
        if (addressModal) addressModal.style.display = 'none';
        
        // Show quantity modal
        showQuantityModal();
    }

    function showQuantityModal() {
        const modal = document.getElementById('quantityModal');
        const product = razorpayConfig.checkoutData.product;
        
        // Update product info
        document.getElementById('quantityProductImage').src = product.image;
        document.getElementById('quantityProductName').textContent = product.name;
        document.getElementById('quantityProductPrice').textContent = `₹${product.price}`;
        
        // Reset quantity
        razorpayConfig.checkoutData.quantity = 1;
        document.getElementById('quantityInput').value = '1';
        
        // Update price breakdown
        updatePriceBreakdown();
        
        modal.style.display = 'block';
    }

    function changeQuantity(delta) {
        const newQty = razorpayConfig.checkoutData.quantity + delta;
        if (newQty >= 1 && newQty <= 10) {
            razorpayConfig.checkoutData.quantity = newQty;
            document.getElementById('quantityInput').value = newQty;
            updatePriceBreakdown();
        }
    }

    function updateQuantity(qty) {
        if (qty >= 1 && qty <= 10) {
            razorpayConfig.checkoutData.quantity = qty;
            updatePriceBreakdown();
        }
    }

    function updatePriceBreakdown() {
        const product = razorpayConfig.checkoutData.product;
        const quantity = razorpayConfig.checkoutData.quantity;
        const basePrice = product.price * quantity;
        const deliveryCharge = razorpayConfig.checkoutData.deliveryCharge;
        const total = basePrice + deliveryCharge;
        
        document.getElementById('basePrice').textContent = `₹${basePrice.toFixed(2)}`;
        document.getElementById('quantityDisplay').textContent = quantity;
        document.getElementById('totalPrice').textContent = `₹${total.toFixed(2)}`;
        
        razorpayConfig.checkoutData.total = total;
    }

    // Step 3: Payment initiation
    function initiatePayment() {
        console.log('💳 STEP 3: Initiating payment...');
        
        if (!razorpayConfig.checkoutData.selectedAddress) {
            showNotification('Please select a delivery address', 'warning');
            return;
        }

        if (razorpayConfig.checkoutData.quantity < 1) {
            showNotification('Please select a valid quantity', 'warning');
            return;
        }

        // Hide quantity modal
        const quantityModal = document.getElementById('quantityModal');
        if (quantityModal) quantityModal.style.display = 'none';
        
        // Create Razorpay order
        createRazorpayOrder();
    }

    async function createRazorpayOrder() {
        try {
            showNotification('Creating payment order...', 'info');
            
            const token = localStorage.getItem('token');
            const orderData = {
                productId: razorpayConfig.checkoutData.product._id,
                quantity: razorpayConfig.checkoutData.quantity,
                amount: razorpayConfig.checkoutData.total, // This already includes delivery charge
                deliveryAddress: razorpayConfig.checkoutData.selectedAddress
            };

            const response = await fetch('/api/orders/razorpay/create-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(orderData)
            });

            if (response.ok) {
                const order = await response.json();
                console.log('✅ Razorpay order created:', order);
                
                // Open Razorpay payment
                openRazorpayPayment(order);
            } else {
                const error = await response.json();
                showNotification(error.message || 'Failed to create payment order', 'error');
            }
        } catch (error) {
            console.error('❌ Error creating Razorpay order:', error);
            showNotification('Failed to create payment order', 'error');
        }
    }

    function openRazorpayPayment(order) {
        if (!razorpayConfig.keyId) {
            showNotification('Payment gateway not configured', 'error');
            return;
        }

        const options = {
            key: razorpayConfig.keyId,
            amount: Math.round(order.amount * 100), // Convert to paise
            currency: 'INR',
            name: 'Arobowl',
            description: `${razorpayConfig.checkoutData.product.name} x ${razorpayConfig.checkoutData.quantity}`,
            order_id: order.id,
            handler: function(response) {
                console.log('✅ Payment successful:', response);
                verifyPayment(response, order);
            },
            prefill: {
                name: razorpayConfig.checkoutData.selectedAddress.recipientName || razorpayConfig.checkoutData.selectedAddress.name,
                contact: razorpayConfig.checkoutData.selectedAddress.mobile,
                address: razorpayConfig.checkoutData.selectedAddress.address
            },
            notes: {
                address: razorpayConfig.checkoutData.selectedAddress.address,
                delivery_charge: '₹50'
            },
            theme: {
                color: '#4CAF50'
            }
        };

        const rzp = new Razorpay(options);
        rzp.open();
    }

    async function verifyPayment(paymentResponse, order) {
        try {
            showNotification('Verifying payment...', 'info');
            
            const token = localStorage.getItem('token');
            const verifyData = {
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
                realOrderDetails: {
                    productId: razorpayConfig.checkoutData.product._id,
                    quantity: razorpayConfig.checkoutData.quantity,
                    total: razorpayConfig.checkoutData.total,
                    recipientName: razorpayConfig.checkoutData.selectedAddress.recipientName || razorpayConfig.checkoutData.selectedAddress.name,
                    mobile: razorpayConfig.checkoutData.selectedAddress.mobile,
                    address: razorpayConfig.checkoutData.selectedAddress.address,
                    pincode: razorpayConfig.checkoutData.selectedAddress.pincode,
                    items: [{
                        item: razorpayConfig.checkoutData.product._id,
                        quantity: razorpayConfig.checkoutData.quantity
                    }]
                }
            };

            const response = await fetch('/api/orders/razorpay/verify-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(verifyData)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Payment verified:', result);
                
                showNotification('Payment successful! Order placed successfully.', 'success');
                
                // Reset checkout data
                razorpayConfig.checkoutData = {
                    product: null,
                    selectedAddress: null,
                    quantity: 1,
                    total: 0,
                    deliveryCharge: 50
                };
                
                // Redirect to orders page or show success
                setTimeout(() => {
                    window.location.href = '/orders.html';
                }, 2000);
            } else {
                const error = await response.json();
                showNotification(error.message || 'Payment verification failed', 'error');
            }
        } catch (error) {
            console.error('❌ Error verifying payment:', error);
            showNotification('Payment verification failed', 'error');
        }
    }

    // Navigation functions
    function goBackToAddress() {
        const quantityModal = document.getElementById('quantityModal');
        if (quantityModal) quantityModal.style.display = 'none';
        
        showAddressModal();
    }

    // Modal close functions
    function closeAddressModal() {
        const modal = document.getElementById('addressModal');
        if (modal) modal.style.display = 'none';
    }

    function closeAddressFormModal() {
        const modal = document.getElementById('addressFormModal');
        if (modal) modal.style.display = 'none';
    }

    function closeQuantityModal() {
        const modal = document.getElementById('quantityModal');
        if (modal) modal.style.display = 'none';
    }

    // Utility functions
    function showNotification(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(n => n.remove());
        
        // Create new notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto-remove after 4 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 4000);
    }

    // Make functions globally available
    window.startCheckoutFlow = startCheckoutFlow;
    window.selectAddress = selectAddress;
    window.editAddress = editAddress;
    window.deleteAddress = deleteAddress;
    window.showAddressForm = showAddressForm;
    window.closeAddressModal = closeAddressModal;
    window.closeAddressFormModal = closeAddressFormModal;
    window.closeQuantityModal = closeQuantityModal;
    window.showNotification = showNotification;

    console.log('✅ Enhanced Razorpay checkout system loaded successfully');
})();
