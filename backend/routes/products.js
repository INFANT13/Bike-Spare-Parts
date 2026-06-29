const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Product, Category } = require('../models');
const { protect, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadToCloudinary } = require('../utils/cloudinary');

// Simple slugify helper
const makeSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

// @route   GET /api/products
// @desc    Get all products with filtering, search, and sorting
// @access  Public
router.get('/', async (req, res) => {
  const { category, search, minPrice, maxPrice, sort } = req.query;

  const whereClause = {};

  if (search) {
    whereClause[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { description: { [Op.like]: `%${search}%` } },
      { sku: { [Op.like]: `%${search}%` } }
    ];
  }

  if (minPrice || maxPrice) {
    whereClause.price = {};
    if (minPrice) whereClause.price[Op.gte] = parseFloat(minPrice);
    if (maxPrice) whereClause.price[Op.lte] = parseFloat(maxPrice);
  }

  // Handle category filtering
  const includeOption = [{ model: Category, attributes: ['id', 'name', 'slug'] }];

  let categoryCondition = null;
  if (category) {
    // category query parameter can be a Category slug or ID
    if (isNaN(category)) {
      categoryCondition = { slug: category };
    } else {
      categoryCondition = { id: parseInt(category) };
    }
    includeOption[0].where = categoryCondition;
  }

  // Handle sorting
  let orderOption = [['createdAt', 'DESC']]; // default: newest
  if (sort) {
    if (sort === 'price_asc') orderOption = [['price', 'ASC']];
    else if (sort === 'price_desc') orderOption = [['price', 'DESC']];
    else if (sort === 'name_asc') orderOption = [['name', 'ASC']];
    else if (sort === 'name_desc') orderOption = [['name', 'DESC']];
  }

  try {
    const products = await Product.findAll({
      where: whereClause,
      include: includeOption,
      order: orderOption
    });
    return res.json({ success: true, count: products.length, products });
  } catch (error) {
    console.error('Fetch Products Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error fetching products' });
  }
});

// @route   GET /api/products/categories
// @desc    Get all categories
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.findAll({
      order: [['name', 'ASC']]
    });
    return res.json({ success: true, categories });
  } catch (error) {
    console.error('Fetch Categories Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error fetching categories' });
  }
});

// @route   GET /api/products/:id
// @desc    Get product by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{ model: Category, attributes: ['id', 'name', 'slug'] }]
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    return res.json({ success: true, product });
  } catch (error) {
    console.error('Fetch Single Product Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error fetching product details' });
  }
});

// @route   POST /api/products
// @desc    Create a product (Admin only)
// @access  Private/Admin
router.post('/', [protect, adminOnly, upload.single('image')], async (req, res) => {
  const { name, sku, description, price, stock, categoryId, specifications } = req.body;

  if (!name || !sku || !price || !categoryId) {
    return res.status(400).json({ success: false, message: 'Please provide name, SKU, price, and categoryId' });
  }

  try {
    // Check if SKU exists
    const skuExists = await Product.findOne({ where: { sku } });
    if (skuExists) {
      return res.status(400).json({ success: false, message: 'Product SKU already exists' });
    }

    // Check if Category exists
    const category = await Category.findByPk(categoryId);
    if (!category) {
      return res.status(400).json({ success: false, message: 'Category not found' });
    }

    let imageUrl = '/uploads/placeholder.jpg'; // default fallback
    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file);
    }

    let parsedSpecs = {};
    if (specifications) {
      try {
        parsedSpecs = typeof specifications === 'string' ? JSON.parse(specifications) : specifications;
      } catch (err) {
        parsedSpecs = { details: specifications };
      }
    }

    const product = await Product.create({
      name: name.trim(),
      sku: sku.trim(),
      slug: makeSlug(name),
      description: description ? description.trim() : '',
      price: parseFloat(price),
      stock: parseInt(stock) || 0,
      image: imageUrl,
      categoryId: parseInt(categoryId),
      specifications: parsedSpecs
    });

    return res.status(201).json({ success: true, product });
  } catch (error) {
    console.error('Create Product Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error creating product' });
  }
});

// @route   PUT /api/products/:id
// @desc    Update a product (Admin only)
// @access  Private/Admin
router.put('/:id', [protect, adminOnly, upload.single('image')], async (req, res) => {
  const { name, sku, description, price, stock, categoryId, specifications } = req.body;

  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (sku && sku !== product.sku) {
      const skuExists = await Product.findOne({ where: { sku } });
      if (skuExists) {
        return res.status(400).json({ success: false, message: 'Product SKU already exists' });
      }
      product.sku = sku.trim();
    }

    if (categoryId) {
      const category = await Category.findByPk(categoryId);
      if (!category) {
        return res.status(400).json({ success: false, message: 'Category not found' });
      }
      product.categoryId = parseInt(categoryId);
    }

    if (name) {
      product.name = name.trim();
      product.slug = makeSlug(name);
    }
    if (description !== undefined) product.description = description.trim();
    if (price !== undefined) product.price = parseFloat(price);
    if (stock !== undefined) product.stock = parseInt(stock);

    if (req.file) {
      product.image = await uploadToCloudinary(req.file);
    }

    if (specifications) {
      try {
        product.specifications = typeof specifications === 'string' ? JSON.parse(specifications) : specifications;
      } catch (err) {
        product.specifications = { details: specifications };
      }
    }

    await product.save();
    return res.json({ success: true, product });
  } catch (error) {
    console.error('Update Product Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error updating product' });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete a product (Admin only)
// @access  Private/Admin
router.delete('/:id', [protect, adminOnly], async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await product.destroy();
    return res.json({ success: true, message: 'Product removed successfully' });
  } catch (error) {
    console.error('Delete Product Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error deleting product' });
  }
});

// @route   POST /api/products/categories
// @desc    Create a new category (Admin only)
// @access  Private/Admin
router.post('/categories', [protect, adminOnly, upload.single('image')], async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, message: 'Category name is required' });
  }

  try {
    const categoryExists = await Category.findOne({ where: { name } });
    if (categoryExists) {
      return res.status(400).json({ success: false, message: 'Category already exists' });
    }

    let imageUrl = '/uploads/category-placeholder.jpg';
    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file);
    }

    const category = await Category.create({
      name: name.trim(),
      slug: makeSlug(name),
      description: description ? description.trim() : '',
      image: imageUrl
    });

    return res.status(201).json({ success: true, category });
  } catch (error) {
    console.error('Create Category Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error creating category' });
  }
});

// @route   DELETE /api/products/categories/:id
// @desc    Delete a category (Admin only)
// @access  Private/Admin
router.delete('/categories/:id', [protect, adminOnly], async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    await category.destroy();
    return res.json({ success: true, message: 'Category removed successfully' });
  } catch (error) {
    console.error('Delete Category Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error deleting category' });
  }
});

module.exports = router;
