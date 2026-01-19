import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/lib/models/Order';

const CRYPTO_RECEIVING_WALLET = process.env.CRYPTO_RECEIVING_WALLET || '0x742d35Cc6634C0532925a3b844Bc9e7595f89Ab7';

const ETH_PRICE_USD = 3500; // In production, fetch from CoinGecko/CoinMarketCap API

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { orderId, currency, network, totalUSD } = await request.json();

    if (!orderId || !currency || !network || !totalUSD) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate crypto amount based on currency
    let cryptoAmount: string;
    switch (currency) {
      case 'ETH':
        cryptoAmount = (totalUSD / ETH_PRICE_USD).toFixed(8);
        break;
      case 'USDT':
      case 'USDC':
        cryptoAmount = totalUSD.toFixed(2);
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Unsupported currency' },
          { status: 400 }
        );
    }

    // Update order with crypto payment details
    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        paymentMethod: 'crypto',
        cryptoPayment: {
          currency,
          network,
          amount: cryptoAmount,
          walletAddress: CRYPTO_RECEIVING_WALLET,
          status: 'pending',
        },
      },
      { new: true }
    );

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        orderId: order._id,
        paymentDetails: {
          currency,
          network,
          amount: cryptoAmount,
          walletAddress: CRYPTO_RECEIVING_WALLET,
        },
      },
    });
  } catch (error) {
    console.error('Crypto checkout error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process crypto payment' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const { orderId, transactionHash } = await request.json();

    if (!orderId || !transactionHash) {
      return NextResponse.json(
        { success: false, error: 'Missing order ID or transaction hash' },
        { status: 400 }
      );
    }

    // In production, verify the transaction on-chain using ethers.js
    // For now, we'll just update the order

    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        'cryptoPayment.transactionHash': transactionHash,
        'cryptoPayment.status': 'confirmed',
        paymentStatus: 'completed',
        orderStatus: 'confirmed',
      },
      { new: true }
    );

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Error confirming crypto payment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to confirm payment' },
      { status: 500 }
    );
  }
}
