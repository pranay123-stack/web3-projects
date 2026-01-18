import Link from 'next/link';
import { Facebook, Instagram, Twitter, Youtube } from 'lucide-react';

const footerLinks = {
  shop: [
    { name: 'Furniture', href: '/categories/furniture' },
    { name: 'Lighting', href: '/categories/lighting' },
    { name: 'Décor', href: '/categories/decor' },
    { name: 'Outdoor', href: '/categories/outdoor' },
    { name: 'Sale', href: '/categories/sale' },
  ],
  help: [
    { name: 'Contact Us', href: '/contact' },
    { name: 'FAQs', href: '/faqs' },
    { name: 'Shipping', href: '/shipping' },
    { name: 'Returns', href: '/returns' },
    { name: 'Track Order', href: '/track-order' },
  ],
  about: [
    { name: 'Our Story', href: '/about' },
    { name: 'Sustainability', href: '/sustainability' },
    { name: 'Careers', href: '/careers' },
    { name: 'Press', href: '/press' },
  ],
};

export function Footer() {
  return (
    <footer className="bg-gray-100 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="text-2xl font-bold tracking-tight">
              MADE
            </Link>
            <p className="mt-4 text-gray-600 max-w-sm">
              Designer furniture and home accessories, directly from the makers. Quality design, exceptional value.
            </p>
            <div className="mt-6">
              <p className="text-sm font-medium mb-2">We accept crypto payments</p>
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <span className="px-2 py-1 bg-white rounded">ETH</span>
                <span className="px-2 py-1 bg-white rounded">USDT</span>
                <span className="px-2 py-1 bg-white rounded">USDC</span>
              </div>
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h3 className="font-medium mb-4">Shop</h3>
            <ul className="space-y-2">
              {footerLinks.shop.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-gray-600 hover:text-black transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help Links */}
          <div>
            <h3 className="font-medium mb-4">Help</h3>
            <ul className="space-y-2">
              {footerLinks.help.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-gray-600 hover:text-black transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About Links */}
          <div>
            <h3 className="font-medium mb-4">About</h3>
            <ul className="space-y-2">
              {footerLinks.about.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-gray-600 hover:text-black transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-12 pt-8 border-t border-gray-300">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-4 md:mb-0">
              <h3 className="font-medium mb-2">Subscribe to our newsletter</h3>
              <p className="text-sm text-gray-600">Get exclusive offers and design inspiration</p>
            </div>
            <form className="flex">
              <input
                type="email"
                placeholder="Enter your email"
                className="px-4 py-3 border border-gray-300 focus:outline-none focus:border-black w-64"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-black text-white font-medium hover:bg-gray-800 transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-gray-300 flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <a href="#" className="text-gray-600 hover:text-black transition-colors">
              <Facebook size={20} />
            </a>
            <a href="#" className="text-gray-600 hover:text-black transition-colors">
              <Instagram size={20} />
            </a>
            <a href="#" className="text-gray-600 hover:text-black transition-colors">
              <Twitter size={20} />
            </a>
            <a href="#" className="text-gray-600 hover:text-black transition-colors">
              <Youtube size={20} />
            </a>
          </div>
          <div className="text-sm text-gray-600">
            <p>&copy; {new Date().getFullYear()} MADE. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
