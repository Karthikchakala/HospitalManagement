"use client";
import React from 'react';
import PatientChatWidget from '../../components/PatientChatWidget';

export default function ChatPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-gray-100">
      <div className="mx-auto max-w-6xl py-8">
        <h1 className="mb-4 text-xl font-semibold text-cyan-200">Patient Chat</h1>
        <p className="mb-6 text-sm text-gray-300">Select a doctor to view and send messages in real time.</p>
        <PatientChatWidget />
      </div>
    </main>
  );
}
