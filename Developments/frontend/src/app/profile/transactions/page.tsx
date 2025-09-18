"use client";

import { useEffect, useState } from "react";
import { transactionsAPI } from "@/lib/api"; // bạn sẽ thêm API này

export default function TransactionPage() {
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    transactionsAPI.getAll().then((res) => {
      setTransactions(res.data.data || []);
    });
  }, []);

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Transaction History</h1>

      {/* Ô search */}
      <input
        type="text"
        placeholder="Search by transaction ID"
        className="border w-full p-2 mb-4 rounded"
      />

      <div className="space-y-4">
        {transactions.length === 0 && <p>No transactions found.</p>}

        {transactions.map((txn) => (
          <div
            key={txn.id}
            className="border p-4 rounded shadow-sm bg-white space-y-1"
          >
            <p>
              <b>Transaction ID:</b> {txn.id}
            </p>
            <p>
              <b>Order ID:</b> {txn.order_id}
            </p>
            <p>
              <b>Amount:</b> {txn.amount_cents / 100} VND
            </p>
            <p>
              <b>Method:</b> {txn.provider}
            </p>
            <p>
              <b>Status:</b>{" "}
              <span
                className={`px-2 py-1 rounded text-sm ${
                  txn.status === "success"
                    ? "bg-green-100 text-green-700"
                    : txn.status === "pending"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {txn.status}
              </span>
            </p>
            <p>
              <b>Date:</b>{" "}
              {new Date(txn.created_at).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
