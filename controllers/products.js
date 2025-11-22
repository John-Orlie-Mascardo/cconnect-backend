import Product from '../models/product.js';

// Create a new product
const createProduct = async (req, res) => {
  try {
    const {
      name,
      price,
      description,
      productId,
      size,
      materials,
      condition,
      quantity,
      stock,
    } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ message: 'Name and price are required' });
    }

    const qty = quantity !== undefined ? quantity : stock !== undefined ? stock : 0;

    // Get uploaded file from multer
    const image = req.file ? req.file.filename : null;

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
      image,// store filename in MongoDB
    });

    const saved = await product.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Update existing product
const updateProduct = async (req, res) => {
  try {
    const updateData = { ...req.body };

    // If a new file is uploaded, replace image field
    if (req.file) {
      updateData.image = req.file.filename;
    }

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: 'Product not found' });

    res.status(200).json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Delete a product
const deleteProduct = async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Removed' });
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Get all products
const getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.status(200).json(products);
  } catch (err) {
    console.error(err);
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
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export default {
  createProduct,
  updateProduct,
  deleteProduct,
  getProducts,
  getProduct
};
