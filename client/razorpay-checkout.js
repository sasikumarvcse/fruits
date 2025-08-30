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
            deliveryCharge: 0 // No delivery charge for now
        },
        userAddresses: []
    };

    // Initialize checkout functionality
    document.addEventListener('DOMContentLoaded', function() {
        initializeEnhancedCheckout();
    });

    async function initializeEnhancedCheckout() {
        await loadRazorpayKey();
        await loadUserAddresses(); // ✅ Load addresses on initialization
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
                console.log('✅ Razorpay key loaded:', data.key);
            } else {
                console.error('❌ Failed to load Razorpay key:', data.message);
                // Fallback to test key for development
                razorpayConfig.keyId = 'rzp_test_gBP9geXusrKWUg';
                console.log('⚠️ Using fallback test key');
            }
        } catch (error) {
            console.error('❌ Failed to load Razorpay key:', error);
            // Fallback to test key for development
            razorpayConfig.keyId = 'rzp_test_gBP9geXusrKWUg';
            console.log('⚠️ Using fallback test key due to error');
        }
    }

    // ✅ FIXED: Enhanced load user addresses for checkout
    async function loadUserAddresses() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.log('❌ No token found, cannot load addresses');
                razorpayConfig.userAddresses = [];
                return;
            }

            const response = await fetch('/api/user/addresses', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                razorpayConfig.userAddresses = await response.json();
                console.log('✅ User addresses loaded:', razorpayConfig.userAddresses.length);
            } else {
                console.error('❌ Failed to load addresses:', response.status);
                razorpayConfig.userAddresses = [];
            }
        } catch (error) {
            console.error('❌ Error loading addresses:', error);
            razorpayConfig.userAddresses = [];
        }
    }

    // ✅ FIXED: Enhanced address selection with persistence
    function selectAddress(addressId) {
        console.log('📍 Selecting address:', addressId);
        const selectedAddress = razorpayConfig.userAddresses.find(addr => addr._id === addressId);
        
        if (!selectedAddress) {
            console.error('❌ Address not found:', addressId);
            showNotification('Address not found', 'error');
            return;
        }
        
        // Store selected address globally
        razorpayConfig.checkoutData.selectedAddress = selectedAddress;
        
        // Save to session storage for persistence
        sessionStorage.setItem('selectedCheckoutAddress', JSON.stringify(selectedAddress));
        
        // Update UI to show selected address
        document.querySelectorAll('.address-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        const selectedItem = document.querySelector(`[data-address-id="${addressId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('selected');
            
            // Add visual feedback
            selectedItem.style.transform = 'scale(1.02)';
            setTimeout(() => {
                selectedItem.style.transform = 'scale(1)';
            }, 200);
        }
        
        showNotification('✅ Address selected successfully', 'success');
        
        // Enable next button if available
        const addressNextBtn = document.getElementById('addressNextBtn');
        if (addressNextBtn) {
            addressNextBtn.disabled = false;
            addressNextBtn.innerHTML = '<i class="fas fa-arrow-right"></i> Continue to Quantity';
        }
        
        console.log('✅ Address selected and stored:', selectedAddress);
    }

    // ✅ FIXED: Edit address function
    function editAddress(addressId) {
        // Use the global edit function from user-dashboard.html
        if (window.openAddressEditForm) {
            window.openAddressEditForm(addressId);
        } else {
            showNotification('Edit functionality not available', 'error');
        }
    }

    // ✅ FIXED: Delete address function
    function deleteAddress(addressId) {
        // Use the global delete function from user-dashboard.html
        if (window.confirmDeleteAddress) {
            window.confirmDeleteAddress(addressId);
        } else {
            showNotification('Delete functionality not available', 'error');
        }
    }

    // ✅ FIXED: Show address form
    function showAddressForm() {
        const modal = document.getElementById('addressFormModal');
        if (modal) {
            modal.style.display = 'block';
            // Reset form for new address
            const form = document.getElementById('addressForm');
            if (form) {
                safeFormReset(form);
                document.getElementById('addressId').value = '';
                document.getElementById('addressFormTitle').textContent = 'Add New Address';
            }
        } else {
            console.error('❌ Address form modal not found!');
            showNotification('Address form not available', 'error');
        }
    }

    // ✅ FIXED: Enhanced checkout flow with persistence
    function startCheckoutFlow(productId, productName, productPrice, productImage) {
        console.log('🚀 Starting enhanced checkout flow for:', {productId, productName, productPrice, productImage});
        
        // Initialize checkout data
        razorpayConfig.checkoutData = {
            product: {
                _id: productId,
                name: productName,
                price: parseFloat(productPrice),
                image: productImage || '/uploads/default-item.jpg'
            },
            selectedAddress: null,
            quantity: 1,
            total: parseFloat(productPrice),
            deliveryCharge: 0
        };
        
        // Try to restore previously selected address
        const savedAddress = sessionStorage.getItem('selectedCheckoutAddress');
        if (savedAddress) {
            try {
                razorpayConfig.checkoutData.selectedAddress = JSON.parse(savedAddress);
                console.log('🔄 Restored previous address selection:', razorpayConfig.checkoutData.selectedAddress);
            } catch (error) {
                console.warn('⚠️ Failed to restore address:', error);
                sessionStorage.removeItem('selectedCheckoutAddress');
            }
        }
        
        // Load user addresses and show modal
        loadUserAddresses().then(() => {
            showAddressModal();
        });
    }

    // ✅ FIXED: Show address modal
    function showAddressModal() {
        console.log('📍 Showing address selection modal...');
        displayAddresses();
        const modal = document.getElementById('addressModal');
        if (modal) {
            modal.style.display = 'block';
        } else {
            console.error('❌ Address modal not found!');
            showNotification('Address selection not available', 'error');
        }
    }

    // ✅ FIXED: Enhanced display addresses with selection restoration
    function displayAddresses() {
        const addressList = document.getElementById('addressList');
        if (!addressList) {
            console.error('❌ Address list element not found!');
            return;
        }
        
        if (razorpayConfig.userAddresses.length === 0) {
            addressList.innerHTML = `
                <div class="no-addresses">
                    <i class="fas fa-map-marker-alt" style="font-size: 2rem; color: #9ca3af; margin-bottom: 12px;"></i>
                    <p>No saved addresses found</p>
                    <p>Please add a delivery address to continue with your order</p>
                </div>
            `;
            const addressNextBtn = document.getElementById('addressNextBtn');
            if (addressNextBtn) addressNextBtn.disabled = true;
            return;
        }
        
        // Check if we have a previously selected address
        const selectedAddressId = razorpayConfig.checkoutData.selectedAddress?._id;
        
        addressList.innerHTML = razorpayConfig.userAddresses.map(address => {
            const isSelected = selectedAddressId === address._id;
            const isDefault = address.isDefault;
            
            return `
                <div class="address-item ${isDefault ? 'default' : ''} ${isSelected ? 'selected' : ''}" 
                     data-address-id="${address._id}" 
                     onclick="selectAddress('${address._id}')">
                    <div class="address-header">
                        <h4>
                            <i class="fas fa-user"></i> 
                            ${address.recipientName || address.name || 'Recipient'}
                        </h4>
                        <div>
                            ${isDefault ? '<span class="default-badge"><i class="fas fa-star"></i> Default</span>' : ''}
                            ${isSelected ? '<span class="default-badge" style="background: #10b981;"><i class="fas fa-check"></i> Selected</span>' : ''}
                        </div>
                    </div>
                    <div class="address-details">
                        <p><i class="fas fa-phone"></i> ${address.mobile || 'N/A'}</p>
                        <p><i class="fas fa-map-marker-alt"></i> ${address.address || 'N/A'}</p>
                        <p><i class="fas fa-map-pin"></i> ${address.pincode || 'N/A'}, ${address.city || 'N/A'}, ${address.state || 'N/A'}</p>
                        <p><i class="fas fa-home"></i> ${address.addressType || 'home'} address</p>
                    </div>
                    <div class="address-actions" onclick="event.stopPropagation()">
                        <button onclick="editAddress('${address._id}')" class="edit-btn" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteAddress('${address._id}')" class="delete-btn" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        // Enable/disable continue button based on selection
        const addressNextBtn = document.getElementById('addressNextBtn');
        if (addressNextBtn) {
            if (selectedAddressId) {
                addressNextBtn.disabled = false;
                addressNextBtn.innerHTML = '<i class="fas fa-arrow-right"></i> Continue to Quantity';
            } else {
                addressNextBtn.disabled = true;
                addressNextBtn.innerHTML = '<i class="fas fa-map-marker-alt"></i> Select Address First';
            }
        }
        
        console.log(`📍 Displayed ${razorpayConfig.userAddresses.length} addresses, selected: ${selectedAddressId || 'none'}`);
    }

    // ✅ FIXED: Save address function for checkout flow
    async function saveAddress() {
        // Use the global save function from user-dashboard.html
        if (window.saveAddress) {
            window.saveAddress();
        } else {
            showNotification('Save functionality not available', 'error');
        }
    }

    // ✅ FIXED: Validate address form elements
    function validateAddressFormElements() {
        const requiredElements = [
            'addressForm',
            'recipientName',
            'mobile',
            'address',
            'pincode',
            'city',
            'state',
            'addressType'
        ];
        
        const missingElements = requiredElements.filter(id => !document.getElementById(id));
        
        if (missingElements.length > 0) {
            console.warn('⚠️ Missing address form elements:', missingElements);
            return false;
        }
        
        return true;
    }

    // Setup event listeners for checkout modals
    function setupCheckoutEventListeners() {
        console.log('🔄 Setting up checkout event listeners...');

        // Validate address form elements before setting up listeners
        if (!validateAddressFormElements()) {
            console.warn('⚠️ Address form elements not found, some features may not work');
        }

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

    // ✅ UTILITY: Safely reset form elements
    function safeFormReset(formElement) {
        if (formElement && typeof formElement.reset === 'function') {
            formElement.reset();
        } else {
            console.warn('⚠️ Form element not found or reset method not available');
        }
    }

    // ✅ UTILITY: Validate required address form elements
    function validateAddressFormElements() {
        const requiredElements = [
            'addressFormModal',
            'addressFormTitle', 
            'addressForm',
            'addressId',
            'recipientName',
            'mobile',
            'address',
            'pincode',
            'city',
            'state',
            'addressType',
            'isDefault'
        ];
        
        const missingElements = [];
        requiredElements.forEach(id => {
            if (!document.getElementById(id)) {
                missingElements.push(id);
            }
        });
        
        if (missingElements.length > 0) {
            console.error('❌ Missing required address form elements:', missingElements);
            return false;
        }
        
        return true;
    }

    // ✅ UTILITY: Fallback address form handler
    function handleAddressFormFallback() {
        console.log('🔄 Attempting to create fallback address form...');
        
        // Create a simple prompt-based address input as fallback
        const recipientName = prompt('Enter recipient name:');
        if (!recipientName) return;
        
        const mobile = prompt('Enter mobile number:');
        if (!mobile) return;
        
        const address = prompt('Enter address:');
        if (!address) return;
        
        const pincode = prompt('Enter pincode:');
        if (!pincode) return;
        
        const city = prompt('Enter city:');
        if (!city) return;
        
        const state = prompt('Enter state:');
        if (!state) return;
        
        // Create address data object
        const addressData = {
            recipientName,
            mobile,
            address,
            pincode,
            city,
            state,
            addressType: 'home',
            isDefault: false
        };
        
        // Save address using the existing save function
        saveAddressData(addressData);
    }

    // ✅ UTILITY: Save address data directly
    async function saveAddressData(addressData) {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                showNotification('Please login to save addresses', 'error');
                return;
            }

            const response = await fetch('/api/user/addresses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(addressData)
            });

            if (response.ok) {
                showNotification('Address added successfully!', 'success');
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

    // ✅ FIXED: Enhanced address loading with better error handling
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
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
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
                    <i class="fas fa-map-marker-alt" style="font-size: 2rem; color: #9ca3af; margin-bottom: 12px;"></i>
                    <p>No saved addresses found</p>
                    <p>Please add a delivery address to continue with your order</p>
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
                    <h4>
                        <i class="fas fa-user"></i> 
                        ${address.recipientName || address.name || 'Recipient'}
                    </h4>
                    ${address.isDefault ? '<span class="default-badge"><i class="fas fa-star"></i> Default</span>' : ''}
                </div>
                <div class="address-details">
                    <p><i class="fas fa-phone"></i> ${address.mobile || 'N/A'}</p>
                    <p><i class="fas fa-map-marker-alt"></i> ${address.address || 'N/A'}</p>
                    <p><i class="fas fa-map-pin"></i> ${address.pincode || 'N/A'}, ${address.city || 'N/A'}, ${address.state || 'N/A'}</p>
                    <p><i class="fas fa-home"></i> ${address.addressType || 'home'} address</p>
                </div>
                <div class="address-actions" onclick="event.stopPropagation()">
                    <button class="edit-btn" onclick="editAddress('${address._id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="delete-btn" onclick="deleteAddress('${address._id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
        
        // Enable continue button if addresses exist
        const addressNextBtn = document.getElementById('addressNextBtn');
        if (addressNextBtn) {
            addressNextBtn.disabled = false;
        }
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
            
            // Add a subtle animation
            selectedItem.style.transform = 'scale(1.02)';
            setTimeout(() => {
                selectedItem.style.transform = 'scale(1)';
            }, 200);
        }
        
        // Store selected address
        razorpayConfig.checkoutData.selectedAddress = razorpayConfig.userAddresses.find(addr => addr._id === addressId);
        
        // Enable continue button
        const addressNextBtn = document.getElementById('addressNextBtn');
        if (addressNextBtn) {
            addressNextBtn.disabled = false;
            addressNextBtn.innerHTML = '<i class="fas fa-arrow-right"></i> Continue to Quantity';
        }
        
        // Show success notification
        const selectedAddress = razorpayConfig.checkoutData.selectedAddress;
        const recipientName = selectedAddress.recipientName || selectedAddress.name || 'Address';
        showNotification(`✅ ${recipientName} selected for delivery`, 'success');
    }

    // Address management functions
    function showAddressForm(addressId = null) {
        // Validate all required elements exist
        if (!validateAddressFormElements()) {
            console.warn('⚠️ Address form elements not found, using fallback');
            if (addressId) {
                showNotification('Edit mode not available in fallback', 'warning');
                return;
            }
            handleAddressFormFallback();
            return;
        }
        
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
            safeFormReset(form);
            document.getElementById('addressId').value = '';
        }
        
        modal.style.display = 'block';
    }

    async function saveAddress() {
        const addressForm = document.getElementById('addressForm');
        if (!addressForm) {
            console.error('❌ Address form not found');
            showNotification('Address form not available', 'error');
            return;
        }
        
        // Show loading state
        const saveBtn = document.querySelector('button[onclick="saveAddress()"]');
        if (saveBtn) {
            saveBtn.classList.add('loading');
            saveBtn.disabled = true;
        }
        
        const formData = new FormData(addressForm);
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

        // Basic validation
        if (!addressData.recipientName || !addressData.mobile || !addressData.address || 
            !addressData.pincode || !addressData.city || !addressData.state) {
            showNotification('Please fill in all required fields', 'error');
            
            // Reset button state
            if (saveBtn) {
                saveBtn.classList.remove('loading');
                saveBtn.disabled = false;
            }
            return;
        }

        // Mobile number validation
        if (!/^[0-9]{10}$/.test(addressData.mobile)) {
            showNotification('Please enter a valid 10-digit mobile number', 'error');
            
            // Reset button state
            if (saveBtn) {
                saveBtn.classList.remove('loading');
                saveBtn.disabled = false;
            }
            return;
        }

        // Pincode validation
        if (!/^[0-9]{6}$/.test(addressData.pincode)) {
            showNotification('Please enter a valid 6-digit PIN code', 'error');
            
            // Reset button state
            if (saveBtn) {
                saveBtn.classList.remove('loading');
                saveBtn.disabled = false;
            }
            return;
        }

        const addressId = formData.get('addressId');
        const isEdit = addressId && addressId.trim() !== '';

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                showNotification('Please login to save addresses', 'error');
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 2000);
                return;
            }
            
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
                const successMessage = isEdit ? 'Address updated successfully!' : 'Address added successfully!';
                showNotification(successMessage, 'success');
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
            showNotification('Failed to save address. Please try again.', 'error');
        } finally {
            // Reset button state
            if (saveBtn) {
                saveBtn.classList.remove('loading');
                saveBtn.disabled = false;
            }
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
        
        if (!modal) {
            console.error('❌ Quantity modal not found!');
            showNotification('Quantity selection not available', 'error');
            return;
        }
        
        console.log('🔢 Showing quantity modal for:', product);
        
        // Update product info
        const productImage = document.getElementById('quantityProductImage');
        const productName = document.getElementById('quantityProductName');
        const productPrice = document.getElementById('quantityProductPrice');
        
        if (productImage) productImage.src = product.image || '/uploads/default-item.jpg';
        if (productName) productName.textContent = product.name || 'Product';
        if (productPrice) productPrice.textContent = `₹${product.price?.toFixed(2) || '0.00'}`;
        
        // Reset quantity
        razorpayConfig.checkoutData.quantity = 1;
        const quantityInput = document.getElementById('quantityInput');
        if (quantityInput) quantityInput.value = '1';
        
        // Update price breakdown
        updatePriceBreakdown();
        
        // Show the modal
        modal.style.display = 'block';
        
        console.log('✅ Quantity modal displayed');
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
        const total = basePrice; // No delivery charge
        
        // Update the HTML elements with correct IDs
        const productPriceDisplay = document.getElementById('productPriceDisplay');
        const quantityDisplay = document.getElementById('quantityDisplay');
        const totalPriceDisplay = document.getElementById('totalPriceDisplay');
        
        if (productPriceDisplay) productPriceDisplay.textContent = `₹${product.price.toFixed(2)}`;
        if (quantityDisplay) quantityDisplay.textContent = quantity;
        if (totalPriceDisplay) totalPriceDisplay.textContent = `₹${total.toFixed(2)}`;
        
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

        // Show loading state
        const proceedBtn = document.getElementById('proceedToPayment');
        if (proceedBtn) {
            proceedBtn.classList.add('loading');
            proceedBtn.disabled = true;
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
            if (!token) {
                showNotification('Please login to continue', 'error');
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 2000);
                return;
            }

            const orderData = {
                productId: razorpayConfig.checkoutData.product._id,
                quantity: razorpayConfig.checkoutData.quantity,
                amount: razorpayConfig.checkoutData.total,
                deliveryAddress: razorpayConfig.checkoutData.selectedAddress
            };

            console.log('📦 Creating order with data:', orderData);

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
                console.error('❌ Order creation failed:', error);
                showNotification(error.message || 'Failed to create payment order', 'error');
                
                // Reset button state
                const proceedBtn = document.getElementById('proceedToPayment');
                if (proceedBtn) {
                    proceedBtn.classList.remove('loading');
                    proceedBtn.disabled = false;
                }
            }
        } catch (error) {
            console.error('❌ Error creating Razorpay order:', error);
            showNotification('Failed to create payment order. Please try again.', 'error');
            
            // Reset button state
            const proceedBtn = document.getElementById('proceedToPayment');
            if (proceedBtn) {
                proceedBtn.classList.remove('loading');
                proceedBtn.disabled = false;
            }
        }
    }

    function openRazorpayPayment(order) {
        if (!razorpayConfig.keyId) {
            showNotification('Payment gateway not configured. Please contact support.', 'error');
            return;
        }

        console.log('🔑 Opening Razorpay with key:', razorpayConfig.keyId);
        console.log('💰 Amount:', order.amount);

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
                email: localStorage.getItem('userEmail') || ''
            },
            notes: {
                address: razorpayConfig.checkoutData.selectedAddress.address,
                delivery_charge: '₹0',
                product_id: razorpayConfig.checkoutData.product._id,
                quantity: razorpayConfig.checkoutData.quantity.toString()
            },
            theme: {
                color: '#22c55e'
            },
            modal: {
                ondismiss: function() {
                    console.log('❌ Payment modal dismissed');
                    showNotification('Payment cancelled. You can try again.', 'warning');
                    
                    // Reset button state
                    const proceedBtn = document.getElementById('proceedToPayment');
                    if (proceedBtn) {
                        proceedBtn.classList.remove('loading');
                        proceedBtn.disabled = false;
                    }
                }
            }
        };

        // Enhanced Razorpay opening with browser extension conflict handling
        const openRazorpayWithFallback = async () => {
            try {
                // Ensure Razorpay is loaded
                if (typeof Razorpay === 'undefined') {
                    await new Promise((resolve, reject) => {
                        const script = document.createElement('script');
                        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                        script.onload = resolve;
                        script.onerror = reject;
                        document.head.appendChild(script);
                    });
                }

                console.log('🚀 Initializing Razorpay with options:', options);
                
                // Use global handler if available
                if (window.handleRazorpayPayment) {
                    await window.handleRazorpayPayment(options);
                } else {
                    const rzp = new Razorpay(options);
                    rzp.open();
                }
                
            } catch (error) {
                console.error('❌ Error opening Razorpay:', error);
                
                // Fallback: Try to redirect to Razorpay
                if (options.order_id) {
                    showNotification('Opening payment gateway in new window...', 'info');
                    const fallbackUrl = `https://checkout.razorpay.com/v1/checkout.html?key=${options.key}&amount=${options.amount}&currency=${options.currency}&name=${encodeURIComponent(options.name)}&description=${encodeURIComponent(options.description)}&order_id=${options.order_id}`;
                    window.open(fallbackUrl, '_blank', 'width=500,height=600');
                } else {
                    showNotification('Failed to open payment gateway. Please try again.', 'error');
                }
                
                // Reset button state
                const proceedBtn = document.getElementById('proceedToPayment');
                if (proceedBtn) {
                    proceedBtn.classList.remove('loading');
                    proceedBtn.disabled = false;
                }
            }
        };

        // Execute with retry mechanism
        openRazorpayWithFallback();
    }

    // ✅ FIXED: Enhanced payment verification with better error handling
    async function verifyPayment(paymentResponse, order) {
        try {
            showNotification('Verifying payment...', 'info');
            
            const token = localStorage.getItem('token');
            if (!token) {
                showNotification('Authentication required. Please login again.', 'error');
                setTimeout(() => window.location.href = '/login.html', 2000);
                return;
            }
            
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
                    city: razorpayConfig.checkoutData.selectedAddress.city,
                    state: razorpayConfig.checkoutData.selectedAddress.state,
                    addressType: razorpayConfig.checkoutData.selectedAddress.addressType || 'home',
                    items: [{
                        item: razorpayConfig.checkoutData.product._id,
                        quantity: razorpayConfig.checkoutData.quantity
                    }]
                }
            };

            console.log('📦 Verifying payment with data:', verifyData);

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
                
                // Clear session storage
                sessionStorage.removeItem('selectedCheckoutAddress');
                
                showNotification('🎉 Payment successful! Order placed successfully.', 'success');
                
                // Reset checkout data
                razorpayConfig.checkoutData = {
                    product: null,
                    selectedAddress: null,
                    quantity: 1,
                    total: 0,
                    deliveryCharge: 0
                };
                
                // Close all modals
                closeAddressModal();
                closeQuantityModal();
                closeAddressFormModal();
                
                // Show success message with order details
                const orderId = result.order?._id || result._id;
                if (orderId) {
                    showNotification(`Order #${orderId.slice(-6)} created successfully!`, 'success');
                }
                
                // Redirect to orders page or dashboard
                setTimeout(() => {
                    const orderPage = '/orders.html';
                    if (window.location.pathname.includes('orders.html')) {
                        window.location.reload(); // Refresh if already on orders page
                    } else {
                        window.location.href = orderPage;
                    }
                }, 3000);
            } else {
                const error = await response.json();
                console.error('❌ Payment verification failed:', error);
                showNotification(error.message || 'Payment verification failed. Please contact support.', 'error');
            }
        } catch (error) {
            console.error('❌ Error verifying payment:', error);
            showNotification('Payment verification failed. Please check your connection and contact support if the issue persists.', 'error');
        }
    }

    // ✅ FIXED: Enhanced navigation functions for checkout flow
    function goBackToAddress() {
        const quantityModal = document.getElementById('quantityModal');
        if (quantityModal) quantityModal.style.display = 'none';
        
        showAddressModal();
    }

    // ✅ FIXED: Show quantity modal
    function showQuantityModal() {
        const quantityModal = document.getElementById('quantityModal');
        if (quantityModal) {
            quantityModal.style.display = 'block';
        } else {
            console.error('❌ Quantity modal not found!');
        }
    }

    // ✅ FIXED: Proceed to quantity selection
    function proceedToQuantity() {
        if (!razorpayConfig.checkoutData.selectedAddress) {
            showNotification('Please select a delivery address', 'error');
            return;
        }
        
        closeAddressModal();
        showQuantityModal();
    }

    // ✅ FIXED: Proceed to payment
    function proceedToPayment() {
        if (!razorpayConfig.checkoutData.selectedAddress) {
            showNotification('Please select a delivery address', 'error');
            return;
        }
        
        if (!razorpayConfig.checkoutData.quantity || razorpayConfig.checkoutData.quantity < 1) {
            showNotification('Please select a valid quantity', 'error');
            return;
        }
        
        closeQuantityModal();
        initiatePayment();
    }

    // ✅ FIXED: Initiate payment with Razorpay
    async function initiatePayment() {
        try {
            showNotification('Initializing payment...', 'info');
            
            const token = localStorage.getItem('token');
            if (!token) {
                showNotification('Please log in to continue', 'error');
                return;
            }

            // Calculate total amount
            const total = razorpayConfig.checkoutData.product.price * razorpayConfig.checkoutData.quantity;
            razorpayConfig.checkoutData.total = total;

            // Create order on backend
            const orderData = {
                productId: razorpayConfig.checkoutData.product._id,
                quantity: razorpayConfig.checkoutData.quantity,
                total: total,
                recipientName: razorpayConfig.checkoutData.selectedAddress.recipientName || razorpayConfig.checkoutData.selectedAddress.name,
                mobile: razorpayConfig.checkoutData.selectedAddress.mobile,
                address: razorpayConfig.checkoutData.selectedAddress.address,
                pincode: razorpayConfig.checkoutData.selectedAddress.pincode,
                city: razorpayConfig.checkoutData.selectedAddress.city,
                state: razorpayConfig.checkoutData.selectedAddress.state,
                addressType: razorpayConfig.checkoutData.selectedAddress.addressType || 'home'
            };

            const createOrderRes = await fetch('/api/orders/razorpay/create-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(orderData)
            });

            if (!createOrderRes.ok) {
                throw new Error('Failed to create order');
            }

            const razorpayOrder = await createOrderRes.json();
            console.log('✅ Razorpay order created:', razorpayOrder);

            // Initialize Razorpay payment
            const options = {
                key: razorpayConfig.keyId || 'rzp_live_gBP9geXusrKWUg',
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                name: 'Your Store Name',
                description: `Order for ${razorpayConfig.checkoutData.product.name}`,
                order_id: razorpayOrder.id,
                handler: async function(response) {
                    await verifyPayment(response, razorpayOrder);
                },
                prefill: {
                    name: razorpayConfig.checkoutData.selectedAddress.recipientName || razorpayConfig.checkoutData.selectedAddress.name,
                    contact: razorpayConfig.checkoutData.selectedAddress.mobile,
                    email: localStorage.getItem('userEmail') || ''
                },
                notes: {
                    address: razorpayConfig.checkoutData.selectedAddress.address
                },
                theme: {
                    color: '#3B82F6'
                }
            };

            const rzp = new Razorpay(options);
            rzp.open();

        } catch (error) {
            console.error('❌ Error initiating payment:', error);
            showNotification('Failed to initiate payment. Please try again.', 'error');
        }
    }

    // Modal close functions
    function closeAddressModal() {
        const modal = document.getElementById('addressModal');
        if (modal) modal.style.display = 'none';
    }

    function closeAddressFormModal() {
        const modal = document.getElementById('addressFormModal');
        if (modal) {
            modal.style.display = 'none';
            // Safely reset the form
            const form = document.getElementById('addressForm');
            safeFormReset(form);
            // Reset title
            const title = document.getElementById('addressFormTitle');
            if (title) {
                title.textContent = 'Add New Address';
            }
            // Clear address ID
            const addressIdField = document.getElementById('addressId');
            if (addressIdField) {
                addressIdField.value = '';
            }
        }
    }

    // ✅ FIXED: Safe form reset function
    function safeFormReset(form) {
        if (form && typeof form.reset === 'function') {
            try {
                form.reset();
            } catch (error) {
                console.warn('⚠️ Form reset failed, manually clearing fields');
                // Manual reset as fallback
                const inputs = form.querySelectorAll('input, textarea, select');
                inputs.forEach(input => {
                    if (input.type === 'checkbox' || input.type === 'radio') {
                        input.checked = false;
                    } else {
                        input.value = '';
                    }
                });
            }
        }
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

    // ✅ FIXED: Enhanced global function exports for checkout integration
    window.startCheckoutFlow = startCheckoutFlow;
    window.selectAddress = selectAddress;
    window.editAddress = editAddress;
    window.deleteAddress = deleteAddress;
    window.showAddressForm = showAddressForm;
    window.saveAddress = saveAddress;
    window.closeAddressModal = closeAddressModal;
    window.closeAddressFormModal = closeAddressFormModal;
    window.closeQuantityModal = closeQuantityModal;
    window.showNotification = showNotification;
    window.showQuantityModal = showQuantityModal;
    window.proceedToQuantity = proceedToQuantity;
    window.proceedToPayment = proceedToPayment;
    window.loadUserAddresses = loadUserAddresses;
    window.displayAddresses = displayAddresses;
    window.initializeEnhancedCheckout = initializeEnhancedCheckout;

    console.log('✅ Enhanced Razorpay checkout system loaded successfully');
    
    // ✅ GLOBAL ERROR HANDLER: Catch any remaining form-related errors
    window.addEventListener('error', function(event) {
        if (event.error && event.error.message && event.error.message.includes('reset is not a function')) {
            console.warn('⚠️ Form reset error caught and handled');
            event.preventDefault();
            showNotification('Address form issue detected, please refresh the page', 'warning');
        }
    });
})();
