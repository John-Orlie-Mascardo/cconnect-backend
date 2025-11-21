import express from 'express';
import multer from 'multer';
import productController from '../controllers/products.js';

const router = express.Router();

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({ storage });

// Routes with file upload
router.post('/products', upload.single('image'), productController.createProduct);
router.put('/products/:id', upload.single('image'), productController.updateProduct);

// Routes without file upload
router.delete('/products/:id', productController.deleteProduct);
router.get('/products', productController.getProducts);
router.get('/products/:id', productController.getProduct);

export default router;
