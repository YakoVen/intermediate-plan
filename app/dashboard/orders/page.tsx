'use client';

import OrderTable from '@/components/dashboard/order-table';

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des commandes</h1>
      </div>
      <OrderTable />
    </div>
  );
}
