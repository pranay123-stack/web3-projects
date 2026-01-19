'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';
import { ProductCard } from '@/components/product/ProductCard';
import { Button } from '@/components/ui/Button';
import { useWishlistStore } from '@/store/wishlistStore';

export default function WishlistPage() {
  const { items, clearWishlist } = useWishlistStore();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Wishlist</h1>
          <p className="text-gray-600">{items.length} items saved</p>
        </div>
        {items.length > 0 && (
          <Button variant="outline" onClick={clearWishlist}>
            Clear All
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 bg-gray-50">
          <Heart size={64} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-medium mb-2">Your wishlist is empty</h2>
          <p className="text-gray-500 mb-6">
            Save items you love by clicking the heart icon on any product.
          </p>
          <Link href="/products">
            <Button>Explore Products</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
