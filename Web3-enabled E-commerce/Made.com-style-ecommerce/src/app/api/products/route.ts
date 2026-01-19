import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/lib/models/Product';
import type { ProductFilters } from '@/types';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const filters: ProductFilters = {
      category: searchParams.get('category') || undefined,
      subcategory: searchParams.get('subcategory') || undefined,
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      colors: searchParams.get('colors')?.split(',') || undefined,
      materials: searchParams.get('materials')?.split(',') || undefined,
      inStock: searchParams.get('inStock') === 'true' || undefined,
      sortBy: (searchParams.get('sortBy') as ProductFilters['sortBy']) || undefined,
      search: searchParams.get('search') || undefined,
      page: Number(searchParams.get('page')) || 1,
      limit: Number(searchParams.get('limit')) || 12,
    };

    // Build query
    const query: Record<string, unknown> = {};

    if (filters.category) query.category = filters.category;
    if (filters.subcategory) query.subcategory = filters.subcategory;
    if (filters.minPrice || filters.maxPrice) {
      query.price = {};
      if (filters.minPrice) (query.price as Record<string, number>).$gte = filters.minPrice;
      if (filters.maxPrice) (query.price as Record<string, number>).$lte = filters.maxPrice;
    }
    if (filters.colors?.length) query.colors = { $in: filters.colors };
    if (filters.materials?.length) query.materials = { $in: filters.materials };
    if (filters.inStock) query.stock = { $gt: 0 };
    if (filters.search) {
      query.$text = { $search: filters.search };
    }

    // Build sort
    let sort: Record<string, 1 | -1> = { createdAt: -1 };
    switch (filters.sortBy) {
      case 'price-asc':
        sort = { price: 1 };
        break;
      case 'price-desc':
        sort = { price: -1 };
        break;
      case 'newest':
        sort = { createdAt: -1 };
        break;
      case 'popular':
        sort = { featured: -1, createdAt: -1 };
        break;
    }

    const page = filters.page || 1;
    const limit = filters.limit || 12;
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(query).sort(sort).skip(skip).limit(limit).lean(),
      Product.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const product = await Product.create(body);

    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
