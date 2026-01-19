import mongoose, { Schema, Document } from 'mongoose';
import type { Order, OrderItem, Address, CryptoPayment } from '@/types';

export interface OrderDocument extends Omit<Order, '_id'>, Document {}

const OrderItemSchema = new Schema<OrderItem>({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  selectedColor: { type: String },
});

const AddressSchema = new Schema<Address>({
  label: { type: String },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  street: { type: String, required: true },
  apartment: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true },
  phone: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
});

const CryptoPaymentSchema = new Schema<CryptoPayment>({
  currency: { type: String, enum: ['ETH', 'USDT', 'USDC'], required: true },
  network: { type: String, enum: ['ethereum', 'polygon', 'bsc'], required: true },
  amount: { type: String, required: true },
  walletAddress: { type: String, required: true },
  transactionHash: { type: String },
  status: { type: String, enum: ['pending', 'confirmed', 'failed'], default: 'pending' },
});

const OrderSchema = new Schema<OrderDocument>(
  {
    userId: { type: String, required: true },
    orderNumber: { type: String, required: true, unique: true },
    items: [OrderItemSchema],
    shippingAddress: { type: AddressSchema, required: true },
    billingAddress: { type: AddressSchema, required: true },
    paymentMethod: { type: String, enum: ['stripe', 'paypal', 'crypto'], required: true },
    paymentStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    orderStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    subtotal: { type: Number, required: true },
    shipping: { type: Number, required: true },
    tax: { type: Number, required: true },
    total: { type: Number, required: true },
    cryptoPayment: CryptoPaymentSchema,
    stripePaymentIntentId: { type: String },
    trackingNumber: { type: String },
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

OrderSchema.index({ userId: 1 });
OrderSchema.index({ orderNumber: 1 });
OrderSchema.index({ orderStatus: 1 });
OrderSchema.index({ createdAt: -1 });

export default mongoose.models.Order || mongoose.model<OrderDocument>('Order', OrderSchema);
