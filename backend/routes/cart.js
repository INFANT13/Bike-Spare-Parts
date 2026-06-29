const express = require('express');
const router = express.Router();
const { Cart, CartItem, Product } = require('../models');
const { protect } = require('../middleware/auth');

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ where: { userId } });
  if (!cart) {
    cart = await Cart.create({ userId });
  }
  return cart;
};

// @route   GET /api/cart
// @desc    Retrieve logged-in user's cart details
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user.id);
    const items = await CartItem.findAll({
      where: { cartId: cart.id },
      include: [{ model: Product, attributes: ['id', 'name', 'price', 'image', 'stock', 'sku'] }],
      order: [['createdAt', 'ASC']]
    });

    return res.json({ success: true, cartId: cart.id, items });
  } catch (error) {
    console.error('Fetch Cart Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error fetching cart' });
  }
});

// @route   POST /api/cart/add
// @desc    Add product to cart or increment quantity
// @access  Private
router.post('/add', protect, async (req, res) => {
  const { productId, quantity } = req.body;
  const qty = parseInt(quantity) || 1;

  if (!productId) {
    return res.status(400).json({ success: false, message: 'Product ID is required' });
  }

  try {
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.stock < qty) {
      return res.status(400).json({ success: false, message: `Only ${product.stock} items left in stock` });
    }

    const cart = await getOrCreateCart(req.user.id);

    let cartItem = await CartItem.findOne({
      where: { cartId: cart.id, productId }
    });

    if (cartItem) {
      const newQty = cartItem.quantity + qty;
      if (product.stock < newQty) {
        return res.status(400).json({ success: false, message: `Cannot add more items. Max available stock is ${product.stock}` });
      }
      cartItem.quantity = newQty;
      await cartItem.save();
    } else {
      cartItem = await CartItem.create({
        cartId: cart.id,
        productId,
        quantity: qty
      });
    }

    return res.status(200).json({ success: true, message: 'Item added to cart successfully', cartItem });
  } catch (error) {
    console.error('Add to Cart Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error adding item to cart' });
  }
});

// @route   PUT /api/cart/update
// @desc    Update a cart item quantity
// @access  Private
router.put('/update', protect, async (req, res) => {
  const { productId, quantity } = req.body;
  const qty = parseInt(quantity);

  if (!productId || isNaN(qty) || qty < 1) {
    return res.status(400).json({ success: false, message: 'Provide a valid product ID and positive quantity' });
  }

  try {
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.stock < qty) {
      return res.status(400).json({ success: false, message: `Only ${product.stock} items left in stock` });
    }

    const cart = await getOrCreateCart(req.user.id);

    const cartItem = await CartItem.findOne({
      where: { cartId: cart.id, productId }
    });

    if (!cartItem) {
      return res.status(404).json({ success: false, message: 'Item not found in your cart' });
    }

    cartItem.quantity = qty;
    await cartItem.save();

    return res.json({ success: true, message: 'Cart updated successfully', cartItem });
  } catch (error) {
    console.error('Update Cart Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error updating cart quantity' });
  }
});

// @route   DELETE /api/cart/remove/:id
// @desc    Remove an item from the cart by Product ID
// @access  Private
router.delete('/remove/:id', protect, async (req, res) => {
  const productId = parseInt(req.params.id);

  try {
    const cart = await getOrCreateCart(req.user.id);
    const cartItem = await CartItem.findOne({
      where: { cartId: cart.id, productId }
    });

    if (!cartItem) {
      return res.status(404).json({ success: false, message: 'Item not found in your cart' });
    }

    await cartItem.destroy();
    return res.json({ success: true, message: 'Item removed from cart' });
  } catch (error) {
    console.error('Remove Cart Item Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error removing item' });
  }
});

// @route   DELETE /api/cart/clear
// @desc    Clear all items in the user's cart
// @access  Private
router.delete('/clear', protect, async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user.id);
    await CartItem.destroy({ where: { cartId: cart.id } });
    return res.json({ success: true, message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Clear Cart Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error clearing cart' });
  }
});

module.exports = router;
