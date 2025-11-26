import Product from '../models/product.js';

// Create a new product
const createProduct = async (req, res) => {
  try {
    // Enhanced logging for debugging
    console.log('\n🔵 === Incoming Product Creation Request ===');
    console.log('📋 Request Body:', req.body);
    console.log('📁 Uploaded File:', req.file ? req.file.filename : 'No file');
    console.log('🌐 Origin:', req.headers.origin || 'No origin header');
    console.log('📝 Content-Type:', req.headers['content-type']);

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

    // Comprehensive validation
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Product name is required' });
    }
    if (price === undefined || price === null || price === '') {
      return res.status(400).json({ error: 'Price is required' });
    }
    if (isNaN(price) || parseFloat(price) < 0) {
      return res.status(400).json({ error: 'Price must be a valid positive number' });
    }

    const qty = quantity !== undefined ? quantity : stock !== undefined ? stock : 0;


    // Get uploaded file from multer
    const imageFile = req.file ? req.file.filename : null;

    const product = new Product({
      name: name.trim(),
      price: parseFloat(price),
      description,
      productId,
      size,
      materials,
      condition,
      quantity: qty,
      stock: stock !== undefined ? stock : qty,
      image: imageFile, // store uploaded filename in MongoDB
    });

    const saved = await product.save();
    console.log('✅ Product created:', saved._id);
    res.status(201).json({ message: 'Product created successfully', product: saved });
  } catch (err) {
    console.error('❌ Product creation error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// Update existing product
const updateProduct = async (req, res) => {
  try {
    console.log('\n🔵 === Incoming Product Update Request ===');
    console.log('📋 Product ID:', req.params.id);
    console.log('📝 Update Data:', req.body);
    console.log('📁 New File:', req.file ? req.file.filename : 'No new file');

    const updateData = { ...req.body };

    // Validate if price is being updated
    if (updateData.price !== undefined) {
      if (isNaN(updateData.price) || parseFloat(updateData.price) < 0) {
        return res.status(400).json({ error: 'Price must be a valid positive number' });
      }
      updateData.price = parseFloat(updateData.price);
    }

    // If a new file is uploaded, replace image field
    if (req.file) {
      updateData.image = req.file.filename;
    }

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: 'Product not found' });

    console.log('✅ Product updated:', updated._id);
    res.status(200).json({ message: 'Product updated successfully', product: updated });
  } catch (err) {
    console.error('❌ Product update error:', err.message);
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
