"use client";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useChat, JoinPayload, AppointmentType, ChatMessage } from '../lib/useChat';

const defaultServer = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL;

type PatientItem = { patient_id: number; name: string };

type Appointment = { appointment_id: number; appointment_date: string; patient_id: number };

function ChatRoom({ serverUrl, join }: { serverUrl: string; join: JoinPayload }) {
  const { messages, sendMessage, typing, stopTyping, typingFrom } = useChat(serverUrl, join);
  const inputRef = useRef<HTMLInputElement>(null);

  const onSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputRef.current?.value?.trim();
    if (!text) return;
    inputRef.current!.value = '';
    const receiverId = (join.patientId as number);
    sendMessage({ message: text, receiverId, patientId: join.patientId, doctorId: join.doctorId, appointmentType: join.appointmentType, appointmentId: join.appointmentId });
  };

  return (
    <div className="flex flex-col h-full border border-cyan-700/40 rounded-xl overflow-hidden">
      <div className="px-3 py-2 text-sm bg-slate-900/70 border-b border-cyan-700/40">
        <span className="font-semibold text-cyan-200">Doctor Chat</span>
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

export default function DoctorChatWidget() {
  const [serverUrl] = useState<string>(defaultServer);
  const [doctorId, setDoctorId] = useState<number>(0);
  const [doctorName, setDoctorName] = useState<string>('');
  const [patients, setPatients] = useState<PatientItem[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientItem | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [context, setContext] = useState<'general' | 'appointment'>('general');
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);

  // Fetch doctor profile
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch(`${defaultServer}/api/doctor/profile`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = (await res.json()) as { Doctor?: { doctor_id: number }[]; name: string };
          const docRel = Array.isArray(data?.Doctor) ? data.Doctor[0] : data?.Doctor;
          const did = docRel?.doctor_id ? Number(docRel.doctor_id) : 0;
          setDoctorId(did || 0);
          setDoctorName(data?.name || 'Doctor');
        }
      } catch { }
    })();
  }, []);

  // Fetch patients with chat threads
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch(`${defaultServer}/api/doctor/chat/patients`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const list: PatientItem[] = await res.json();
          setPatients(list);
        }
      } catch { }
    })();
  }, []);

  // Fetch appointments to support appointment chat context
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch(`${defaultServer}/api/doctor/appointments`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const list: Appointment[] = await res.json();
          setAppointments(list || []);
        }
      } catch { }
    })();
  }, []);

  // Filter appointments for selected patient
  const patientAppointments = useMemo(() => {
    if (!selectedPatient) return [] as Appointment[];
    return (appointments || []).filter(a => Number(a.patient_id) === Number(selectedPatient.patient_id));
  }, [appointments, selectedPatient]);

  const joinPayload: JoinPayload | null = useMemo(() => {
    if (!doctorId || !selectedPatient) return null;
    if (context === 'general') {
      return { chatContext: 'general', patientId: selectedPatient.patient_id, doctorId, senderType: 'doctor', senderId: doctorId } as JoinPayload;
    }
    const apptId = selectedAppointmentId || (patientAppointments[0]?.appointment_id);
    if (!apptId) return { chatContext: 'general', patientId: selectedPatient.patient_id, doctorId, senderType: 'doctor', senderId: doctorId };
    // For Appointments table entries, default to 'in_person'
    return { chatContext: 'appointment', appointmentType: 'in_person' as AppointmentType, appointmentId: apptId, patientId: selectedPatient.patient_id, doctorId, senderType: 'doctor', senderId: doctorId } as JoinPayload;
  }, [doctorId, selectedPatient, context, selectedAppointmentId, patientAppointments]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
      <div className="md:col-span-1 border border-cyan-700/40 rounded-xl bg-slate-950/70">
        <div className="p-3 border-b border-cyan-700/40 text-sm text-cyan-200 font-semibold">Patients</div>
        <div className="max-h-[70vh] overflow-y-auto">
          {patients.map(p => (
            <button key={p.patient_id} onClick={() => { setSelectedPatient(p); }} className={`w-full text-left px-3 py-2 text-sm border-b border-cyan-700/20 hover:bg-slate-900/70 ${selectedPatient?.patient_id === p.patient_id ? 'bg-slate-900/60' : ''}`}>
              <div className="text-gray-200">{p.name || 'Patient'}</div>
              <div className="text-xs text-gray-400">ID: {p.patient_id}</div>
            </button>
          ))}
          {patients.length === 0 && (
            <div className="p-3 text-xs text-gray-400">No chat threads yet.</div>
          )}
        </div>
      </div>

      <div className="md:col-span-2">
        <div className="mb-3 flex items-center gap-2 text-sm">
          <div className="px-2 py-1 rounded bg-slate-900/70 border border-cyan-700/40 text-gray-200">Dr. {doctorName}{doctorId ? ` (ID: ${doctorId})` : ''}</div>
          {selectedPatient && (
            <>
              <div className="px-2 py-1 rounded bg-slate-900/70 border border-cyan-700/40 text-gray-200">Chat with: {selectedPatient.name} (ID: {selectedPatient.patient_id})</div>
              <select className="ml-auto rounded border border-cyan-700/40 bg-slate-900/70 text-gray-200 px-2 py-1" value={context} onChange={e => setContext(e.target.value as 'general' | 'appointment')}>
                <option value="general">General</option>
                <option value="appointment">Appointment</option>
              </select>
              {context === 'appointment' && (
                <select className="rounded border border-cyan-700/40 bg-slate-900/70 text-gray-200 px-2 py-1" value={selectedAppointmentId || ''} onChange={e => setSelectedAppointmentId(e.target.value ? Number(e.target.value) : null)}>
                  <option value="">Select appointment</option>
                  {patientAppointments.map(ap => (
                    <option key={ap.appointment_id} value={ap.appointment_id}>Appt #{ap.appointment_id} on {ap.appointment_date}</option>
                  ))}
                </select>
              )}
            </>
          )}
        </div>
        <div className="h-[65vh]">
          {joinPayload ? (
            <ChatRoom serverUrl={serverUrl} join={joinPayload} />
          ) : (
            <div className="h-full rounded-xl border border-cyan-700/40 bg-slate-950/60 grid place-items-center text-sm text-gray-400">Select a patient to start chatting.</div>
          )}
        </div>
      </div>
    </div>
  );
}
