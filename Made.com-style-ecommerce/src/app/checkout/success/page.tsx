'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCartStore } from '@/store/cartStore';

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const { clearCart } = useCartStore();

  const sessionId = searchParams.get('session_id');
  const method = searchParams.get('method');
  const txHash = searchParams.get('tx');

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
      >
        <CheckCircle className="text-green-600" size={48} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h1 className="text-3xl font-bold mb-4">Thank you for your order!</h1>
        <p className="text-gray-600 mb-8">
          Your order has been confirmed and will be shipped soon. We&apos;ve sent a confirmation email with your order details.
        </p>

        {method === 'crypto' && txHash && (
          <div className="bg-gray-50 p-4 rounded mb-8">
            <p className="text-sm text-gray-500 mb-2">Transaction Hash:</p>
            <a
              href={`https://etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-mono text-blue-600 hover:underline break-all"
            >
              {txHash}
            </a>
          </div>
        )}

        <div className="bg-gray-50 p-6 mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Package className="text-gray-600" size={24} />
            <span className="font-medium">What&apos;s Next?</span>
          </div>
          <ul className="text-sm text-gray-600 space-y-2 text-left max-w-sm mx-auto">
            <li>• You&apos;ll receive an order confirmation email shortly</li>
            <li>• We&apos;ll notify you when your order ships</li>
            <li>• Track your order in your account dashboard</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/dashboard">
            <Button>
              View Order
              <ArrowRight size={18} className="ml-2" />
            </Button>
          </Link>
          <Link href="/products">
            <Button variant="outline">Continue Shopping</Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
