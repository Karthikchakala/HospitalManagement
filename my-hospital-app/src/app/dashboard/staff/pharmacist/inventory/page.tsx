"use client";
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import DashboardNavbar from "../../../../../components/DashboardNavbar";
const BASE = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || process.env.NEXT_PUBLIC_BACKEND_BASE_URL;

type Item = {
  pharmacy_id: number;
  medicine_details: string;
  quantity: number;
  price: number;
};

interface MedicineDetails {
  name?: string;
  text?: string;
  details?: string;
  category?: string;
  expiry_date?: string;
  batch_number?: string;
}

const currency = (n: number) => `₹${(n || 0).toFixed(2)}`;
const parseDetails = (raw: string | null | undefined): MedicineDetails => {
  if (!raw) return {};
  try { const obj = JSON.parse(raw); return obj && typeof obj === 'object' ? obj : { text: raw }; } catch { return { text: raw }; }
};
const getName = (i: Item) => {
  const d = parseDetails(i.medicine_details);
  return (d.name || d.text || '').toString();
};
const getCategory = (i: Item) => {
  const d = parseDetails(i.medicine_details);
  return (d.category || '').toString();
};
const getExpiry = (i: Item) => {
  const d = parseDetails(i.medicine_details);
  return (d.expiry_date || '').toString();
};
const isExpired = (dateStr: string) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return d < today;
};
const isExpiringSoon = (dateStr: string, days = 30) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  const soon = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return d >= now && d <= soon;
};

export default function PharmacistInventoryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<"medicine_details" | "price" | "quantity">("medicine_details");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", details: "", batch_number: "", expiry_date: "", category: "", quantity: "", price: "" });
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [filters, setFilters] = useState({ category: "", stock: "all" as 'all' | 'low' | 'in', expiry: "all" as 'all' | 'expired' | 'soon' });

  const fetchAll = async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await axios.get(`${BASE}/api/staff/inventory`);
      if (data?.success) setItems(data.data || []);
      else setError(data?.message || "Failed to fetch");
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        setError(e.response?.data?.message || e.message || "Failed to fetch");
      } else if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Failed to fetch");
      }
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach(i => { const c = getCategory(i); if (c) set.add(c); });
    return Array.from(set).sort();
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let out = items.filter(i => {
      const name = getName(i).toLowerCase();
      const details = parseDetails(i.medicine_details).details?.toLowerCase?.() || '';
      const matchSearch = !q || name.includes(q) || details.includes(q);
      const cat = getCategory(i);
      const matchCat = !filters.category || cat === filters.category;
      const qty = Number(i.quantity) || 0;
      const matchStock = filters.stock === 'all' || (filters.stock === 'low' ? qty < 10 : qty >= 10);
      const exp = getExpiry(i);
      const matchExpiry = filters.expiry === 'all' || (filters.expiry === 'expired' ? isExpired(exp) : isExpiringSoon(exp));
      return matchSearch && matchCat && matchStock && matchExpiry;
    });
    out = out.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "medicine_details") {
        return (getName(a).localeCompare(getName(b))) * dir;
      } else if (sortKey === "price") {
        return ((a.price || 0) - (b.price || 0)) * dir;
      } else {
        return ((a.quantity || 0) - (b.quantity || 0)) * dir;
      }
    });
    return out;
  }, [items, search, sortKey, sortDir, filters]);

  const totals = useMemo(() => {
    const count = items.length;
    const value = items.reduce((acc, i) => acc + (Number(i.quantity) || 0) * (Number(i.price) || 0), 0);
    return { count, value };
  }, [items]);

  const addMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        details: form.details,
        batch_number: form.batch_number,
        expiry_date: form.expiry_date,
        category: form.category,
        quantity: Number(form.quantity || 0),
        price: Number(form.price || 0),
      };
      const { data } = await axios.post(`${BASE}/api/staff/inventory`, payload);
      if (data?.success) {
        setShowAdd(false);
        setForm({ name: "", details: "", batch_number: "", expiry_date: "", category: "", quantity: "", price: "" });
        await fetchAll();
        alert("Medicine added");
      } else {
        alert(data?.message || "Failed to add");
      }
    } catch (e: unknown) {
      const msg = axios.isAxiosError(e) ? e.response?.data?.message || e.message : (e instanceof Error ? e.message : "Failed to add");
      alert(msg);
    }
  };

  const updateField = async (id: number, patch: Partial<Item>) => {
    try {
      const { data } = await axios.put(`${BASE}/api/staff/inventory/${id}`, patch);
      if (data?.success) {
        setItems(prev => prev.map(i => i.pharmacy_id === id ? { ...i, ...data.data } : i));
      } else {
        alert(data?.message || "Update failed");
      }
    } catch (e: unknown) {
      const msg = axios.isAxiosError(e) ? e.response?.data?.message || e.message : (e instanceof Error ? e.message : "Update failed");
      alert(msg);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this medicine?")) return;
    try {
      const { data } = await axios.delete(`${BASE}/api/staff/inventory/${id}`);
      if (data?.success) {
        setItems(prev => prev.filter(i => i.pharmacy_id !== id));
      } else {
        alert(data?.message || "Delete failed");
      }
    } catch (e: unknown) {
      const msg = axios.isAxiosError(e) ? e.response?.data?.message || e.message : (e instanceof Error ? e.message : "Delete failed");
      alert(msg);
    }
  };

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Inventory", href: "/dashboard/staff/pharmacist/inventory" },
    { name: "Dispensary", href: "/dashboard/staff/pharmacist/dispensary-management" },
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900">
      <DashboardNavbar title="Pharmacist" navLinks={navLinks} userName="Pharmacist" />
      <main className="relative z-10 mx-auto max-w-6xl p-4 sm:p-6 pt-24">
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-xs text-slate-500">Total Medicines</div>
            <div className="text-2xl font-semibold text-slate-800">{totals.count}</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-xs text-slate-500">Total Inventory Value</div>
            <div className="text-2xl font-semibold text-slate-800">{currency(totals.value)}</div>
          </div>
          <div className="flex items-center gap-2">
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              placeholder="Search medicines..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              className="rounded-md bg-sky-600 px-3 py-2 text-white text-sm hover:bg-sky-700"
              onClick={() => setShowAdd(true)}
            >
              + Add Medicine
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-2 items-center">
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
            value={filters.category}
            onChange={(e) => setFilters(f => ({ ...f, category: e.target.value }))}
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
            value={filters.stock}
            onChange={(e) => setFilters(f => ({ ...f, stock: e.target.value as 'all' | 'low' | 'in' }))}
          >
            <option value="all">All Stock</option>
            <option value="low">Low Stock (&lt; 10)</option>
            <option value="in">In Stock (≥ 10)</option>
          </select>
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
            value={filters.expiry}
            onChange={(e) => setFilters(f => ({ ...f, expiry: e.target.value as 'all' | 'expired' | 'soon' }))}
          >
            <option value="all">All Expiry</option>
            <option value="expired">Expired</option>
            <option value="soon">Expiring Soon (30d)</option>
          </select>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-slate-600">
                <th className="px-3 py-2 cursor-pointer" onClick={() => { setSortKey("medicine_details"); setSortDir(sortDir === "asc" ? "desc" : "asc"); }}>Medicine</th>
                <th className="px-3 py-2 cursor-pointer" onClick={() => { setSortKey("quantity"); setSortDir(sortDir === "asc" ? "desc" : "asc"); }}>Quantity</th>
                <th className="px-3 py-2 cursor-pointer" onClick={() => { setSortKey("price"); setSortDir(sortDir === "asc" ? "desc" : "asc"); }}>Price/Unit</th>
                <th className="px-3 py-2">Total Value</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td className="px-3 py-3 text-slate-500" colSpan={5}>Loading...</td></tr>
              )}
              {error && !loading && (
                <tr><td className="px-3 py-3 text-red-600" colSpan={5}>{error}</td></tr>
              )}
              {!loading && !error && filtered.map((i) => {
                const low = (Number(i.quantity) || 0) < 10;
                const d = parseDetails(i.medicine_details);
                const name = d.name || d.text || '';
                const cat = d.category || '';
                const batch = d.batch_number || '';
                const exp = d.expiry_date || '';
                const expired = isExpired(exp);
                const expSoon = isExpiringSoon(exp);
                return (
                  <tr key={i.pharmacy_id} className={low ? "bg-red-50" : ""}>
                    <td className="px-3 py-2 text-slate-800">
                      <div className="font-medium">{name}</div>
                      <div className="text-xs text-slate-500">{d.details || ''}</div>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs">
                        {cat && <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-700">{cat}</span>}
                        {batch && <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-700">Batch: {batch}</span>}
                        {exp && (
                          <span className={`rounded px-2 py-0.5 ${expired ? 'bg-red-100 text-red-700' : expSoon ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-700'}`}>
                            Exp: {exp}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        className={`w-24 rounded-md border px-2 py-1 text-slate-800 ${low ? 'border-red-300 focus:ring-red-200' : 'border-slate-300 focus:ring-sky-200'} focus:outline-none focus:ring-2`}
                        value={i.quantity}
                        min={0}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value));
                          setItems(prev => prev.map(x => x.pharmacy_id === i.pharmacy_id ? { ...x, quantity: val } : x));
                        }}
                        onBlur={() => updateField(i.pharmacy_id, { quantity: i.quantity })}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        className="w-28 rounded-md border border-slate-300 px-2 py-1 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-200"
                        value={i.price}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value));
                          setItems(prev => prev.map(x => x.pharmacy_id === i.pharmacy_id ? { ...x, price: val } : x));
                        }}
                        onBlur={() => updateField(i.pharmacy_id, { price: i.price })}
                      />
                    </td>
                    <td className="px-3 py-2 text-slate-800">{currency((Number(i.quantity) || 0) * (Number(i.price) || 0))}</td>
                    <td className="px-3 py-2">
                      <button className="mr-2 text-sky-700 hover:underline" title="Edit" onClick={() => { setEditItem(i); }}>✏️</button>
                      <button className="text-red-600 hover:underline" title="Delete" onClick={() => remove(i.pharmacy_id)}>🗑 Delete</button>
                    </td>
                  </tr>
                );
              })}
              {!loading && !error && filtered.length === 0 && (
                <tr><td className="px-3 py-3 text-slate-500" colSpan={5}>No medicines found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {showAdd && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
            <div className="w-[92%] max-w-lg rounded-lg bg-white p-5 shadow-xl ring-1 ring-slate-200">
              <h3 className="mb-3 text-lg font-semibold text-slate-800">Add Medicine</h3>
              <form onSubmit={addMedicine} className="space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                    <input className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-200" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                    <input className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-200" value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Details / Description</label>
                  <textarea className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-200" rows={3} value={form.details} onChange={(e) => setForm(f => ({ ...f, details: e.target.value }))} />
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Batch Number</label>
                    <input className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-200" value={form.batch_number} onChange={(e) => setForm(f => ({ ...f, batch_number: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date</label>
                    <input type="date" className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-200" value={form.expiry_date} onChange={(e) => setForm(f => ({ ...f, expiry_date: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                    <input
                      type="number"
                      min={0}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-200"
                      value={form.quantity}
                      onChange={(e) => setForm(f => ({ ...f, quantity: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Price</label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-200"
                      value={form.price}
                      onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button type="button" onClick={() => setShowAdd(false)} className="rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100">Cancel</button>
                  <button type="submit" className="rounded-md bg-sky-600 px-3 py-2 text-white hover:bg-sky-700">Add</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit modal */}
        {editItem && (() => {
          const d = parseDetails(editItem.medicine_details); return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
              <div className="w-[92%] max-w-lg rounded-lg bg-white p-5 shadow-xl ring-1 ring-slate-200">
                <h3 className="mb-3 text-lg font-semibold text-slate-800">Edit Medicine</h3>
                <form onSubmit={async (e) => {
                  e.preventDefault(); try {
                    const formData = new FormData(e.currentTarget);
                    const payload = {
                      name: formData.get("name") as string,
                      details: formData.get("details") as string,
                      batch_number: formData.get("batch_number") as string,
                      expiry_date: formData.get("expiry_date") as string,
                      category: formData.get("category") as string,
                    };
                    const { data } = await axios.put(`${BASE}/api/staff/inventory/${editItem.pharmacy_id}`, payload);
                    if (data?.success) { setEditItem(null); await fetchAll(); alert('Updated'); } else { alert(data?.message || 'Update failed'); }
                  } catch (err: unknown) {
                    const msg = axios.isAxiosError(err) ? err.response?.data?.message || err.message : (err instanceof Error ? err.message : 'Update failed');
                    alert(msg);
                  }
                }} className="space-y-3">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                      <input name="name" defaultValue={d.name || ''} className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-200" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                      <input name="category" defaultValue={d.category || ''} className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-200" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Details / Description</label>
                    <textarea name="details" defaultValue={d.details || ''} className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-200" rows={3} />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Batch Number</label>
                      <input name="batch_number" defaultValue={d.batch_number || ''} className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-200" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date</label>
                      <input name="expiry_date" type="date" defaultValue={d.expiry_date || ''} className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-200" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button type="button" onClick={() => setEditItem(null)} className="rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100">Cancel</button>
                    <button type="submit" className="rounded-md bg-sky-600 px-3 py-2 text-white hover:bg-sky-700">Save</button>
                  </div>
                </form>
              </div>
            </div>
          );
        })()}
      </main>
    </div>
  );
}
