'use client';
import React from 'react';
import DoctorChatWidget from '../../../components/DoctorChatWidget';

export default function DoctorChatPage() {
  return (
    <div className="mx-auto max-w-6xl p-4 space-y-4">
      <div className="rounded-xl border border-cyan-700/40 bg-slate-950/80 p-4">
        <h1 className="text-xl font-semibold text-cyan-200">Doctor Chat</h1>
        <p className="text-sm text-gray-400">Select a patient to view and send messages in real time.</p>
      </div>
      <DoctorChatWidget />
    </div>
  );
}
