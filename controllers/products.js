import Product from '../models/product.js';

const updateProduct = async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Product not found' });
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Product not found' });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create a new product
const createProduct = async (req, res) => {
  try {
    const {
      name,
      price,
      description,
      // form fields
      productId,
      size,
      materials,
      condition,
      quantity,
      stock,
      image,
    } = req.body;

    // Basic validation
    if (!name || price === undefined) {
      return res.status(400).json({ message: 'Name and price are required' });
    }

    // Prefer explicit quantity field, fall back to stock if provided
    const qty = quantity !== undefined ? quantity : stock !== undefined ? stock : 0;

    const product = new Product({
      name,
      price,
      description,
      productId,
      size,
      materials,
      condition,
      quantity: qty,
      stock: stock !== undefined ? stock : qty,
      image,
    });

    const saved = await product.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all products
const getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get single product by id
const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    const base = req.app.locals.baseUrl; // "http://localhost:3000/api"
    const productUrl = `${base}/products/${product._id}`;
    res.status(200).json({ ...product.toObject(), url: productUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export default {
  updateProduct,
  deleteProduct,
  createProduct,
  getProducts,
  getProduct
};
