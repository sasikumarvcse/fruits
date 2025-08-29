async function handlePayment(amount) {
  try {
    // First create Razorpay order
    const response = await fetch('/api/create-razorpay-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount })
    });

    const data = await response.json();
    if (!data.success) throw new Error(data.message);

    // Initialize Razorpay
    const options = {
      key: data.key,
      amount: data.order.amount,
      currency: data.order.currency,
      name: 'AroboWl Store',
      description: 'Product Purchase',
      order_id: data.order.id,
      handler: function(response) {
        // Handle successful payment
        console.log('Payment successful:', response);
        window.location.href = '/orders'; // Redirect to orders page after success
      },
      prefill: {
        name: localStorage.getItem('userName') || '',
        email: localStorage.getItem('userEmail') || '',
        contact: localStorage.getItem('userPhone') || ''
      },
      theme: {
        color: '#3399cc'
      }
    };

    const rzp = new Razorpay(options);
    rzp.open();

  } catch (error) {
    console.error('Payment error:', error);
    alert('Payment initialization failed. Please try again.');
  }
}

// Export the function if using modules
export { handlePayment };