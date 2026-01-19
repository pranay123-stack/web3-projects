'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  TrendingUp,
  BarChart3,
  Eye,
  Edit,
  Trash2,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

// Sample analytics data
const stats = [
  { label: 'Total Revenue', value: '$45,231', change: '+12.5%', icon: DollarSign },
  { label: 'Orders', value: '356', change: '+8.2%', icon: ShoppingCart },
  { label: 'Products', value: '124', change: '+3', icon: Package },
  { label: 'Customers', value: '1,234', change: '+18.7%', icon: Users },
];

const recentOrders = [
  { id: 'ORD-001', customer: 'John Doe', total: 899, status: 'shipped', date: '2024-01-15' },
  { id: 'ORD-002', customer: 'Jane Smith', total: 1249, status: 'processing', date: '2024-01-15' },
  { id: 'ORD-003', customer: 'Bob Wilson', total: 459, status: 'delivered', date: '2024-01-14' },
  { id: 'ORD-004', customer: 'Alice Brown', total: 789, status: 'pending', date: '2024-01-14' },
  { id: 'ORD-005', customer: 'Chris Lee', total: 1599, status: 'shipped', date: '2024-01-13' },
];

const topProducts = [
  { name: 'Scandi Oak Dining Table', sales: 45, revenue: 40455 },
  { name: 'Velvet Sofa - Forest Green', sales: 32, revenue: 47968 },
  { name: 'Modern Pendant Light', sales: 89, revenue: 22161 },
  { name: 'Minimalist Bookshelf', sales: 56, revenue: 25144 },
];

const tabs = ['overview', 'products', 'orders', 'analytics'];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('overview');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your store</p>
        </div>
        <Button>
          <Plus size={18} className="mr-2" />
          Add Product
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-8 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'border-b-2 border-black text-black'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-white border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <stat.icon className="text-gray-600" size={24} />
                  <span className="text-sm text-green-600 font-medium">{stat.change}</span>
                </div>
                <p className="text-2xl font-bold mb-1">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Charts and Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Orders */}
            <div className="bg-white border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Recent Orders</h2>
                <Button variant="ghost" size="sm">View All</Button>
              </div>
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                  >
                    <div>
                      <p className="font-medium">{order.id}</p>
                      <p className="text-sm text-gray-500">{order.customer}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${order.total}</p>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Products */}
            <div className="bg-white border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Top Products</h2>
                <Button variant="ghost" size="sm">View All</Button>
              </div>
              <div className="space-y-4">
                {topProducts.map((product, i) => (
                  <div
                    key={product.name}
                    className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium">
                        {i + 1}
                      </span>
                      <p className="font-medium">{product.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${product.revenue.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">{product.sales} sales</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Revenue Chart Placeholder */}
          <div className="mt-8 bg-white border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-6">Revenue Overview</h2>
            <div className="h-64 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <BarChart3 size={48} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">Revenue chart will be displayed here</p>
                <p className="text-sm text-gray-400">Integrate with chart library (recharts, chart.js)</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="bg-white border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <input
                type="text"
                placeholder="Search products..."
                className="px-4 py-2 border border-gray-300 focus:outline-none focus:border-black w-64"
              />
              <div className="flex items-center space-x-2">
                <select className="px-4 py-2 border border-gray-300 focus:outline-none focus:border-black">
                  <option>All Categories</option>
                  <option>Furniture</option>
                  <option>Lighting</option>
                  <option>Décor</option>
                </select>
              </div>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium">Product</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Category</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Price</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Stock</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Scandi Oak Dining Table', category: 'Furniture', price: 899, stock: 15 },
                  { name: 'Modern Pendant Light', category: 'Lighting', price: 249, stock: 25 },
                  { name: 'Velvet Sofa - Forest Green', category: 'Furniture', price: 1499, stock: 8 },
                  { name: 'Ceramic Table Lamp', category: 'Lighting', price: 159, stock: 30 },
                  { name: 'Minimalist Bookshelf', category: 'Furniture', price: 449, stock: 12 },
                ].map((product) => (
                  <tr key={product.name} className="border-b border-gray-100">
                    <td className="px-4 py-4">{product.name}</td>
                    <td className="px-4 py-4">{product.category}</td>
                    <td className="px-4 py-4">${product.price}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          product.stock > 10
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {product.stock} in stock
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <Eye size={18} className="text-gray-500" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <Edit size={18} className="text-gray-500" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <Trash2 size={18} className="text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="bg-white border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <input
                type="text"
                placeholder="Search orders..."
                className="px-4 py-2 border border-gray-300 focus:outline-none focus:border-black w-64"
              />
              <div className="flex items-center space-x-2">
                <select className="px-4 py-2 border border-gray-300 focus:outline-none focus:border-black">
                  <option>All Status</option>
                  <option>Pending</option>
                  <option>Processing</option>
                  <option>Shipped</option>
                  <option>Delivered</option>
                </select>
              </div>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium">Order ID</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Customer</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Date</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Total</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-100">
                    <td className="px-4 py-4 font-medium">{order.id}</td>
                    <td className="px-4 py-4">{order.customer}</td>
                    <td className="px-4 py-4">{order.date}</td>
                    <td className="px-4 py-4">${order.total}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <Eye size={18} className="text-gray-500" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <Edit size={18} className="text-gray-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Sales by Category</h2>
              <div className="h-64 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <TrendingUp size={48} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500">Pie chart placeholder</p>
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Payment Methods</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Card (Stripe)</span>
                    <span>65%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded">
                    <div className="h-2 bg-black rounded" style={{ width: '65%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Crypto (ETH)</span>
                    <span>25%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded">
                    <div className="h-2 bg-blue-500 rounded" style={{ width: '25%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Crypto (USDT/USDC)</span>
                    <span>10%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded">
                    <div className="h-2 bg-green-500 rounded" style={{ width: '10%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-white border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Monthly Revenue</h2>
            <div className="h-64 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <BarChart3 size={48} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">Line chart placeholder</p>
                <p className="text-sm text-gray-400">Total Revenue: $245,432</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
