'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Truck, Shield, RefreshCw } from 'lucide-react';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import type { Product } from '@/types';

// Sample products for demo (replace with API call)
const sampleProducts: Product[] = [
  {
    _id: '1',
    name: 'Scandi Oak Dining Table',
    slug: 'scandi-oak-dining-table',
    description: 'A beautiful Scandinavian-style dining table made from solid oak.',
    price: 899,
    compareAtPrice: 1199,
    images: ['https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600'],
    category: 'Furniture',
    tags: ['dining', 'oak', 'scandinavian'],
    stock: 15,
    sku: 'DT-001',
    colors: ['Natural', 'Walnut'],
    materials: ['Oak'],
    featured: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '2',
    name: 'Modern Pendant Light',
    slug: 'modern-pendant-light',
    description: 'Contemporary pendant light with brass finish.',
    price: 249,
    images: ['https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=600'],
    category: 'Lighting',
    tags: ['pendant', 'modern', 'brass'],
    stock: 25,
    sku: 'LT-001',
    colors: ['Brass', 'Chrome', 'Black'],
    featured: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '3',
    name: 'Velvet Sofa - Forest Green',
    slug: 'velvet-sofa-forest-green',
    description: 'Luxurious velvet sofa in a stunning forest green.',
    price: 1499,
    compareAtPrice: 1899,
    images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600'],
    category: 'Furniture',
    tags: ['sofa', 'velvet', 'living room'],
    stock: 8,
    sku: 'SF-001',
    colors: ['Forest Green', 'Navy', 'Blush'],
    materials: ['Velvet', 'Wood'],
    featured: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '4',
    name: 'Ceramic Table Lamp',
    slug: 'ceramic-table-lamp',
    description: 'Handcrafted ceramic table lamp with linen shade.',
    price: 159,
    images: ['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600'],
    category: 'Lighting',
    tags: ['table lamp', 'ceramic', 'handmade'],
    stock: 30,
    sku: 'LT-002',
    colors: ['White', 'Terracotta', 'Blue'],
    featured: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '5',
    name: 'Minimalist Bookshelf',
    slug: 'minimalist-bookshelf',
    description: 'Clean-lined bookshelf perfect for modern spaces.',
    price: 449,
    images: ['https://images.unsplash.com/photo-1594620302200-9a762244a156?w=600'],
    category: 'Furniture',
    tags: ['bookshelf', 'storage', 'minimalist'],
    stock: 12,
    sku: 'ST-001',
    colors: ['White', 'Black', 'Oak'],
    materials: ['MDF', 'Steel'],
    featured: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '6',
    name: 'Woven Wall Art',
    slug: 'woven-wall-art',
    description: 'Handwoven wall hanging with natural fibers.',
    price: 129,
    images: ['https://images.unsplash.com/photo-1582582621959-48d27397dc69?w=600'],
    category: 'Décor',
    tags: ['wall art', 'woven', 'bohemian'],
    stock: 20,
    sku: 'DC-001',
    colors: ['Natural', 'Cream'],
    materials: ['Cotton', 'Jute'],
    featured: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '7',
    name: 'Outdoor Lounge Chair',
    slug: 'outdoor-lounge-chair',
    description: 'Weather-resistant lounge chair for garden or patio.',
    price: 399,
    compareAtPrice: 499,
    images: ['https://images.unsplash.com/photo-1600210492493-0946911123ea?w=600'],
    category: 'Outdoor',
    tags: ['outdoor', 'lounge', 'garden'],
    stock: 18,
    sku: 'OD-001',
    colors: ['Natural Teak', 'Anthracite'],
    materials: ['Teak', 'Weather-resistant Fabric'],
    featured: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '8',
    name: 'Terracotta Planter Set',
    slug: 'terracotta-planter-set',
    description: 'Set of 3 handcrafted terracotta planters.',
    price: 89,
    images: ['https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600'],
    category: 'Décor',
    tags: ['planters', 'terracotta', 'garden'],
    stock: 40,
    sku: 'DC-002',
    colors: ['Terracotta', 'White'],
    materials: ['Terracotta'],
    featured: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const categories = [
  { name: 'Furniture', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400', href: '/categories/furniture' },
  { name: 'Lighting', image: 'https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=400', href: '/categories/lighting' },
  { name: 'Décor', image: 'https://images.unsplash.com/photo-1582582621959-48d27397dc69?w=400', href: '/categories/decor' },
  { name: 'Outdoor', image: 'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=400', href: '/categories/outdoor' },
];

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setProducts(sampleProducts);
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[600px] bg-gray-100">
        <Image
          src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1920"
          alt="Modern living room interior"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-4 w-full">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-xl text-white"
            >
              <h1 className="text-5xl md:text-6xl font-bold mb-6">
                Design your perfect space
              </h1>
              <p className="text-xl mb-8 text-gray-200">
                Discover designer furniture and home accessories at exceptional value.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/products">
                  <button className="hero-btn-primary">
                    Shop Now
                  </button>
                </Link>
                <Link href="/categories/sale">
                  <button className="hero-btn-outline">
                    View Sale
                  </button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-8 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center space-x-4">
              <Truck className="text-gray-600" size={32} />
              <div>
                <p className="font-medium">Free Delivery</p>
                <p className="text-sm text-gray-500">On orders over $150</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <RefreshCw className="text-gray-600" size={32} />
              <div>
                <p className="font-medium">14-Day Returns</p>
                <p className="text-sm text-gray-500">Hassle-free returns</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Shield className="text-gray-600" size={32} />
              <div>
                <p className="font-medium">Secure Payments</p>
                <p className="text-sm text-gray-500">Card, PayPal & Crypto</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Shop by Category</h2>
            <Link href="/categories" className="flex items-center text-gray-600 hover:text-black transition-colors">
              View all <ArrowRight size={18} className="ml-1" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category) => (
              <Link key={category.name} href={category.href}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="relative aspect-square overflow-hidden bg-gray-100 group"
                >
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <h3 className="text-white text-xl font-semibold">{category.name}</h3>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Featured Products</h2>
            <Link href="/products" className="flex items-center text-gray-600 hover:text-black transition-colors">
              View all <ArrowRight size={18} className="ml-1" />
            </Link>
          </div>

          {loading ? (
            <ProductGridSkeleton count={8} />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Crypto Banner */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-black text-white p-8 md:p-12 flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-6 md:mb-0">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Pay with Crypto</h2>
              <p className="text-gray-300">
                We accept ETH, USDT, and USDC on Ethereum, Polygon, and BSC networks.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="px-4 py-2 bg-white/10 rounded">ETH</span>
              <span className="px-4 py-2 bg-white/10 rounded">USDT</span>
              <span className="px-4 py-2 bg-white/10 rounded">USDC</span>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Join our newsletter</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Subscribe for exclusive offers, design inspiration, and new product launches.
          </p>
          <form className="flex flex-col sm:flex-row max-w-md mx-auto gap-4">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
            />
            <Button type="submit">Subscribe</Button>
          </form>
        </div>
      </section>
    </div>
  );
}
