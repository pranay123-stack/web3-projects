'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Wallet, ChevronLeft, Lock, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useCartStore } from '@/store/cartStore';
import { useWalletStore } from '@/store/walletStore';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { loadStripe } from '@stripe/stripe-js';
import { BrowserProvider, parseEther, formatEther } from 'ethers';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY || '');

type PaymentMethod = 'stripe' | 'crypto';
type CryptoCurrency = 'ETH' | 'USDT' | 'USDC';

const ETH_PRICE_USD = 3500;

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getSubtotal, clearCart } = useCartStore();
  const { isConnected, address, balance, connect } = useWalletStore();
  const { user } = useAuthStore();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('stripe');
  const [cryptoCurrency, setCryptoCurrency] = useState<CryptoCurrency>('ETH');
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'shipping' | 'payment' | 'confirm'>('shipping');

  const [shippingInfo, setShippingInfo] = useState({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    phone: '',
    street: '',
    apartment: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
  });

  const subtotal = getSubtotal();
  const shipping = subtotal > 150 ? 0 : 15;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  const cryptoAmount = cryptoCurrency === 'ETH'
    ? (total / ETH_PRICE_USD).toFixed(6)
    : total.toFixed(2);

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingInfo.firstName || !shippingInfo.lastName || !shippingInfo.email ||
        !shippingInfo.street || !shippingInfo.city || !shippingInfo.state || !shippingInfo.postalCode) {
      toast.error('Please fill in all required fields');
      return;
    }
    setStep('payment');
  };

  const handleStripeCheckout = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/checkout/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({
            name: item.product.name,
            image: item.product.images[0],
            price: item.product.price,
            quantity: item.quantity,
          })),
          shippingAddress: shippingInfo,
          customerEmail: shippingInfo.email,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (error) {
      toast.error('Failed to initiate checkout');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCryptoPayment = async () => {
    if (!isConnected || !address) {
      await connect();
      return;
    }

    if (!window.ethereum) {
      toast.error('MetaMask is not installed');
      return;
    }

    setIsProcessing(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // For ETH payment
      if (cryptoCurrency === 'ETH') {
        const tx = await signer.sendTransaction({
          to: process.env.NEXT_PUBLIC_CRYPTO_WALLET || '0x742d35Cc6634C0532925a3b844Bc9e7595f89Ab7',
          value: parseEther(cryptoAmount),
        });

        toast.loading('Transaction pending...');
        await tx.wait();

        toast.dismiss();
        toast.success('Payment successful!');

        clearCart();
        router.push('/checkout/success?method=crypto&tx=' + tx.hash);
      } else {
        // For USDT/USDC, you would interact with the token contract
        toast.error('USDT/USDC payments coming soon');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
        <Link href="/products">
          <Button>Continue Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link href="/cart" className="flex items-center text-gray-600 hover:text-black mb-8">
        <ChevronLeft size={20} />
        <span>Back to Cart</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <h1 className="text-3xl font-bold mb-8">Checkout</h1>

          {/* Progress Steps */}
          <div className="flex items-center mb-8">
            {['shipping', 'payment', 'confirm'].map((s, i) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === s
                      ? 'bg-black text-white'
                      : ['shipping', 'payment', 'confirm'].indexOf(step) > i
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {['shipping', 'payment', 'confirm'].indexOf(step) > i ? (
                    <Check size={16} />
                  ) : (
                    i + 1
                  )}
                </div>
                {i < 2 && (
                  <div
                    className={`w-16 h-0.5 ${
                      ['shipping', 'payment', 'confirm'].indexOf(step) > i
                        ? 'bg-green-500'
                        : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Shipping Step */}
            {step === 'shipping' && (
              <motion.form
                key="shipping"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleShippingSubmit}
                className="space-y-6"
              >
                <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="First Name *"
                    value={shippingInfo.firstName}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, firstName: e.target.value })}
                    required
                  />
                  <Input
                    label="Last Name *"
                    value={shippingInfo.lastName}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, lastName: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Email *"
                    type="email"
                    value={shippingInfo.email}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, email: e.target.value })}
                    required
                  />
                  <Input
                    label="Phone"
                    type="tel"
                    value={shippingInfo.phone}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, phone: e.target.value })}
                  />
                </div>

                <Input
                  label="Street Address *"
                  value={shippingInfo.street}
                  onChange={(e) => setShippingInfo({ ...shippingInfo, street: e.target.value })}
                  required
                />

                <Input
                  label="Apartment, suite, etc."
                  value={shippingInfo.apartment}
                  onChange={(e) => setShippingInfo({ ...shippingInfo, apartment: e.target.value })}
                />

                <div className="grid grid-cols-3 gap-4">
                  <Input
                    label="City *"
                    value={shippingInfo.city}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
                    required
                  />
                  <Input
                    label="State *"
                    value={shippingInfo.state}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, state: e.target.value })}
                    required
                  />
                  <Input
                    label="ZIP Code *"
                    value={shippingInfo.postalCode}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, postalCode: e.target.value })}
                    required
                  />
                </div>

                <Button type="submit" size="lg" fullWidth>
                  Continue to Payment
                </Button>
              </motion.form>
            )}

            {/* Payment Step */}
            {step === 'payment' && (
              <motion.div
                key="payment"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <h2 className="text-xl font-semibold mb-4">Payment Method</h2>

                {/* Payment Method Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setPaymentMethod('stripe')}
                    className={`p-4 border-2 transition-colors flex items-center space-x-3 ${
                      paymentMethod === 'stripe' ? 'border-black' : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <CreditCard size={24} />
                    <div className="text-left">
                      <p className="font-medium">Card</p>
                      <p className="text-sm text-gray-500">Visa, Mastercard, etc.</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('crypto')}
                    className={`p-4 border-2 transition-colors flex items-center space-x-3 ${
                      paymentMethod === 'crypto' ? 'border-black' : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <Wallet size={24} />
                    <div className="text-left">
                      <p className="font-medium">Crypto</p>
                      <p className="text-sm text-gray-500">ETH, USDT, USDC</p>
                    </div>
                  </button>
                </div>

                {/* Crypto Options */}
                {paymentMethod === 'crypto' && (
                  <div className="p-4 bg-gray-50 border border-gray-200">
                    <p className="text-sm font-medium mb-3">Select Currency</p>
                    <div className="flex space-x-2">
                      {(['ETH', 'USDT', 'USDC'] as CryptoCurrency[]).map((currency) => (
                        <button
                          key={currency}
                          onClick={() => setCryptoCurrency(currency)}
                          className={`px-4 py-2 border transition-colors ${
                            cryptoCurrency === currency
                              ? 'border-black bg-black text-white'
                              : 'border-gray-300 hover:border-black'
                          }`}
                        >
                          {currency}
                        </button>
                      ))}
                    </div>

                    <div className="mt-4 p-4 bg-white border border-gray-200">
                      <p className="text-sm text-gray-500">Amount to pay:</p>
                      <p className="text-2xl font-bold">
                        {cryptoAmount} {cryptoCurrency}
                      </p>
                      {cryptoCurrency === 'ETH' && (
                        <p className="text-sm text-gray-500">≈ ${total.toFixed(2)} USD</p>
                      )}
                    </div>

                    {isConnected ? (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-800 text-sm">
                        <p>Wallet connected: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
                        <p>Balance: {balance ? parseFloat(balance).toFixed(4) : '0'} ETH</p>
                      </div>
                    ) : (
                      <Button
                        className="mt-4"
                        variant="outline"
                        onClick={connect}
                        fullWidth
                      >
                        <Wallet size={18} className="mr-2" />
                        Connect Wallet
                      </Button>
                    )}
                  </div>
                )}

                <div className="flex space-x-4">
                  <Button variant="outline" onClick={() => setStep('shipping')}>
                    Back
                  </Button>
                  <Button
                    size="lg"
                    fullWidth
                    loading={isProcessing}
                    onClick={() => {
                      if (paymentMethod === 'stripe') {
                        handleStripeCheckout();
                      } else {
                        handleCryptoPayment();
                      }
                    }}
                  >
                    <Lock size={18} className="mr-2" />
                    {paymentMethod === 'stripe' ? 'Pay with Card' : `Pay ${cryptoAmount} ${cryptoCurrency}`}
                  </Button>
                </div>

                <p className="text-center text-sm text-gray-500 flex items-center justify-center">
                  <Lock size={14} className="mr-1" />
                  Secure checkout powered by {paymentMethod === 'stripe' ? 'Stripe' : 'Ethereum'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 p-6 sticky top-24">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

            <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
              {items.map((item) => (
                <div key={item.productId} className="flex space-x-3">
                  <div className="relative w-16 h-16 bg-gray-200 flex-shrink-0">
                    <Image
                      src={item.product.images[0] || '/placeholder.jpg'}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-black text-white text-xs rounded-full flex items-center justify-center">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.product.name}</p>
                    {item.selectedColor && (
                      <p className="text-xs text-gray-500">{item.selectedColor}</p>
                    )}
                    <p className="text-sm font-medium">${(item.product.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg pt-2 border-t border-gray-200">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
