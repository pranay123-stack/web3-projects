import mongoose, { Schema, Document } from 'mongoose';
import type { Product } from '@/types';

export interface ProductDocument extends Omit<Product, '_id'>, Document {}

const ProductSchema = new Schema<ProductDocument>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    compareAtPrice: { type: Number },
    images: [{ type: String }],
    category: { type: String, required: true },
    subcategory: { type: String },
    tags: [{ type: String }],
    stock: { type: Number, required: true, default: 0 },
    sku: { type: String, required: true, unique: true },
    dimensions: {
      width: Number,
      height: Number,
      depth: Number,
      unit: { type: String, enum: ['cm', 'in'], default: 'cm' },
    },
    materials: [{ type: String }],
    colors: [{ type: String }],
    featured: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });
ProductSchema.index({ category: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ featured: 1 });

export default mongoose.models.Product || mongoose.model<ProductDocument>('Product', ProductSchema);
