import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: String,
  // Optional product identifier coming from the frontend form
  productId: { type: String },
  sizes: [{ type: Number }], // Array of available sizes (e.g., [4, 5, 6, 7, 8, 9, 10, 11, 12])
  materials: { type: String },
  condition: { type: String },
  // quantity available (keeps `stock` for backwards compatibility)
  quantity: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  // image URL (store filenames/URLs from uploads if implemented)
  image: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Product', productSchema);