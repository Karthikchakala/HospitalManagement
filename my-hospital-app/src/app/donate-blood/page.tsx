"use client";
import React, { useState } from "react";

const BLOOD_GROUPS = [
  "A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"
];

export default function DonateBloodPage() {
  const [form, setForm] = useState({
    name: "",
    age: "",
    group: "",
    phone: "",
    city: "",
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Donor Registration:", form);
    alert("Thank you for registering!");
    setForm({ name: "", age: "", group: "", phone: "", city: "" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-red-200 p-4 sm:p-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-red-800 mb-2 text-center drop-shadow-sm">
          Donate Blood — Save Lives
        </h1>
        <p className="text-red-900 mb-2 text-center">
          Every unit of blood can make the difference between life and loss. Your generosity helps trauma patients,
          newborns, cancer warriors, and those in critical care.
        </p>
        <p className="text-red-900 mb-4 text-center">
          Healthy adults aged 18–65 can typically donate every 3 months. It takes just a few minutes to become a lifesaver.
        </p>
        <blockquote className="mb-6 rounded-lg border-l-4 border-red-600 bg-red-100 p-3 text-red-800 text-sm text-center shadow-sm">
          “A single pint can save three lives. A single gesture can create a million smiles.”
        </blockquote>

        <form onSubmit={submit} className="space-y-4 rounded-xl border border-red-200 p-6 sm:p-8 shadow-lg bg-white">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-red-800 mb-1">Name</label>
              <input
                className="w-full rounded-md border border-red-200 bg-red-50 text-red-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-300"
                value={form.name}
                onChange={(e)=>setForm(f=>({...f, name: e.target.value}))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-red-800 mb-1">Age</label>
              <input
                type="number"
                min={18}
                max={65}
                className="w-full rounded-md border border-red-200 bg-red-50 text-red-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-300"
                value={form.age}
                onChange={(e)=>setForm(f=>({...f, age: e.target.value}))}
                required
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-red-800 mb-1">Blood Group</label>
              <select
                className="w-full rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-900 focus:outline-none focus:ring-2 focus:ring-red-300"
                value={form.group}
                onChange={(e)=>setForm(f=>({...f, group: e.target.value}))}
                required
              >
                <option value="">Select</option>
                {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-red-800 mb-1">Contact Number</label>
              <input
                className="w-full rounded-md border border-red-200 bg-red-50 text-red-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-300"
                value={form.phone}
                onChange={(e)=>setForm(f=>({...f, phone: e.target.value}))}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-red-800 mb-1">City / Location</label>
            <input
              className="w-full rounded-md border border-red-200 bg-red-50 text-red-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-300"
              value={form.city}
              onChange={(e)=>setForm(f=>({...f, city: e.target.value}))}
              required
            />
          </div>

          <button
            type="submit"
            className="mt-2 w-full inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 text-white font-semibold hover:from-red-700 hover:to-red-800 shadow-md transition transform hover:scale-105"
          >
            Register as Donor
          </button>
        </form>

        <p className="mt-4 text-xs text-red-700 text-center">
          Note: This is a demo form. Your details are not stored; they are only logged in your browser console.
        </p>
      </div>
    </div>
  );
}
