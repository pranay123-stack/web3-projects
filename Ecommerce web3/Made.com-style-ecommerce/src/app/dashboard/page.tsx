'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Package,
  Heart,
  User,
  Wallet,
  MapPin,
  LogOut,
  ChevronRight,
  Clock,
  Truck,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { useWalletStore } from '@/store/walletStore';
import { useWishlistStore } from '@/store/wishlistStore';
import type { Order } from '@/types';

// Sample orders for demo
const sampleOrders: Order[] = [
  {
    _id: '1',
    userId: '1',
    orderNumber: 'ORD-ABC123',
    items: [
      {
        productId: '1',
        name: 'Scandi Oak Dining Table',
        image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=200',
        price: 899,
        quantity: 1,
      },
    ],
    shippingAddress: {
      _id: '1',
      label: 'Home',
      firstName: 'John',
      lastName: 'Doe',
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'USA',
      phone: '+1 234 567 890',
      isDefault: true,
    },
    billingAddress: {
      _id: '1',
      label: 'Home',
      firstName: 'John',
      lastName: 'Doe',
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'USA',
      phone: '+1 234 567 890',
      isDefault: true,
    },
    paymentMethod: 'stripe',
    paymentStatus: 'completed',
    orderStatus: 'shipped',
    subtotal: 899,
    shipping: 0,
    tax: 71.92,
    total: 970.92,
    trackingNumber: 'TRACK123456',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-12'),
  },
  {
    _id: '2',
    userId: '1',
    orderNumber: 'ORD-DEF456',
    items: [
      {
        productId: '2',
        name: 'Modern Pendant Light',
        image: 'https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=200',
        price: 249,
        quantity: 2,
      },
    ],
    shippingAddress: {
      _id: '1',
      label: 'Home',
      firstName: 'John',
      lastName: 'Doe',
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'USA',
      phone: '+1 234 567 890',
      isDefault: true,
    },
    billingAddress: {
      _id: '1',
      label: 'Home',
      firstName: 'John',
      lastName: 'Doe',
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'USA',
      phone: '+1 234 567 890',
      isDefault: true,
    },
    paymentMethod: 'crypto',
    paymentStatus: 'completed',
    orderStatus: 'delivered',
    subtotal: 498,
    shipping: 15,
    tax: 39.84,
    total: 552.84,
    cryptoPayment: {
      currency: 'ETH',
      network: 'ethereum',
      amount: '0.158',
      walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f89Ab7',
      transactionHash: '0x123...abc',
      status: 'confirmed',
    },
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-08'),
  },
];

const tabs = [
  { id: 'orders', label: 'Orders', icon: Package },
  { id: 'wishlist', label: 'Wishlist', icon: Heart },
  { id: 'wallet', label: 'Wallet', icon: Wallet },
  { id: 'addresses', label: 'Addresses', icon: MapPin },
  { id: 'profile', label: 'Profile', icon: User },
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('orders');
  const { user, logout } = useAuthStore();
  const { isConnected, address, balance, connect, disconnect } = useWalletStore();
  const { items: wishlistItems } = useWishlistStore();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    // Simulate fetching orders
    setOrders(sampleOrders);
  }, []);

  const getStatusIcon = (status: Order['orderStatus']) => {
    switch (status) {
      case 'pending':
      case 'confirmed':
      case 'processing':
        return <Clock className="text-yellow-500" size={18} />;
      case 'shipped':
        return <Truck className="text-blue-500" size={18} />;
      case 'delivered':
        return <CheckCircle className="text-green-500" size={18} />;
      default:
        return null;
    }
  };

  const getStatusText = (status: Order['orderStatus']) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Account</h1>
          <p className="text-gray-600">Welcome back, {user?.name || 'Guest'}</p>
        </div>
        <Button variant="outline" onClick={logout} className="flex items-center">
          <LogOut size={18} className="mr-2" />
          Sign Out
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-black text-white'
                    : 'hover:bg-gray-100'
                }`}
              >
                <tab.icon size={20} />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <h2 className="text-xl font-semibold mb-6">Order History</h2>
              {orders.length === 0 ? (
                <div className="text-center py-12 bg-gray-50">
                  <Package size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 mb-4">No orders yet</p>
                  <Link href="/products">
                    <Button>Start Shopping</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order._id}
                      className="border border-gray-200 p-4 hover:border-black transition-colors"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="font-medium">{order.orderNumber}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(order.orderStatus)}
                          <span className="text-sm font-medium">
                            {getStatusText(order.orderStatus)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {order.items.slice(0, 3).map((item, i) => (
                            <div
                              key={i}
                              className="w-16 h-16 bg-gray-100 relative"
                            >
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                          {order.items.length > 3 && (
                            <span className="text-sm text-gray-500">
                              +{order.items.length - 3} more
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${order.total.toFixed(2)}</p>
                          <p className="text-sm text-gray-500">
                            via {order.paymentMethod === 'crypto' ? 'Crypto' : 'Card'}
                          </p>
                        </div>
                      </div>
                      {order.trackingNumber && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-sm">
                            <span className="text-gray-500">Tracking: </span>
                            <span className="font-medium">{order.trackingNumber}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Wishlist Tab */}
          {activeTab === 'wishlist' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <h2 className="text-xl font-semibold mb-6">My Wishlist</h2>
              {wishlistItems.length === 0 ? (
                <div className="text-center py-12 bg-gray-50">
                  <Heart size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 mb-4">Your wishlist is empty</p>
                  <Link href="/products">
                    <Button>Discover Products</Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {wishlistItems.map((product) => (
                    <Link key={product._id} href={`/products/${product._id}`}>
                      <div className="group">
                        <div className="aspect-square bg-gray-100 mb-2 overflow-hidden">
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <p className="font-medium truncate">{product.name}</p>
                        <p className="text-gray-600">${product.price.toFixed(2)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Wallet Tab */}
          {activeTab === 'wallet' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <h2 className="text-xl font-semibold mb-6">Connected Wallet</h2>
              {isConnected ? (
                <div className="bg-gray-50 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full" />
                      <span className="font-medium">Connected</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={disconnect}>
                      Disconnect
                    </Button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Wallet Address</p>
                      <p className="font-mono text-sm break-all">{address}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Balance</p>
                      <p className="text-2xl font-bold">
                        {balance ? parseFloat(balance).toFixed(4) : '0'} ETH
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="font-medium mb-4">Crypto Transactions</h3>
                    {orders.filter((o) => o.paymentMethod === 'crypto').length === 0 ? (
                      <p className="text-gray-500 text-sm">No crypto transactions yet</p>
                    ) : (
                      <div className="space-y-3">
                        {orders
                          .filter((o) => o.paymentMethod === 'crypto')
                          .map((order) => (
                            <div
                              key={order._id}
                              className="flex items-center justify-between p-3 bg-white"
                            >
                              <div>
                                <p className="font-medium">{order.orderNumber}</p>
                                <p className="text-sm text-gray-500">
                                  {order.cryptoPayment?.amount} {order.cryptoPayment?.currency}
                                </p>
                              </div>
                              <a
                                href={`https://etherscan.io/tx/${order.cryptoPayment?.transactionHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm"
                              >
                                View on Etherscan
                              </a>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50">
                  <Wallet size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 mb-4">No wallet connected</p>
                  <Button onClick={connect}>Connect Wallet</Button>
                </div>
              )}
            </motion.div>
          )}

          {/* Addresses Tab */}
          {activeTab === 'addresses' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Saved Addresses</h2>
                <Button size="sm">Add New Address</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Home</span>
                    <span className="text-xs bg-black text-white px-2 py-1">Default</span>
                  </div>
                  <p className="text-gray-600 text-sm">
                    John Doe<br />
                    123 Main Street<br />
                    New York, NY 10001<br />
                    United States<br />
                    +1 234 567 890
                  </p>
                  <div className="mt-4 flex space-x-2">
                    <Button variant="ghost" size="sm">Edit</Button>
                    <Button variant="ghost" size="sm" className="text-red-500">Delete</Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <h2 className="text-xl font-semibold mb-6">Profile Settings</h2>
              <form className="max-w-md space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name</label>
                  <input
                    type="text"
                    defaultValue={user?.name}
                    className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    defaultValue={user?.email}
                    className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="tel"
                    placeholder="+1 234 567 890"
                    className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
                  />
                </div>
                <Button type="submit">Save Changes</Button>
              </form>

              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="font-medium mb-4">Change Password</h3>
                <form className="max-w-md space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Current Password</label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">New Password</label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
                    />
                  </div>
                  <Button type="submit" variant="outline">Update Password</Button>
                </form>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
