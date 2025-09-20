// Payment History page.  Displays a user's transaction or subscription history.
'use client';

import React, { useEffect, useState } from 'react';
import UserPanelLayout from '@/components/UserPanelLayout';
import { transactionsAPI } from '@/lib/api';

interface Transaction {
  id: number;
  amount_cents: number;
  status: string;
  created_at: string;
}

export default function PaymentHistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await transactionsAPI.getAll();
        const data = res.data?.data || [];
        setTransactions(data);
      } catch (err) {
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <UserPanelLayout>
      <div>
        <h1 className="text-2xl font-bold mb-4">Payment History</h1>
        {loading ? (
          <p>Loading...</p>
        ) : transactions.length === 0 ? (
          <p>
            You currently have no transactions. Once payments are implemented,
            they will appear here.
          </p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  #
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((t, idx) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm text-gray-500">{idx + 1}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">{(t.amount_cents/100).toLocaleString()} ₫</td>
                  <td className="px-4 py-2 text-sm text-gray-900 capitalize">
                    {t.status}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {new Date(t.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </UserPanelLayout>
  );
}
