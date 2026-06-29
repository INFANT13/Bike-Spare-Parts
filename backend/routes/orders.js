const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Razorpay = require('razorpay');
const { Order, OrderItem, Product, Cart, CartItem, User } = require('../models');
const { protect, adminOnly } = require('../middleware/auth');
const sendEmail = require('../utils/email');

let razorpay = null;

if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
  console.log('Razorpay payment gateway initialized.');
} else {
  console.log('Razorpay keys not configured. Checkout will operate in DEMO simulation mode.');
}

// @route   POST /api/orders/checkout
// @desc    Initiate checkout, verify stock, create order, generate payment order
// @access  Private
router.post('/checkout', protect, async (req, res) => {
  const { shippingAddress, phone } = req.body;

  if (!shippingAddress || !phone) {
    return res.status(400).json({ success: false, message: 'Please provide shipping address and phone number' });
  }

  try {
    // 1. Get user's cart and items
    const cart = await Cart.findOne({
      where: { userId: req.user.id }
    });

    if (!cart) {
      return res.status(400).json({ success: false, message: 'Shopping cart not found' });
    }

    const cartItems = await CartItem.findAll({
      where: { cartId: cart.id },
      include: [Product]
    });

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Your cart is empty' });
    }

    // 2. Verify stock levels & calculate total
    let totalAmount = 0;
    const itemsToCreate = [];

    for (const item of cartItems) {
      if (!item.Product) {
        return res.status(400).json({ success: false, message: 'One of the items in your cart is no longer available' });
      }

      if (item.Product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.Product.name}. Only ${item.Product.stock} left in stock.`
        });
      }

      totalAmount += parseFloat(item.Product.price) * item.quantity;
      itemsToCreate.push({
        productId: item.productId,
        quantity: item.quantity,
        price: item.Product.price
      });
    }

    // 3. Create the database Order with 'pending' status
    const order = await Order.create({
      userId: req.user.id,
      totalAmount,
      status: 'pending',
      paymentStatus: 'pending',
      shippingAddress,
      phone
    });

    // Create OrderItems
    for (const item of itemsToCreate) {
      await OrderItem.create({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price
      });
    }

    // 4. Generate Payment Details (Razorpay or Demo Fallback)
    if (razorpay) {
      const options = {
        amount: Math.round(totalAmount * 100), // paise
        currency: 'INR',
        receipt: `receipt_order_${order.id}`
      };

      const razorpayOrder = await razorpay.orders.create(options);

      order.paymentId = razorpayOrder.id;
      await order.save();

      return res.json({
        success: true,
        orderId: order.id,
        paymentId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key: process.env.RAZORPAY_KEY_ID,
        isDemo: false
      });
    } else {
      // Demo Payment Flow
      order.paymentId = `demo_pay_${Date.now()}_${order.id}`;
      await order.save();

      return res.json({
        success: true,
        orderId: order.id,
        paymentId: order.paymentId,
        amount: order.totalAmount,
        currency: 'INR',
        isDemo: true
      });
    }
  } catch (error) {
    console.error('Checkout Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error during checkout' });
  }
});

// @route   POST /api/orders/verify-payment
// @desc    Verify payment signature, update order state, deduct inventory, trigger email
// @access  Private
router.post('/verify-payment', protect, async (req, res) => {
  const { orderId, razorpay_payment_id, razorpay_order_id, razorpay_signature, isDemo } = req.body;

  try {
    const order = await Order.findByPk(orderId, {
      include: [{ model: OrderItem, include: [Product] }]
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.paymentStatus === 'success') {
      return res.status(400).json({ success: false, message: 'Order has already been paid' });
    }

    let verified = false;

    if (isDemo) {
      // Demo authentication simulation
      verified = true;
      order.paymentId = razorpay_payment_id || `demo_txn_${Date.now()}`;
    } else {
      if (!razorpay) {
        return res.status(400).json({ success: false, message: 'Payment gateway configuration missing' });
      }

      // Verify Razorpay HMAC signature
      const text = `${razorpay_order_id}|${razorpay_payment_id}`;
      const signature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(text)
        .digest('hex');

      if (signature === razorpay_signature) {
        verified = true;
        order.paymentId = razorpay_payment_id;
      }
    }

    if (!verified) {
      order.paymentStatus = 'failed';
      await order.save();
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    // Update order status
    order.paymentStatus = 'success';
    order.status = 'paid';
    await order.save();

    // Deduct stock levels for items
    for (const item of order.OrderItems) {
      const product = item.Product;
      if (product) {
        product.stock = Math.max(0, product.stock - item.quantity);
        await product.save();
      }
    }

    // Clear user's shopping cart
    const cart = await Cart.findOne({ where: { userId: req.user.id } });
    if (cart) {
      await CartItem.destroy({ where: { cartId: cart.id } });
    }

    // Fetch user details for notification
    const user = await User.findByPk(req.user.id);

    // Build line items listing for the email body
    const orderListText = order.OrderItems.map(
      (item) => `- ${item.Product ? item.Product.name : 'Spare Part'} (Qty: ${item.quantity}) - Rs. ${item.price}`
    ).join('\n');

    const orderListHtml = order.OrderItems.map(
      (item) => `<li><b>${item.Product ? item.Product.name : 'Spare Part'}</b> (Qty: ${item.quantity}) - Rs. ${item.price}</li>`
    ).join('');

    // Trigger transactional email confirmation
    await sendEmail({
      email: user.email,
      subject: `Bike Parts Shop Order Confirmation - Order #${order.id}`,
      message: `Hi ${user.name},\n\nThank you for shopping at the Bike Spare Parts Store!\n\nYour order #${order.id} has been successfully paid and is currently processing.\n\nOrder Details:\n${orderListText}\n\nTotal Paid: Rs. ${order.totalAmount}\nShipping Address:\n${order.shippingAddress}\n\nWe will update you as soon as your items are shipped!`,
      html: `
        <h3>Hi ${user.name},</h3>
        <p>Thank you for shopping at the <b>Bike Spare Parts Store</b>!</p>
        <p>Your order <b>#${order.id}</b> has been paid and is currently processing.</p>
        <h4>Order Summary:</h4>
        <ul>${orderListHtml}</ul>
        <p><b>Total Amount Paid: Rs. ${order.totalAmount}</b></p>
        <p><b>Shipping Address:</b><br/>${order.shippingAddress}</p>
        <br/>
        <p>Best regards,<br/>The Bike Spare Parts Team</p>
      `
    });

    return res.json({ success: true, message: 'Payment successfully processed', orderId: order.id });
  } catch (error) {
    console.error('Payment Verification Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error processing payment verification' });
  }
});

// @route   GET /api/orders/my-orders
// @desc    Retrieve logged-in user's order history
// @access  Private
router.get('/my-orders', protect, async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { userId: req.user.id },
      include: [{ model: OrderItem, include: [Product] }],
      order: [['createdAt', 'DESC']]
    });
    return res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error('Fetch My Orders Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error retrieving order history' });
  }
});

// @route   GET /api/orders/all-orders
// @desc    Retrieve all store orders (Admin only)
// @access  Private/Admin
router.get('/all-orders', [protect, adminOnly], async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [
        { model: User, attributes: ['id', 'name', 'email'] },
        { model: OrderItem, include: [Product] }
      ],
      order: [['createdAt', 'DESC']]
    });
    return res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error('Fetch All Orders Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error retrieving all orders' });
  }
});

// @route   PUT /api/orders/status
// @desc    Update delivery/order status (Admin only)
// @access  Private/Admin
router.put('/status', [protect, adminOnly], async (req, res) => {
  const { orderId, status } = req.body;

  const validStatuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];
  if (!orderId || !status || !validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Please provide valid orderId and status' });
  }

  try {
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.status = status;
    await order.save();

    return res.json({ success: true, message: `Order status updated to ${status}`, order });
  } catch (error) {
    console.error('Update Order Status Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error updating status' });
  }
});

module.exports = router;
