'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag } from 'lucide-react';
import type { Product } from '@/types';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCartStore();
  const { isInWishlist, toggleItem } = useWishlistStore();

  const inWishlist = isInWishlist(product._id);
  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    toast.success(`${product.name} added to cart`);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleItem(product);
    toast.success(inWishlist ? 'Removed from wishlist' : 'Added to wishlist');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative"
    >
      <Link href={`/products/${product._id}`}>
        <div className="relative aspect-square overflow-hidden bg-gray-100 mb-4">
          <Image
            src={product.images[0] || '/placeholder.jpg'}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />

          {/* Discount badge */}
          {discount > 0 && (
            <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-medium px-2 py-1">
              -{discount}%
            </span>
          )}

          {/* Quick actions */}
          <div className="absolute top-3 right-3 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleToggleWishlist}
              className={`p-2 rounded-full transition-colors ${
                inWishlist ? 'bg-red-500 text-white' : 'bg-white text-black hover:bg-gray-100'
              }`}
              aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart size={18} fill={inWishlist ? 'currentColor' : 'none'} />
            </button>
          </div>

          {/* Add to cart button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            whileHover={{ scale: 1.02 }}
            className="absolute bottom-3 left-3 right-3 bg-white text-black py-3 font-medium
                       opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2"
            onClick={handleAddToCart}
          >
            <ShoppingBag size={18} />
            <span>Add to cart</span>
          </motion.button>
        </div>

        <div>
          <p className="text-sm text-gray-500 mb-1">{product.category}</p>
          <h3 className="font-medium mb-2 group-hover:text-gray-600 transition-colors">
            {product.name}
          </h3>
          <div className="flex items-center space-x-2">
            <span className="font-semibold">${product.price.toFixed(2)}</span>
            {product.compareAtPrice && (
              <span className="text-sm text-gray-500 line-through">
                ${product.compareAtPrice.toFixed(2)}
              </span>
            )}
          </div>
          {product.colors && product.colors.length > 0 && (
            <div className="flex items-center space-x-1 mt-2">
              {product.colors.slice(0, 4).map((color) => (
                <span
                  key={color}
                  className="w-4 h-4 rounded-full border border-gray-300"
                  style={{ backgroundColor: color.toLowerCase() }}
                  title={color}
                />
              ))}
              {product.colors.length > 4 && (
                <span className="text-xs text-gray-500">+{product.colors.length - 4}</span>
              )}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
