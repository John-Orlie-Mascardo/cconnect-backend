import express from 'express';
import productController from '../controllers/products.js';

const router = express.Router();

router.put('/products/:id', productController.updateProduct);
router.delete('/products/:id', productController.deleteProduct);

export default router;