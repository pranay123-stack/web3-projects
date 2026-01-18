'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Filter, ChevronDown, X } from 'lucide-react';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import type { Product, ProductFilters } from '@/types';

// Sample products (in production, fetch from API)
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
    subcategory: 'Dining',
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
    subcategory: 'Living Room',
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
    subcategory: 'Storage',
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
  {
    _id: '9',
    name: 'Mid-Century Armchair',
    slug: 'mid-century-armchair',
    description: 'Classic mid-century modern armchair with wooden legs.',
    price: 599,
    images: ['https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=600'],
    category: 'Furniture',
    subcategory: 'Living Room',
    tags: ['armchair', 'mid-century', 'retro'],
    stock: 10,
    sku: 'CH-001',
    colors: ['Mustard', 'Gray', 'Teal'],
    materials: ['Fabric', 'Oak'],
    featured: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '10',
    name: 'Industrial Floor Lamp',
    slug: 'industrial-floor-lamp',
    description: 'Industrial-style floor lamp with adjustable arm.',
    price: 289,
    images: ['https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=600'],
    category: 'Lighting',
    tags: ['floor lamp', 'industrial', 'adjustable'],
    stock: 15,
    sku: 'LT-003',
    colors: ['Black', 'Brass'],
    featured: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '11',
    name: 'Marble Coffee Table',
    slug: 'marble-coffee-table',
    description: 'Elegant coffee table with genuine marble top.',
    price: 749,
    compareAtPrice: 899,
    images: ['https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=600'],
    category: 'Furniture',
    subcategory: 'Living Room',
    tags: ['coffee table', 'marble', 'elegant'],
    stock: 6,
    sku: 'CT-001',
    colors: ['White Marble', 'Black Marble'],
    materials: ['Marble', 'Steel'],
    featured: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '12',
    name: 'Linen Throw Pillow Set',
    slug: 'linen-throw-pillow-set',
    description: 'Set of 2 premium linen throw pillows.',
    price: 79,
    images: ['https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=600'],
    category: 'Décor',
    tags: ['pillows', 'linen', 'textiles'],
    stock: 50,
    sku: 'DC-003',
    colors: ['Cream', 'Sage', 'Terracotta', 'Navy'],
    materials: ['Linen'],
    featured: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const categories = ['All', 'Furniture', 'Lighting', 'Décor', 'Outdoor'];
const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most Popular' },
];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ProductFilters>({
    category: undefined,
    sortBy: 'newest',
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    // Simulate API call with filtering
    setTimeout(() => {
      let filtered = [...sampleProducts];

      if (filters.category && filters.category !== 'All') {
        filtered = filtered.filter((p) => p.category === filters.category);
      }

      if (filters.minPrice) {
        filtered = filtered.filter((p) => p.price >= filters.minPrice!);
      }

      if (filters.maxPrice) {
        filtered = filtered.filter((p) => p.price <= filters.maxPrice!);
      }

      // Sort
      switch (filters.sortBy) {
        case 'price-asc':
          filtered.sort((a, b) => a.price - b.price);
          break;
        case 'price-desc':
          filtered.sort((a, b) => b.price - a.price);
          break;
        case 'newest':
          filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
        case 'popular':
          filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
          break;
      }

      setProducts(filtered);
      setLoading(false);
    }, 500);
  }, [filters]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">All Products</h1>
        <p className="text-gray-600">Discover our curated collection of designer furniture and home accessories.</p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 pb-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          {/* Mobile Filter Toggle */}
          <button
            className="md:hidden flex items-center space-x-2 px-4 py-2 border border-gray-300"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <Filter size={18} />
            <span>Filters</span>
          </button>

          {/* Desktop Category Filters */}
          <div className="hidden md:flex items-center space-x-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilters({ ...filters, category: cat === 'All' ? undefined : cat })}
                className={`px-4 py-2 text-sm transition-colors ${
                  (cat === 'All' && !filters.category) || filters.category === cat
                    ? 'bg-black text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Sort by:</span>
          <select
            value={filters.sortBy}
            onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as ProductFilters['sortBy'] })}
            className="px-4 py-2 border border-gray-300 focus:outline-none focus:border-black bg-white"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mobile Filters Panel */}
      {isFilterOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="md:hidden mb-8 p-4 bg-gray-50 border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Filters</h3>
            <button onClick={() => setIsFilterOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilters({ ...filters, category: cat === 'All' ? undefined : cat })}
                    className={`px-3 py-1 text-sm transition-colors ${
                      (cat === 'All' && !filters.category) || filters.category === cat
                        ? 'bg-black text-white'
                        : 'bg-white border border-gray-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Price Range</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice || ''}
                  onChange={(e) => setFilters({ ...filters, minPrice: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-24 px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice || ''}
                  onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-24 px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Results count */}
      <p className="text-sm text-gray-500 mb-6">
        Showing {products.length} {products.length === 1 ? 'product' : 'products'}
      </p>

      {/* Product Grid */}
      {loading ? (
        <ProductGridSkeleton count={12} />
      ) : products.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-4">No products found matching your criteria.</p>
          <Button onClick={() => setFilters({ sortBy: 'newest' })}>Clear Filters</Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
