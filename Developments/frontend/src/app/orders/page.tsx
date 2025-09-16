// 'use client';

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import axios from "axios";

// // --- Interfaces ---
// interface Product {
//   id: number;
//   title: string;
//   price_cents: number;
// }

// interface OrderItem {
//   id: number;
//   quantity: number;
//   unit_price_cents: number;
//   product: Product;
// }

// interface Order {
//   id: number;
//   status: string;
//   total_cents: number;
//   items: OrderItem[];
// }

// // --- Axios setup ---
// axios.defaults.baseURL = "http://localhost:8000/api/v1";
// axios.defaults.withCredentials = true; // Gửi cookie sang backend

// export default function OrdersPage() {
//   const router = useRouter();
//   const [order, setOrder] = useState<Order | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [actionLoading, setActionLoading] = useState(false); // loading khi update/delete

//   // --- Fetch order khi component mount ---
//   useEffect(() => {
//     fetchOrder();
//   }, []);

//   const fetchOrder = async () => {
//     setLoading(true);
//     try {
//       const res = await axios.get("/orders");
//       setOrder(res.data?.data ?? null);
//     } catch (err: any) {
//       console.error("Fetch Order Error:", err);
//       if (err.response?.status === 401) {
//         router.push("/auth/login"); // redirect nếu chưa login
//       } else {
//         setOrder(null);
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   // --- Update quantity ---
//   const updateQuantity = async (itemId: number, newQty: number) => {
//     if (!order) return;
//     setActionLoading(true);

//     try {
//       if (newQty < 1) {
//         await deleteItem(itemId);
//         return;
//       }

//       await axios.put(`/orders/items/${itemId}`, { quantity: newQty });
//       fetchOrder();
//     } catch (err: any) {
//       console.error("Update Error:", err);
//       if (err.response?.status === 401) router.push("/auth/login");
//     } finally {
//       setActionLoading(false);
//     }
//   };

//   // --- Delete item ---
//   const deleteItem = async (itemId: number) => {
//     if (!order) return;
//     setActionLoading(true);

//     try {
//       await axios.delete(`/orders/items/${itemId}`);
//       fetchOrder();
//     } catch (err: any) {
//       console.error("Delete Error:", err);
//       if (err.response?.status === 401) router.push("/auth/login");
//     } finally {
//       setActionLoading(false);
//     }
//   };

//   // --- Loading / Empty state ---
//   if (loading) return <p>Loading...</p>;
//   if (!order || !order.items || order.items.length === 0)
//     return <p>No pending order found.</p>;

//   // --- Tổng tiền ---
//   const total = order.items.reduce(
//     (sum, item) => sum + item.unit_price_cents * item.quantity,
//     0
//   );

//   return (
//     <div style={{ padding: "2rem" }}>
//       <h1>Cart / Pending Order</h1>
//       <p>Status: {order.status}</p>
//       {actionLoading && <p>Updating...</p>}
//       <div>
//         {order.items.map((item) => (
//           <div
//             key={item.id}
//             style={{
//               display: "flex",
//               justifyContent: "space-between",
//               marginBottom: "1rem",
//               padding: "0.5rem",
//               border: "1px solid #ccc",
//               borderRadius: "8px",
//             }}
//           >
//             <div>
//               <strong>{item.product?.title ?? "No Product Name"}</strong>
//               <div style={{ marginTop: "0.5rem" }}>
//                 <button
//                   onClick={() =>
//                     updateQuantity(item.id, item.quantity - 1)
//                   }
//                   disabled={actionLoading}
//                 >
//                   -
//                 </button>
//                 <span style={{ margin: "0 0.5rem" }}>{item.quantity}</span>
//                 <button
//                   onClick={() =>
//                     updateQuantity(item.id, item.quantity + 1)
//                   }
//                   disabled={actionLoading}
//                 >
//                   +
//                 </button>
//               </div>
//             </div>
//             <div>
//               <span>{item.unit_price_cents} cents</span>
//               <button
//                 onClick={() => deleteItem(item.id)}
//                 disabled={actionLoading}
//                 style={{
//                   marginLeft: "1rem",
//                   backgroundColor: "red",
//                   color: "white",
//                   border: "none",
//                   padding: "0.3rem 0.5rem",
//                   borderRadius: "4px",
//                 }}
//               >
//                 X
//               </button>
//             </div>
//           </div>
//         ))}
//       </div>
//       <p>
//         <strong>Total: {total} cents</strong>
//       </p>
//     </div>
//   );
// }



'use client';

import { useEffect, useState } from "react";
import axios from "axios";

// --- Interfaces ---
interface Product {
  id: number;
  title: string;
  price_cents: number;
}

interface OrderItem {
  id: number;
  quantity: number;
  unit_price_cents: number;
  product: Product;
}

interface Order {
  id: number;
  status: string;
  total_cents: number;
  items: OrderItem[];
}

// --- Axios setup ---
axios.defaults.baseURL = "http://localhost:8000/api/v1";

export default function OrdersPage() {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, []);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/orders"); // không cần withCredentials
      setOrder(res.data?.data ?? null);
    } catch (err) {
      console.error("Fetch Order Error:", err);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: number, newQty: number) => {
    if (!order) return;
    setActionLoading(true);

    try {
      if (newQty < 1) {
        await deleteItem(itemId);
        return;
      }

      await axios.put(`/orders/items/${itemId}`, { quantity: newQty }); // không cần cookie
      fetchOrder();
    } catch (err) {
      console.error("Update Error:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const deleteItem = async (itemId: number) => {
    if (!order) return;
    setActionLoading(true);

    try {
      await axios.delete(`/orders/items/${itemId}`); // không cần cookie
      fetchOrder();
    } catch (err) {
      console.error("Delete Error:", err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!order || !order.items || order.items.length === 0)
    return <p>No pending order found.</p>;

  const total = order.items.reduce(
    (sum, item) => sum + item.unit_price_cents * item.quantity,
    0
  );

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Cart / Pending Order</h1>
      <p>Status: {order.status}</p>
      {actionLoading && <p>Updating...</p>}
      <div>
        {order.items.map((item) => (
          <div
            key={item.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "1rem",
              padding: "0.5rem",
              border: "1px solid #ccc",
              borderRadius: "8px",
            }}
          >
            <div>
              <strong>{item.product?.title ?? "No Product Name"}</strong>
              <div style={{ marginTop: "0.5rem" }}>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  disabled={actionLoading}
                >
                  -
                </button>
                <span style={{ margin: "0 0.5rem" }}>{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  disabled={actionLoading}
                >
                  +
                </button>
              </div>
            </div>
            <div>
              <span>{item.unit_price_cents} cents</span>
              <button
                onClick={() => deleteItem(item.id)}
                disabled={actionLoading}
                style={{
                  marginLeft: "1rem",
                  backgroundColor: "red",
                  color: "white",
                  border: "none",
                  padding: "0.3rem 0.5rem",
                  borderRadius: "4px",
                }}
              >
                X
              </button>
            </div>
          </div>
        ))}
      </div>
      <p>
        <strong>Total: {total} cents</strong>
      </p>
    </div>
  );
}
