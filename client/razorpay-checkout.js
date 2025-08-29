// Enhanced Razorpay Checkout: COMPLETE CLEAN VERSION - Address → Quantity → Payment
(function() {
    'use strict';
    
    console.log('🔄 Enhanced Razorpay checkout loading...');

    // Local scope variables to avoid conflicts
    let razorpayConfig = {
        keyId: null,
        checkoutData: {
            product: null,
            selectedAddress: null,
            quantity: 1,
            total: 0
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

    function selectAddress(addressId) {
        console.log('📍 Address selected:', addressId);
        
        // Remove previous selection
        document.querySelectorAll('.address-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Add selection to clicked address
        const selectedItem = document.querySelector(`[data-address-id="${addressId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('selected');
        }
        
        razorpayConfig.checkoutData.selectedAddress = razorpayConfig.userAddresses.find(addr => addr._id === addressId);
        
        const addressNextBtn = document.getElementById('addressNextBtn');
        if (addressNextBtn) {
            addressNextBtn.disabled = false;
        }
        
        console.log('✅ Address selected successfully');
    }

    // Address form management
    function showAddressForm(address = null) {
        const modal = document.getElementById('addressFormModal');
        const title = document.getElementById('addressFormTitle');
        const form = document.getElementById('addressForm');
        
        if (address) {
            title.textContent = 'Edit Address';
            document.getElementById('addressId').value = address._id;
            document.getElementById('recipientNameNew').value = address.recipientName || address.name || '';
            document.getElementById('mobileNew').value = address.mobile || '';
            document.getElementById('addressNew').value = address.address || '';
            document.getElementById('pincodeNew').value = address.pincode || '';
        } else {
            title.textContent = 'Add New Address';
            form.reset();
            document.getElementById('addressId').value = '';
        }
        
        modal.style.display = 'block';
    }

    function editAddress(addressId) {
        const address = razorpayConfig.userAddresses.find(addr => addr._id === addressId);
        if (address) {
            showAddressForm(address);
        }
    }

    async function deleteAddress(addressId) {
        if (!confirm('Are you sure you want to delete this address?')) return;
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/user/addresses', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ addressId })
            });
            
            if (response.ok) {
                await loadUserAddresses();
                displayAddresses();
                showNotification('Address deleted successfully', 'success');
            } else {
                showNotification('Failed to delete address', 'error');
            }
        } catch (error) {
            console.error('Error deleting address:', error);
            showNotification('Error deleting address', 'error');
        }
    }

    async function saveAddress() {
        const addressId = document.getElementById('addressId').value;
        const addressData = {
            recipientName: document.getElementById('recipientNameNew').value.trim(),
            mobile: document.getElementById('mobileNew').value.trim(),
            address: document.getElementById('addressNew').value.trim(),
            pincode: document.getElementById('pincodeNew').value.trim(),
            name: document.getElementById('recipientNameNew').value.trim(),
            isDefault: razorpayConfig.userAddresses.length === 0
        };
        
        // Validation
        if (!addressData.recipientName || !addressData.mobile || !addressData.address || !addressData.pincode) {
            showNotification('Please fill all required fields', 'warning');
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            const url = '/api/user/addresses';
            const method = addressId ? 'PUT' : 'POST';
            
            if (addressId) {
                addressData.addressId = addressId;
            }
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(addressData)
            });
            
            if (response.ok) {
                document.getElementById('addressFormModal').style.display = 'none';
                await loadUserAddresses();
                displayAddresses();
                showNotification('Address saved successfully', 'success');
            } else {
                const errorData = await response.json();
                showNotification(errorData.message || 'Failed to save address', 'error');
            }
        } catch (error) {
            console.error('Error saving address:', error);
            showNotification('Error saving address', 'error');
        }
    }

    // ✅ STEP 2: Quantity selection (NOT Razorpay yet)
    function proceedToQuantity() {
        if (!razorpayConfig.checkoutData.selectedAddress) {
            showNotification('Please select an address', 'warning');
            return;
        }
        
        console.log('🔢 STEP 2: Proceeding to quantity selection...');
        
        // Hide address modal
        document.getElementById('addressModal').style.display = 'none';
        
        // Show quantity modal
        showQuantityModal();
    }

    function showQuantityModal() {
        console.log('🔢 Showing quantity selection modal...');
        
        const product = razorpayConfig.checkoutData.product;
        
        // Update product display
        document.getElementById('qtyProductImage').src = product.image;
        document.getElementById('qtyProductName').textContent = product.name;
        document.getElementById('qtyProductPrice').textContent = `₹${product.price.toFixed(2)}`;
        
        // Show selected address
        const address = razorpayConfig.checkoutData.selectedAddress;
        const addressText = `${address.recipientName || address.name}, ${address.mobile}, ${address.address}, ${address.pincode}`;
        document.getElementById('selectedAddress').textContent = addressText;
        
        // Reset quantity
        razorpayConfig.checkoutData.quantity = 1;
        document.getElementById('quantityInput').value = razorpayConfig.checkoutData.quantity;
        
        updateQuantityDisplay();
        document.getElementById('quantityModal').style.display = 'block';
    }

    function changeQuantity(change) {
        const newQuantity = razorpayConfig.checkoutData.quantity + change;
        if (newQuantity >= 1 && newQuantity <= 10) {
            razorpayConfig.checkoutData.quantity = newQuantity;
            document.getElementById('quantityInput').value = razorpayConfig.checkoutData.quantity;
            updateQuantityDisplay();
        }
    }

    function updateQuantity(quantity) {
        if (quantity >= 1 && quantity <= 10) {
            razorpayConfig.checkoutData.quantity = quantity;
            updateQuantityDisplay();
        }
    }

    function updateQuantityDisplay() {
        const unitPrice = razorpayConfig.checkoutData.product.price;
        const total = unitPrice * razorpayConfig.checkoutData.quantity;
        
        document.getElementById('unitPrice').textContent = `₹${unitPrice.toFixed(2)}`;
        document.getElementById('selectedQuantity').textContent = razorpayConfig.checkoutData.quantity;
        document.getElementById('finalTotal').textContent = `₹${total.toFixed(2)}`;
        
        razorpayConfig.checkoutData.total = total;
    }

    // ✅ STEP 3: ONLY NOW initiate payment (Razorpay opens here)
    async function initiatePayment() {
        if (!razorpayConfig.keyId) {
            showNotification('Payment service not available', 'error');
            return;
        }
        
        console.log('💳 STEP 3: FINALLY initiating Razorpay payment...');
        console.log('Payment details:', {
            product: razorpayConfig.checkoutData.product.name,
            quantity: razorpayConfig.checkoutData.quantity,
            total: razorpayConfig.checkoutData.total,
            total_in_paise: razorpayConfig.checkoutData.total * 100
        });
        
        try {
            const token = localStorage.getItem('token');
            
            // ✅ CRITICAL: Send EXACT amount to server (no extra charges)
            const exactAmount = razorpayConfig.checkoutData.total;
            
            console.log(`💰 Sending exact amount to server: ₹${exactAmount}`);
            
            // Create order on server with EXACT amount
            const orderResponse = await fetch('/api/orders/razorpay/create-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    amount: exactAmount,
                    currency: 'INR'
                })
            });
            
            const orderData = await orderResponse.json();
            
            if (!orderData.id) {
                throw new Error('Failed to create payment order');
            }
            
            console.log('✅ Payment order created:', orderData);
            console.log(`💰 Order amount: ${orderData.amount} paise (₹${(orderData.amount / 100).toFixed(2)})`);
            
            // ✅ Verify amount consistency
            const expectedPaise = Math.round(exactAmount * 100);
            if (orderData.amount !== expectedPaise) {
                console.warn(`⚠️ Amount mismatch: Expected ${expectedPaise} paise, got ${orderData.amount} paise`);
            }
            
            // Hide quantity modal
            document.getElementById('quantityModal').style.display = 'none';
            
            // ✅ NOW open Razorpay payment window with EXACT amount
            const options = {
                key: razorpayConfig.keyId,
                amount: orderData.amount, // ✅ Use server-provided amount (already in paise)
                currency: orderData.currency,
                name: 'FreshFruits',
                description: `${razorpayConfig.checkoutData.product.name} x ${razorpayConfig.checkoutData.quantity}`,
                order_id: orderData.id,
                handler: function(response) {
                    handlePaymentSuccess(response);
                },
                prefill: {
                    name: razorpayConfig.checkoutData.selectedAddress.recipientName,
                    contact: razorpayConfig.checkoutData.selectedAddress.mobile
                },
                theme: { color: '#22c55e' },
                modal: {
                    ondismiss: function() {
                        console.log('Payment cancelled by user');
                        showNotification('Payment cancelled', 'info');
                        document.getElementById('quantityModal').style.display = 'block';
                    }
                }
            };
            
            console.log('🚀 Opening Razorpay payment window with options:', {
                amount: options.amount,
                amount_in_rupees: (options.amount / 100).toFixed(2),
                currency: options.currency,
                order_id: options.order_id
            });
            
            const rzp = new Razorpay(options);
            rzp.open();
            
        } catch (error) {
            console.error('❌ Payment initiation failed:', error);
            showNotification('Failed to initiate payment: ' + error.message, 'error');
            document.getElementById('quantityModal').style.display = 'block';
        }
    }

    // Handle successful payment
    async function handlePaymentSuccess(response) {
        try {
            console.log('✅ Payment successful! Verifying...');
            
            const token = localStorage.getItem('token');
            
            // Verify payment on server
            const verifyResponse = await fetch('/api/orders/razorpay/verify-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
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
                })
            });
            
            const result = await verifyResponse.json();
            
            if (result.success) {
                showNotification('🎉 Order placed successfully!', 'success');
                console.log('✅ Order created:', result.order);
                
                // Reset checkout data
                razorpayConfig.checkoutData = {
                    product: null,
                    selectedAddress: null,
                    quantity: 1,
                    total: 0
                };
                
                // Redirect to orders page
                setTimeout(() => {
                    window.location.href = '/orders.html';
                }, 2000);
                
            } else {
                throw new Error(result.message || 'Payment verification failed');
            }
            
        } catch (error) {
            console.error('❌ Payment verification failed:', error);
            showNotification('Payment verification failed. Please contact support.', 'error');
        }
    }

    // Navigation functions
    function goBackToAddress() {
        console.log('⬅️ Going back to address selection...');
        document.getElementById('quantityModal').style.display = 'none';
        document.getElementById('addressModal').style.display = 'block';
    }

    function closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
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
        }, 4000);
    }

    // ✅ Export functions to global scope safely
    window.startCheckoutFlow = window.startCheckoutFlow || startCheckoutFlow;
    window.selectAddress = window.selectAddress || selectAddress;
    window.editAddress = window.editAddress || editAddress;
    window.deleteAddress = window.deleteAddress || deleteAddress;
    window.showAddressForm = window.showAddressForm || showAddressForm;
    window.proceedToQuantity = window.proceedToQuantity || proceedToQuantity;
    window.goBackToAddress = window.goBackToAddress || goBackToAddress;
    window.closeModal = window.closeModal || closeModal;
    window.updateQuantity = window.updateQuantity || updateQuantity;
    window.saveAddress = window.saveAddress || saveAddress;

    console.log('✅ Enhanced checkout flow loaded successfully');
    console.log('🔄 Flow: Buy Now → Address Selection → Quantity Selection → Razorpay Payment');
    console.log('✅ Global functions exported:', Object.keys(window).filter(key => 
        ['startCheckoutFlow', 'selectAddress', 'editAddress', 'deleteAddress', 
         'showAddressForm', 'proceedToQuantity', 'goBackToAddress', 
         'closeModal', 'updateQuantity', 'saveAddress'].includes(key)
    ));

})();
