import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { orderTotal } = await request.json();

    // In a real scenario, fetch active discounts from Firestore.
    // For now, returning a dummy calculated discount if total > 5000.
    let discount = null;
    let savings = 0;

    if (orderTotal >= 5000) {
      discount = {
        id: '1',
        name: 'Soldes d\'été',
        type: 'percentage',
        value: 10
      };
      savings = orderTotal * 0.10;
    } else if (orderTotal >= 10000) {
      discount = {
        id: '2',
        name: 'Livraison gratuite',
        type: 'free_shipping',
        value: 0
      };
      savings = 0; // Handled dynamically in frontend
    }

    return NextResponse.json({ discount, savings });
  } catch (error) {
    console.error('Discount API Error:', error);
    return NextResponse.json({ error: 'Failed to calculate discount' }, { status: 500 });
  }
}
