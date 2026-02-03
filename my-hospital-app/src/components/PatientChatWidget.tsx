"use client";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useChat, JoinPayload, AppointmentType, ChatMessage } from '../lib/useChat';

const defaultServer = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_BASE_URL || '';

type DoctorItem = { doctor_id: number; name: string };
type Appointment = { appointment_id: number; appointment_date: string; appointment_time?: string; doctor_id: number };



function ChatRoom({ serverUrl, join }: { serverUrl: string; join: JoinPayload }) {
  const { messages, sendMessage, typing, stopTyping, typingFrom } = useChat(serverUrl, join);
  const inputRef = useRef<HTMLInputElement>(null);

  const onSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputRef.current?.value?.trim();
    if (!text) return;
    inputRef.current!.value = '';
    const receiverId = (join.doctorId as number);
    sendMessage({ message: text, receiverId, patientId: join.patientId, doctorId: join.doctorId, appointmentType: join.appointmentType, appointmentId: join.appointmentId });
  };

  return (
    <div className="flex flex-col h-full border border-cyan-700/40 rounded-xl overflow-hidden">
      <div className="px-3 py-2 text-sm bg-slate-900/70 border-b border-cyan-700/40">
        <span className="font-semibold text-cyan-200">Patient Chat</span>
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

export default function PatientChatWidget() {
  const [serverUrl] = useState<string>(defaultServer);
  const [patientId, setPatientId] = useState<number>(0);
  const [patientName, setPatientName] = useState<string>('');
  const [doctors, setDoctors] = useState<DoctorItem[]>([]);
  const [allDoctors, setAllDoctors] = useState<DoctorItem[]>([]);
  const [newDoctorInput, setNewDoctorInput] = useState<string>('');
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorItem | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [context, setContext] = useState<'general' | 'appointment'>('general');
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);

  // Fetch patient profile (auto)
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch(`${defaultServer}/api/patient/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = (await res.json()) as { Patient?: { patient_id: number }[]; name: string };
          const patRel = Array.isArray(data?.Patient) ? data.Patient[0] : data?.Patient;
          const pid = patRel?.patient_id ? Number(patRel.patient_id) : 0;
          setPatientId(pid || 0);
          setPatientName(data?.name || 'Patient');
        }
      } catch { }
    })();
  }, []);

  // Fetch doctors who chatted with this patient
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch(`${defaultServer}/api/patient/chat/doctors`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const list: DoctorItem[] = await res.json();
          setDoctors(list);
        }
      } catch { }
    })();
  }, []);

  // Fetch all doctors (public) to allow starting a new chat
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${defaultServer}/api/doctors`);
        if (res.ok) {
          const body = await res.json();
          const list: DoctorItem[] = ((body?.data || []) as Record<string, unknown>[]).map((d) => ({
            doctor_id: Number(d.doctor_id),
            name: (d.doctor_name as string) || (d.name as string) || `Doctor #${d.doctor_id}`,
          }));
          setAllDoctors(list);
        }
      } catch { }
    })();
  }, []);

  // Fetch patient appointments (optionally filtered by doctor)
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token || !patientId) return;
        const query = selectedDoctor ? `?doctorId=${selectedDoctor.doctor_id}` : '';
        const res = await fetch(`${defaultServer}/api/patient/chat/appointments${query}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const list: Appointment[] = await res.json();
          setAppointments(list || []);
        }
      } catch { }
    })();
  }, [patientId, selectedDoctor]);

  const doctorAppointments = useMemo(() => {
    if (!selectedDoctor) return [] as Appointment[];
    return (appointments || []).filter(a => Number(a.doctor_id) === Number(selectedDoctor.doctor_id));
  }, [appointments, selectedDoctor]);

  const joinPayload: JoinPayload | null = useMemo(() => {
    if (!patientId || !selectedDoctor) return null;
    if (context === 'general') {
      return { chatContext: 'general', patientId, doctorId: selectedDoctor.doctor_id, senderType: 'patient', senderId: patientId } as JoinPayload;
    }
    const apptId = selectedAppointmentId || (doctorAppointments[0]?.appointment_id);
    if (!apptId) return { chatContext: 'general', patientId, doctorId: selectedDoctor.doctor_id, senderType: 'patient', senderId: patientId };
    return { chatContext: 'appointment', appointmentType: 'in_person' as AppointmentType, appointmentId: apptId, patientId, doctorId: selectedDoctor.doctor_id, senderType: 'patient', senderId: patientId } as JoinPayload;
  }, [patientId, selectedDoctor, context, selectedAppointmentId, doctorAppointments]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
      <div className="md:col-span-1 border border-cyan-700/40 rounded-xl bg-slate-950/70">
        <div className="p-3 border-b border-cyan-700/40 text-sm text-cyan-200 font-semibold flex items-center gap-2">
          <span>Doctors</span>
        </div>
        {/* New Chat Section */}
        <div className="p-3 border-b border-cyan-700/20 space-y-2">
          <div className="text-xs text-gray-400">Start new chat</div>
          <div className="flex items-center gap-2">
            <input
              list="allDoctorsList"
              value={newDoctorInput}
              onChange={e => setNewDoctorInput(e.target.value)}
              placeholder="Type doctor name"
              className="flex-1 rounded border border-cyan-700/40 bg-slate-900/70 px-2 py-1 text-sm text-gray-100 placeholder:text-gray-400 outline-none focus:border-cyan-400/70"
            />
            <datalist id="allDoctorsList">
              {allDoctors.map(d => (
                <option key={d.doctor_id} value={d.name} />
              ))}
            </datalist>
            <button
              type="button"
              onClick={() => {
                const match = allDoctors.find(d => d.name.toLowerCase() === newDoctorInput.toLowerCase())
                  || allDoctors.find(d => d.name.toLowerCase().includes(newDoctorInput.toLowerCase()));
                if (match) {
                  setSelectedDoctor(match);
                  // add to current doctors list if not present
                  setDoctors(prev => prev.some(p => p.doctor_id === match.doctor_id) ? prev : [match, ...prev]);
                }
              }}
              className="rounded bg-gradient-to-r from-cyan-500 to-teal-500 px-3 py-1 text-sm text-white"
            >
              Start
            </button>
          </div>
        </div>
        <div className="max-h-[70vh] overflow-y-auto">
          {doctors.map(d => (
            <button key={d.doctor_id} onClick={() => { setSelectedDoctor(d); }} className={`w-full text-left px-3 py-2 text-sm border-b border-cyan-700/20 hover:bg-slate-900/70 ${selectedDoctor?.doctor_id === d.doctor_id ? 'bg-slate-900/60' : ''}`}>
              <div className="text-gray-200">{d.name || 'Doctor'}</div>
              <div className="text-xs text-gray-400">ID: {d.doctor_id}</div>
            </button>
          ))}
          {doctors.length === 0 && (
            <div className="p-3 text-xs text-gray-400">No chat threads yet.</div>
          )}
        </div>
      </div>

      <div className="md:col-span-2">
        <div className="mb-3 flex items-center gap-2 text-sm">
          <div className="px-2 py-1 rounded bg-slate-900/70 border border-cyan-700/40 text-gray-200">{patientName}{patientId ? ` (ID: ${patientId})` : ''}</div>
          {selectedDoctor && (
            <>
              <div className="px-2 py-1 rounded bg-slate-900/70 border border-cyan-700/40 text-gray-200">Chat with: {selectedDoctor.name} (ID: {selectedDoctor.doctor_id})</div>
              <select className="ml-auto rounded border border-cyan-700/40 bg-slate-900/70 text-gray-200 px-2 py-1" value={context} onChange={e => setContext(e.target.value as 'general' | 'appointment')}>
                <option value="general">General</option>
                <option value="appointment">Appointment</option>
              </select>
              {context === 'appointment' && (
                <select className="rounded border border-cyan-700/40 bg-slate-900/70 text-gray-200 px-2 py-1" value={selectedAppointmentId || ''} onChange={e => setSelectedAppointmentId(e.target.value ? Number(e.target.value) : null)}>
                  <option value="">Select appointment</option>
                  {doctorAppointments.map(ap => (
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
            <div className="h-full rounded-xl border border-cyan-700/40 bg-slate-950/60 grid place-items-center text-sm text-gray-400">Select a doctor to start chatting.</div>
          )}
        </div>
      </div>
    </div>
  );
}
