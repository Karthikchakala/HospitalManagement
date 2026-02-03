"use client";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useChat, JoinPayload, ChatMessage } from '../lib/useChat';

const defaultServer = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || '';

function ChatRoom({ serverUrl, join }: { serverUrl: string; join: JoinPayload }) {
  const { messages, sendMessage, typing, stopTyping, typingFrom } = useChat(serverUrl, join);
  const inputRef = useRef<HTMLInputElement>(null);

  const onSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputRef.current?.value?.trim();
    if (!text) return;
    inputRef.current!.value = '';
    const receiverId = (join.doctorId as number);
    sendMessage({ message: text, receiverId, patientId: join.patientId, doctorId: join.doctorId });
  };

  return (
    <div className="flex flex-col h-full border border-cyan-700/40 rounded-xl overflow-hidden">
      <div className="px-3 py-2 text-sm bg-slate-900/70 border-b border-cyan-700/40">
        <span className="font-semibold text-cyan-200">Realtime Chat</span>
        <span className="ml-2 text-xs text-gray-400">room auto-selected from context</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-950/70">
        {messages.map((m: ChatMessage) => (
          <div key={m.message_id || `${m.sender_id}-${m.created_at}`} className={`flex ${String(m.sender_type) === join.senderType ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm shadow ${String(m.sender_type) === join.senderType ? 'bg-cyan-500/20 text-cyan-100 border border-cyan-600/50' : 'bg-slate-900/70 text-gray-100 border border-cyan-700/40'}`}>
              <p className="whitespace-pre-wrap">{m.message}</p>
              <p className="mt-1 text-[10px] text-gray-400">{new Date(m.created_at || Date.now()).toLocaleString()}</p>
            </div>
          </div>
        ))}
        {typingFrom && (
          <div className="text-xs text-gray-400">User {typingFrom} is typing...</div>
        )}
      </div>
      <form onSubmit={onSend} className="border-t border-cyan-700/40 bg-slate-950/90 px-3 py-2">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            onChange={typing}
            onBlur={stopTyping}
            type="text"
            placeholder="Type a message"
            className="flex-1 rounded-xl border border-cyan-700/40 bg-slate-900/70 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-400 outline-none focus:border-cyan-400/70"
          />
          <button type="submit" className="rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-3 py-2 text-sm text-white shadow hover:shadow-cyan-400/30">Send</button>
        </div>
      </form>
    </div>
  );
}

export default function RealtimeChatWidget() {
  const [serverUrl] = useState<string>(defaultServer);
  const [patientId, setPatientId] = useState<number>(0);
  const [patientName, setPatientName] = useState<string>('');
  const [doctorId, setDoctorId] = useState<number>(0);
  const [doctorName, setDoctorName] = useState<string>('');
  const [doctors, setDoctors] = useState<Array<{ doctor_id: number; doctor_name: string }>>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch patient profile to auto-fill patientId
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch(`${defaultServer}/api/patient/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const patientRel = Array.isArray(data?.Patient) ? data.Patient[0] : data?.Patient;
          const pid = patientRel?.patient_id ? Number(patientRel.patient_id) : 0;
          setPatientId(pid || 0);
          setPatientName(data?.name || 'Patient');
        }
      } catch { }
      finally {
        setLoading(false);
      }
    })();
  }, []);

  // Fetch doctors list and allow name entry/selection
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${defaultServer}/api/doctors`);
        if (res.ok) {
          const body = await res.json();
          const list = (body?.data || []).map((d: Record<string, unknown>) => ({ doctor_id: d.doctor_id, doctor_name: d.doctor_name }));
          setDoctors(list);
        }
      } catch { }
    })();
  }, []);

  // When doctor name changes, attempt to resolve id
  useEffect(() => {
    if (!doctorName) { setDoctorId(0); return; }
    const match = doctors.find(d => d.doctor_name.toLowerCase() === doctorName.toLowerCase())
      || doctors.find(d => d.doctor_name.toLowerCase().includes(doctorName.toLowerCase()));
    setDoctorId(match?.doctor_id || 0);
  }, [doctorName, doctors]);

  const canJoin = useMemo(() => !!patientId && !!doctorId, [patientId, doctorId]);

  const joinPayload: JoinPayload | null = useMemo(() => {
    if (!canJoin) return null;
    return { chatContext: 'general', patientId, doctorId, senderType: 'patient', senderId: patientId } as JoinPayload;
  }, [canJoin, patientId, doctorId]);

  return (
    <div className="mx-auto max-w-3xl p-4 space-y-4">
      <div className="rounded-xl border border-cyan-700/40 bg-slate-950/80 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="text-sm text-gray-200">
            <div className="font-semibold text-cyan-200">You are chatting as</div>
            <div className="text-gray-300">{patientName || 'Patient'} {patientId ? `(ID: ${patientId})` : ''}</div>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-200">
            <span className="min-w-28">Doctor Name</span>
            <input
              list="doctorNames"
              value={doctorName}
              onChange={e => setDoctorName(e.target.value)}
              placeholder="Type doctor's name"
              className="flex-1 rounded border border-cyan-700/40 bg-slate-900/70 px-2 py-1 text-sm"
            />
            <datalist id="doctorNames">
              {doctors.map(d => (
                <option key={d.doctor_id} value={d.doctor_name} />
              ))}
            </datalist>
          </label>
        </div>
        {!canJoin && (
          <p className="mt-2 text-xs text-gray-400">{loading ? 'Loading your profile...' : 'Select a valid doctor name to start chatting.'}</p>
        )}
      </div>

      <div className="h-[60vh]">
        {joinPayload ? (
          <ChatRoom serverUrl={serverUrl} join={joinPayload} />
        ) : (
          <div className="h-full rounded-xl border border-cyan-700/40 bg-slate-950/60 grid place-items-center text-sm text-gray-400">
            {loading ? 'Loading...' : 'Enter the doctor name to start chatting.'}
          </div>
        )}
      </div>
    </div>
  );
}
