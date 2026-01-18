'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Heart, Minus, Plus, Truck, RefreshCw, Shield, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import toast from 'react-hot-toast';
import type { Product } from '@/types';

// Sample product for demo
const sampleProduct: Product = {
  _id: '1',
  name: 'Scandi Oak Dining Table',
  slug: 'scandi-oak-dining-table',
  description: `Bring timeless Scandinavian elegance to your dining space with this beautiful oak dining table. Crafted from sustainably sourced solid oak, this table combines traditional craftsmanship with modern design sensibilities.

The clean lines and natural grain patterns make this table a perfect centerpiece for both formal dining rooms and casual kitchen spaces. The sturdy construction ensures this piece will be enjoyed for generations.

Features:
• Solid oak construction
• Sustainably sourced materials
• Seats 6-8 people comfortably
• Easy assembly required
• Matching chairs available separately`,
  price: 899,
  compareAtPrice: 1199,
  images: [
    'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800',
    'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800',
    'https://images.unsplash.com/photo-1604578762246-41134e37f9cc?w=800',
  ],
  category: 'Furniture',
  subcategory: 'Dining',
  tags: ['dining', 'oak', 'scandinavian'],
  stock: 15,
  sku: 'DT-001',
  dimensions: {
    width: 180,
    height: 75,
    depth: 90,
    unit: 'cm',
  },
  colors: ['Natural Oak', 'Walnut'],
  materials: ['Solid Oak', 'Steel Legs'],
  featured: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export default function ProductPage() {
  const params = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string | undefined>();
  const [quantity, setQuantity] = useState(1);

  const { addItem, openCart } = useCartStore();
  const { isInWishlist, toggleItem } = useWishlistStore();

  useEffect(() => {
    // Simulate API call
    setLoading(true);
    setTimeout(() => {
      setProduct(sampleProduct);
      if (sampleProduct.colors?.length) {
        setSelectedColor(sampleProduct.colors[0]);
      }
      setLoading(false);
    }, 500);
  }, [params.id]);

  const handleAddToCart = () => {
    if (product) {
      addItem(product, quantity, selectedColor);
      toast.success(`${product.name} added to cart`);
      openCart();
    }
  };

  const inWishlist = product ? isInWishlist(product._id) : false;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <Skeleton className="aspect-square w-full mb-4" />
            <div className="flex space-x-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="w-20 h-20" />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton variant="text" className="h-8 w-3/4" />
            <Skeleton variant="text" className="h-6 w-1/4" />
            <Skeleton variant="text" className="h-4 w-full" />
            <Skeleton variant="text" className="h-4 w-full" />
            <Skeleton variant="text" className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
        <Link href="/products">
          <Button>Back to Products</Button>
        </Link>
      </div>
    );
  }

  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-8">
        <Link href="/" className="hover:text-black">Home</Link>
        <ChevronRight size={14} />
        <Link href="/products" className="hover:text-black">Products</Link>
        <ChevronRight size={14} />
        <Link href={`/categories/${product.category.toLowerCase()}`} className="hover:text-black">
          {product.category}
        </Link>
        <ChevronRight size={14} />
        <span className="text-black">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Images */}
        <div>
          <motion.div
            key={selectedImage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative aspect-square bg-gray-100 mb-4"
          >
            <Image
              src={product.images[selectedImage]}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
            {discount > 0 && (
              <span className="absolute top-4 left-4 bg-red-500 text-white text-sm font-medium px-3 py-1">
                -{discount}%
              </span>
            )}
          </motion.div>

          {/* Thumbnail Gallery */}
          <div className="flex space-x-2 overflow-x-auto">
            {product.images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`relative w-20 h-20 flex-shrink-0 ${
                  selectedImage === index ? 'ring-2 ring-black' : ''
                }`}
              >
                <Image src={image} alt="" fill className="object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div>
          <div className="mb-6">
            <p className="text-gray-500 mb-2">{product.category}</p>
            <h1 className="text-3xl font-bold mb-4">{product.name}</h1>

            <div className="flex items-center space-x-4 mb-4">
              <span className="text-2xl font-bold">${product.price.toFixed(2)}</span>
              {product.compareAtPrice && (
                <span className="text-lg text-gray-500 line-through">
                  ${product.compareAtPrice.toFixed(2)}
                </span>
              )}
              {discount > 0 && (
                <span className="text-red-500 font-medium">Save {discount}%</span>
              )}
            </div>

            <p className="text-sm text-gray-500">
              SKU: {product.sku} • {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </p>
          </div>

          {/* Color Selection */}
          {product.colors && product.colors.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Color: {selectedColor}
              </label>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-4 py-2 border transition-colors ${
                      selectedColor === color
                        ? 'border-black bg-black text-white'
                        : 'border-gray-300 hover:border-black'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Quantity</label>
            <div className="flex items-center border border-gray-300 w-fit">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-3 hover:bg-gray-100"
                disabled={quantity <= 1}
              >
                <Minus size={18} />
              </button>
              <span className="px-6 py-3 min-w-[60px] text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                className="p-3 hover:bg-gray-100"
                disabled={quantity >= product.stock}
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-4 mb-8">
            <Button
              size="lg"
              fullWidth
              onClick={handleAddToCart}
              disabled={product.stock === 0}
            >
              {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </Button>
            <Button
              size="lg"
              variant={inWishlist ? 'primary' : 'outline'}
              onClick={() => {
                if (product) {
                  toggleItem(product);
                  toast.success(inWishlist ? 'Removed from wishlist' : 'Added to wishlist');
                }
              }}
            >
              <Heart size={20} fill={inWishlist ? 'currentColor' : 'none'} />
            </Button>
          </div>

          {/* Features */}
          <div className="border-t border-gray-200 pt-6 space-y-4">
            <div className="flex items-center space-x-3">
              <Truck className="text-gray-600" size={20} />
              <span className="text-sm">Free delivery on orders over $150</span>
            </div>
            <div className="flex items-center space-x-3">
              <RefreshCw className="text-gray-600" size={20} />
              <span className="text-sm">14-day free returns</span>
            </div>
            <div className="flex items-center space-x-3">
              <Shield className="text-gray-600" size={20} />
              <span className="text-sm">2-year warranty included</span>
            </div>
          </div>

          {/* Description */}
          <div className="border-t border-gray-200 pt-6 mt-6">
            <h2 className="font-medium mb-4">Description</h2>
            <div className="text-gray-600 whitespace-pre-line">{product.description}</div>
          </div>

          {/* Dimensions */}
          {product.dimensions && (
            <div className="border-t border-gray-200 pt-6 mt-6">
              <h2 className="font-medium mb-4">Dimensions</h2>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Width</p>
                  <p className="font-medium">{product.dimensions.width} {product.dimensions.unit}</p>
                </div>
                <div>
                  <p className="text-gray-500">Height</p>
                  <p className="font-medium">{product.dimensions.height} {product.dimensions.unit}</p>
                </div>
                <div>
                  <p className="text-gray-500">Depth</p>
                  <p className="font-medium">{product.dimensions.depth} {product.dimensions.unit}</p>
                </div>
              </div>
            </div>
          )}

          {/* Materials */}
          {product.materials && product.materials.length > 0 && (
            <div className="border-t border-gray-200 pt-6 mt-6">
              <h2 className="font-medium mb-4">Materials</h2>
              <div className="flex flex-wrap gap-2">
                {product.materials.map((material) => (
                  <span key={material} className="px-3 py-1 bg-gray-100 text-sm">
                    {material}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
