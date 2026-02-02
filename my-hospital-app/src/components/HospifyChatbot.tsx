"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

// A self-contained floating chatbot for the homepage
// - Friendly tone
// - FAQ and quick actions
// - Minimal in-memory session context persisted to sessionStorage
// - No external dependencies beyond Next/React/Tailwind already present

// Types
interface Message {
  id: string;
  from: "bot" | "user";
  text?: string;
  rich?: React.ReactNode;
  timestamp: number;
}

interface SessionContext {
  selectedDepartment?: string;
  selectedDoctorId?: string;
  contactIntent?: boolean;
  contactInfo?: { name?: string; phone?: string; email?: string };
}

interface Doctor {
  id: string;
  name: string;
  specialization?: string;
  visiting?: string;
  departmentId?: string | number;
}

interface Department {
  id?: string | number;
  name: string;
}

const initialBotGreeting: Message = {
  id: "greet-1",
  from: "bot",
  timestamp: Date.now(),
  rich: (
    <div className="space-y-3">
      <p className="leading-relaxed">Hi there! Im your Hospify assistant. How can I help you today?</p>
      <div className="flex flex-wrap gap-2">
        <QuickReply label="Book Appointment" payload="book appointment" />
        <QuickReply label="Departments" payload="departments" />
        <QuickReply label="Doctors" payload="available doctors" />
        <QuickReply label="Visiting Hours" payload="visiting hours" />
        <QuickReply label="Location" payload="location" />
      </div>
    </div>
  ),
};

// Default sample doctors (fallback)
const defaultSampleDoctors: Doctor[] = [
  { id: "d1", name: "Dr. Ananya Rao", specialization: "Cardiology", visiting: "Mon - Fri, 10:00 AM - 2:00 PM" },
  { id: "d2", name: "Dr. Vikram Shah", specialization: "Neurology", visiting: "Tue - Sat, 12:00 PM - 4:00 PM" },
  { id: "d3", name: "Dr. Meera Iyer", specialization: "Pediatrics", visiting: "Mon - Sat, 9:00 AM - 1:00 PM" },
  { id: "d4", name: "Dr. Arjun Patel", specialization: "Orthopedics", visiting: "Mon, Wed, Fri, 3:00 PM - 6:00 PM" },
];

const defaultDepartments: string[] = [
  "Cardiology",
  "Neurology",
  "Pediatrics",
  "Orthopedics",
  "Gynecology",
  "Dermatology",
  "ENT",
  "Gastroenterology",
  "Oncology",
  "General Medicine",
];

// Utilities
const uid = () => Math.random().toString(36).slice(2);

function QuickReply({ label, payload }: { label: string; payload: string }) {
  return (
    <span
      data-payload={payload}
      className="inline-block cursor-pointer select-none rounded-full border border-cyan-400/60 bg-cyan-500/10 px-3 py-1 text-sm text-cyan-200 hover:bg-cyan-500/20 active:scale-[.98]"
      onClick={() => {
        const el = document.getElementById("hospify-chat-input") as HTMLInputElement | null;
        if (el) {
          el.value = payload;
          el.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }}
      role="button"
    >
      {label}
    </span>
  );
}

export default function HospifyChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [session, setSession] = useState<SessionContext>({});
  const [doctors, setDoctors] = useState<Doctor[] | null>(null);
  const [departments, setDepartments] = useState<Department[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef(false);

  const getDepartmentName = (depId?: string | number) => {
    if (depId == null || !departments || !departments.length) return undefined;
    const match = departments.find((d) => String(d.id) === String(depId));
    return match?.name;
  };

  // Ensure we can resolve department_id: try in-memory first, then Supabase lookup by name
  const resolveDepartmentId = async (depName: string): Promise<string | number | undefined> => {
    const local = (departments || []).find((d) => String(d.name).toLowerCase() === depName.toLowerCase());
    if (local?.id != null) return local.id;
    try {
      const { data, error } = await supabase
        .from('Departments')
        .select('department_id, name')
        .ilike('name', `%${depName.trim()}%`)
        .limit(1);
      if (!error && data && data.length) {
        return data[0].department_id;
      }
    } catch { }
    return undefined;
  };


  const mapDoctor = (d: Record<string, unknown>): Doctor => {
    const visiting = d.schedule ? String(d.schedule) : [d.availability_date, d.availability_time].filter(Boolean).join(" ");
    return {
      id: String(d.doctor_id),
      name: String(d.name),
      specialization: (d.specialization as string) || undefined,
      visiting: visiting || undefined,
      departmentId: (d.department_id as string | number) ?? undefined,
    };
  };

  const appendDoctors = (title: string, list: Doctor[]) => {
    setMessages((m) => [
      ...m,
      bot(
        <div className="space-y-2">
          <p>{title}</p>
          {list.length === 0 ? (
            <p className="text-sm text-gray-300">No doctors found.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {list.slice(0, 6).map((d) => (
                <div key={d.id} className="rounded-lg border border-cyan-700/40 bg-slate-900/60 p-3">
                  <p className="font-semibold text-cyan-200">{d.name}</p>
                  <p className="text-sm text-gray-300">{getDepartmentName(d.departmentId) ?? d.specialization}</p>
                  <p className="text-xs text-gray-400">{d.visiting}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ),
    ]);
  };

  // User-provided helpers adapted for our types
  const fetchDepartmentsHelper = async (): Promise<Department[]> => {
    try {
      const { data, error } = await supabase.from('Departments').select('department_id, name, description');
      if (error) {
        console.error('Error fetching departments:', error);
        return [];
      }

      return (data || []).map((d: Record<string, unknown>) => ({ id: d.department_id as string | number, name: d.name as string }));
    } catch (e) {
      console.error('Departments fetch failed:', e);
      return [];
    }
  };

  const fetchDoctorsHelper = async (): Promise<Doctor[]> => {
    try {
      const { data, error } = await supabase
        .from('Doctor')
        .select('doctor_id, name, department_id, schedule, availability_date, availability_time, experience_years, rating');
      if (error) {
        console.error('Error fetching doctors:', error);
        return [];
      }

      return (data || []).map((d: Record<string, unknown>) => ({
        id: String(d.doctor_id ?? uid()),
        name: d.name as string,
        specialization: (d.specialization as string) || undefined,
        visiting: d.schedule ? String(d.schedule) : [d.availability_date, d.availability_time].filter(Boolean).join(' '),
        departmentId: (d.department_id as string | number) ?? undefined,
      }));
    } catch (e) {
      console.error('Doctors fetch failed:', e);
      return [];
    }
  };

  const fetchDoctorsForDepartment = async (depName: string) => {
    try {
      console.log('[Hospify] fetchDoctorsForDepartment called with:', depName);
      const depId = await resolveDepartmentId(depName);
      console.log('[Hospify] resolved depId:', depId);
      if (depId != null) {
        const depIdNum = typeof depId === 'string' ? parseInt(depId as string, 10) : depId;
        const filterId = Number.isFinite(depIdNum as number) ? (depIdNum as number) : depId;
        console.log('[Hospify] filtering by department_id:', filterId, '(original:', depId, ')');
        const { data, error } = await supabase
          .from("Doctor")
          .select("doctor_id, name, schedule, availability_time, availability_date, department_id")

          .eq("department_id", filterId)
          .limit(20);
        console.log('[Hospify] doctors query result:', { error, count: data?.length, sample: data?.[0] });
        if (!error && data && data.length) {
          appendDoctors(`Doctors in ${depName}:`, data.map(mapDoctor));
          return;
        }
      }
      // Fallback: try in-memory list first by departmentId if present, else by specialization name includes department name
      const list = (doctors && doctors.length
        ? doctors.filter((dr) => {
          if (depId) return String(dr.departmentId) === String(depId);
          if (dr.specialization) return dr.specialization.toLowerCase().includes(depName.toLowerCase());
          return false;
        })
        : (isSupabaseConfigured ? [] : defaultSampleDoctors.filter((dr) => dr.specialization?.toLowerCase().includes(depName.toLowerCase()))));
      console.log('[Hospify] using in-memory doctors list after filter. len=', list.length, 'isSupabaseConfigured=', isSupabaseConfigured);
      appendDoctors(`Doctors in ${depName}:`, list);
    } catch {
      console.warn('[Hospify] fetchDoctorsForDepartment failed, using fallback.');
      appendDoctors(`Doctors in ${depName}:`, isSupabaseConfigured ? [] : defaultSampleDoctors);
    }
  };

  // Restore session from sessionStorage
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("hospify_session");
      const rawMsgs = sessionStorage.getItem("hospify_msgs");
      if (raw) setSession(JSON.parse(raw));
      if (rawMsgs) {
        const parsed = JSON.parse(rawMsgs) as Array<Pick<Message, 'id' | 'from' | 'text' | 'timestamp'>>;
        if (Array.isArray(parsed) && parsed.length) {
          const restored: Message[] = parsed
            .filter((p) => p && (typeof p.text === 'string' || p.text === undefined))
            .map((p) => ({ id: p.id, from: p.from, text: p.text, timestamp: p.timestamp }));
          if (restored.length) {
            setMessages(restored);
            return;
          }
        }
      }
      // If no stored messages, seed with single greeting
      setMessages([initialBotGreeting]);
    } catch { }
  }, []);

  // Persist session and messages
  useEffect(() => {
    try {
      sessionStorage.setItem("hospify_session", JSON.stringify(session));
      const serializable = messages.map((m) => ({ id: m.id, from: m.from, text: m.text, timestamp: m.timestamp }));
      sessionStorage.setItem("hospify_msgs", JSON.stringify(serializable));
    } catch { }
  }, [session, messages]);

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  // Load doctors and departments from Supabase on first open
  useEffect(() => {
    const load = async () => {
      try {
        console.log('[Hospify] isSupabaseConfigured=', isSupabaseConfigured);
        const [deps, docs] = await Promise.all([
          fetchDepartmentsHelper(),
          fetchDoctorsHelper(),
        ]);
        console.log('[Hospify] loaded deps/docs counts:', deps.length, docs.length);
        if (deps.length) setDepartments(deps);
        if (docs.length) setDoctors(docs);
      } catch {
        // silently ignore; fallbacks will be used
      }
    };

    if (open && !loadedRef.current) {
      loadedRef.current = true;
      load();
    }
  }, [open]);

  const handleUserSend = (textRaw: string) => {
    const text = textRaw.trim();
    if (!text) return;
    const userMsg: Message = { id: uid(), from: "user", text, timestamp: Date.now() };
    setMessages((m) => [...m, userMsg]);

    // small delay for bot reply
    setTimeout(() => {
      const reply = handleIntent(text.toLowerCase());
      setMessages((m) => [...m, reply]);
    }, 250);
  };

  const handleIntent = (q: string): Message => {
    // address/location
    if (/(where.*(located|address))|\blocation\b|\baddress\b/.test(q)) {
      return bot(
        <div>
          <p>
            Were located at 123 Health Avenue, Sector 9, New City 560001.
          </p>
          <p className="mt-2">
            <a
              className="text-cyan-300 underline hover:text-cyan-200"
              href="https://maps.google.com/?q=123+Health+Avenue+Sector+9+New+City+560001"
              target="_blank"
              rel="noreferrer"
            >
              Open in Google Maps
            </a>
          </p>
        </div>
      );
    }

    // visiting hours
    if (/visiting (hour|time)|visiting|visit hours|timing/.test(q)) {
      return bot(
        <div>
          <p>Visiting Hours</p>
          <ul className="mt-2 list-disc pl-5 text-sm text-gray-200">
            <li>Mon - Sat: 10:00 AM - 12:00 PM, 5:00 PM - 7:00 PM</li>
            <li>Sun/Public Holidays: 11:00 AM - 1:00 PM</li>
          </ul>
        </div>
      );
    }

    // book appointment / login
    if (/book|appointment|schedule|reserve/.test(q)) {
      return bot(
        <div className="space-y-3">
          <p>You can book an appointment online in a few steps.</p>
          <div className="flex items-center gap-2">
            <Link href="/login" className="rounded-full bg-gradient-to-r from-cyan-400 to-teal-400 px-4 py-2 text-sm text-white shadow-md hover:shadow-cyan-400/40">
              Login to Book
            </Link>
            <QuickReply label="Doctors" payload="available doctors" />
            <QuickReply label="Departments" payload="departments" />
          </div>
        </div>
      );
    }

    // consultation fee
    if (/fee|fees|consult(ation)?\s*fee/.test(q)) {
      return bot(
        <div>
          <p className="mb-2">Consultation Fees</p>
          <ul className="list-disc pl-5 text-sm text-gray-200">
            <li>General OPD: 	₹400 - ₹600</li>
            <li>Specialists: 	₹800 - ₹1500</li>
          </ul>
        </div>
      );
    }

    // find doctors in <department>
    const inDeptMatch = q.match(/(doctor|specialist)s?\s*(in|for)\s+([a-zA-Z ]{2,})/);
    if (inDeptMatch) {
      const deptName = inDeptMatch[3].trim();
      fetchDoctorsForDepartment(deptName);
      return bot(
        <div>
          <p>Searching doctors in <span className="font-semibold text-cyan-200">{deptName}</span>...</p>
        </div>
      );
    }

    // available doctors
    if (/doctor|available doctor|show.*doctor|physician/.test(q)) {
      console.log('[Hospify] doctors intent. in-memory doctors len=', doctors?.length || 0, 'isSupabaseConfigured=', isSupabaseConfigured);
      return bot(
        <div className="space-y-3">
          <p>Here are a few available doctors:</p>
          <div className="grid grid-cols-1 gap-3">
            {(doctors && doctors.length ? doctors : (isSupabaseConfigured ? [] : defaultSampleDoctors)).length === 0 ? (
              <p className="text-sm text-gray-300">No doctors found.</p>
            ) : (
              (doctors && doctors.length ? doctors : (isSupabaseConfigured ? [] : defaultSampleDoctors)).map((d) => (
                <div key={d.id} className="rounded-lg border border-cyan-700/40 bg-slate-900/60 p-3">
                  <p className="font-semibold text-cyan-200">{d.name}</p>
                  <p className="text-sm text-gray-300">{d.specialization}</p>
                  <p className="text-xs text-gray-400">{d.visiting}</p>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => setSession((s) => ({ ...s, selectedDoctorId: d.id }))}
                      className="rounded-full border border-cyan-400/60 px-3 py-1 text-xs text-cyan-200 hover:bg-cyan-500/10"
                    >
                      Select
                    </button>
                    <Link href="/login" className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs text-cyan-200 hover:bg-cyan-500/30 border border-cyan-400/60">
                      Book with {d.name.split(" ")[1]}
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }

    // departments
    if (/department|specialty|specialisation|specialization|which departments/.test(q)) {
      const depNames = (departments && departments.length
        ? departments.map((d) => d.name)
        : (isSupabaseConfigured ? [] : defaultDepartments));
      console.log('[Hospify] departments intent. depNames len=', depNames.length, 'isSupabaseConfigured=', isSupabaseConfigured);
      return bot(
        <div className="space-y-3">
          <p>We have the following departments:</p>
          <div className="flex flex-wrap gap-2">
            {depNames.length === 0 ? (
              <p className="text-sm text-gray-300">No departments found.</p>
            ) : depNames.map((dep) => (
              <button
                key={dep}
                onClick={() => {
                  setSession((s) => ({ ...s, selectedDepartment: dep }));
                  setMessages((m) => [
                    ...m,
                    bot(
                      <div>
                        <p>Department selected: <span className="font-semibold text-cyan-200">{dep}</span></p>
                      </div>
                    ),
                    bot(
                      <div className="space-y-2">
                        <p>Doctors in {dep}:</p>
                        <div className="grid grid-cols-1 gap-3">
                          {(() => {
                            const depObj = (departments || []).find((d) => d.name === dep);
                            const depId = depObj?.id;
                            const list = (doctors && doctors.length
                              ? doctors.filter((dr) => (depId ? String(dr.departmentId) === String(depId) : true))
                              : (isSupabaseConfigured ? [] : defaultSampleDoctors));
                            return list.slice(0, 6).map((d) => (
                              <div key={d.id} className="rounded-lg border border-cyan-700/40 bg-slate-900/60 p-3">
                                <p className="font-semibold text-cyan-200">{d.name}</p>
                                <p className="text-sm text-gray-300">{d.specialization}</p>
                                <p className="text-xs text-gray-400">{d.visiting}</p>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    ),
                  ]);
                }}
                className="rounded-full border border-cyan-400/60 bg-cyan-500/10 px-3 py-1 text-sm text-cyan-200 hover:bg-cyan-500/20"
              >
                {dep}
              </button>
            ))}
          </div>
        </div>
      );
    }

    // emergency service
    if (/emergency|24\/7|24x7/.test(q)) {
      return bot(
        <div>
          <p>Yes, our Emergency Department operates 24/7.</p>
          <p className="mt-1">Emergency Helpline: <span className="font-semibold text-cyan-200">+91 98765 43210</span></p>
        </div>
      );
    }

    // ambulance
    if (/ambulance|emergency.*ambulance|call ambulance/.test(q)) {
      return bot(
        <div>
          <p>For ambulance support, call <span className="font-semibold text-cyan-200">+91 91234 56789</span>.</p>
          <p className="text-sm text-gray-300 mt-1">Average response time in city limits: 12920 minutes.</p>
        </div>
      );
    }

    // medical reports
    if (/report|test result|lab result|medical report/.test(q)) {
      return bot(
        <div className="space-y-2">
          <p>You can access your medical reports online:</p>
          <ol className="list-decimal pl-5 text-sm text-gray-200">
            <li>Go to Login</li>
            <li>Open your Dashboard</li>
            <li>Navigate to Reports and download securely</li>
          </ol>
          <Link href="/login" className="inline-block rounded-full bg-gradient-to-r from-cyan-400 to-teal-400 px-4 py-2 text-sm text-white shadow-md hover:shadow-cyan-400/40">
            Login
          </Link>
        </div>
      );
    }

    // feedback / complaint
    if (/feedback|complaint|support|help desk/.test(q)) {
      return bot(
        <div className="space-y-2">
          <p>We value your feedback and are here to help.</p>
          <Link href="/contact" className="inline-block rounded-full border border-cyan-400/60 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200 hover:bg-cyan-500/20">
            Go to Feedback/Support
          </Link>
        </div>
      );
    }

    // online consultations
    if (/online consult|virtual|tele-?consult/.test(q)) {
      return bot(
        <div className="space-y-2">
          <p>Yes, we offer online consultations with select specialists.</p>
          <div className="flex gap-2">
            <Link href="/login" className="rounded-full bg-gradient-to-r from-cyan-400 to-teal-400 px-4 py-2 text-sm text-white shadow-md hover:shadow-cyan-400/40">
              Book Online
            </Link>
            <QuickReply label="Doctors" payload="available doctors" />
          </div>
        </div>
      );
    }

    // login help
    if (/(how.*log ?in)|login help|patient account/.test(q)) {
      return bot(
        <div className="space-y-2">
          <p>You can log in using your registered email or phone number.</p>
          <Link href="/login" className="inline-block rounded-full border border-cyan-400/60 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200 hover:bg-cyan-500/20">
            Go to Login
          </Link>
        </div>
      );
    }

    // talk to human
    if (/representative|human|staff|agent|talk to/.test(q)) {
      setSession((s) => ({ ...s, contactIntent: true }));
      return bot(
        <div className="space-y-2">
          <p>Our staff will reach you within a few minutes. Please share your name and contact number or email.</p>
          <p className="text-xs text-gray-400">Example: &quot;I am Priya, 9876543210&quot; or &quot;Priya, priya@example.com&quot;</p>
        </div>
      );
    }

    // capture contact info when contactIntent is true
    if (session.contactIntent) {
      const contactInfo = extractContact(q);
      if (contactInfo && (contactInfo.phone || contactInfo.email)) {
        setSession((s) => ({ ...s, contactInfo }));
        return bot(
          <div>
            <p>Thanks! I’ve noted your details. Our team will contact you shortly.</p>
            <p className="text-sm text-gray-300 mt-1">
              {contactInfo?.name ? `Name: ${contactInfo.name} · ` : ""}
              {contactInfo?.phone ? `Phone: ${contactInfo.phone} · ` : ""}
              {contactInfo?.email ? `Email: ${contactInfo.email}` : ""}
            </p>
          </div>
        );
      }
    }

    // typed department name (match common departments list)
    {
      const allDeps = (departments && departments.length
        ? departments.map((d) => String(d.name))
        : defaultDepartments
      );
      const qLower = q.toLowerCase();
      const matched = allDeps.find((d) => {
        const dn = d.toLowerCase();
        return qLower === dn || qLower.includes(dn);
      });
      if (matched) {
        setSession((s) => ({ ...s, selectedDepartment: matched }));
        return bot(
          <div>
            <p>Department selected: <span className="font-semibold text-cyan-200">{matched}</span></p>
          </div>
        );
      }
    }

    // fallback
    return bot(
      <div className="space-y-2">
        <p>Sorry, I didn’t catch that. Here are some quick options:</p>
        <div className="flex flex-wrap gap-2">
          <QuickReply label="Location" payload="where is the hospital located" />
          <QuickReply label="Visiting Hours" payload="what are your visiting hours" />
          <QuickReply label="Book Appointment" payload="how can I book an appointment" />
          <QuickReply label="Doctors" payload="show me available doctors" />
          <QuickReply label="Departments" payload="which departments are available" />
          <QuickReply label="Emergency" payload="do you have 24/7 emergency service" />
        </div>
      </div>
    );
  }

  const headerGradient = useMemo(
    () =>
      "bg-gradient-to-r from-cyan-500/20 via-sky-600/20 to-teal-500/20 border-b border-cyan-700/40",
    []
  );

  return (
    <div className="fixed bottom-5 right-5 z-[100]">
      {/* Floating Button */}
      {!open && (
        <button
          aria-label="Open Hospify Chatbot"
          onClick={() => setOpen(true)}
          className="group flex items-center gap-3 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-3 text-white shadow-lg shadow-cyan-900/40 hover:shadow-cyan-400/30"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
            <path d="M12 3C6.477 3 2 6.94 2 11.8c0 2.25 1.06 4.28 2.8 5.77-.12.83-.49 2.04-1.38 3.01-.2.21-.05.56.24.53 1.68-.18 3.06-.86 3.87-1.39.69.17 1.41.27 2.15.27 5.523 0 10-3.94 10-8.8S17.523 3 12 3z" />
          </svg>
          <span className="hidden sm:block font-semibold">Chat with Hospify</span>
        </button>
      )}

      {/* Chat Window */}
      {open && (
        <div className="flex h-[70vh] w-[90vw] max-w-[380px] flex-col overflow-hidden rounded-2xl border border-cyan-700/50 bg-slate-950/95 shadow-2xl backdrop-blur-md">
          {/* Header */}
          <div className={`flex items-center justify-between px-4 py-3 ${headerGradient}`}>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 shadow" />
              <div>
                <p className="text-sm font-semibold text-cyan-100">Hospify Assistant</p>
                <p className="text-xs text-gray-300">Friendly, secure and helpful</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                aria-label="Minimize"
                onClick={() => setOpen(false)}
                className="rounded-full border border-cyan-400/50 bg-slate-900/60 px-2 py-1 text-cyan-200 hover:bg-slate-800"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path d="M5 12.75a.75.75 0 0 1 .75-.75h12.5a.75.75 0 0 1 0 1.5H5.75a.75.75 0 0 1-.75-.75Z" />
                </svg>
              </button>
              <button
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="rounded-full border border-cyan-400/50 bg-slate-900/60 px-2 py-1 text-cyan-200 hover:bg-slate-800"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto p-3">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-md ${m.from === "user"
                    ? "bg-cyan-500/20 text-cyan-100 border border-cyan-600/50"
                    : "bg-slate-900/70 text-gray-100 border border-cyan-700/40"
                    }`}
                >
                  {m.text && <p className="whitespace-pre-wrap">{m.text}</p>}
                  {m.rich}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Quick actions row */}
          <div className="flex items-center gap-2 overflow-x-auto px-3 pb-2 pt-1">
            <QuickReply label="Book" payload="book appointment" />
            <QuickReply label="Doctors" payload="show me available doctors" />
            <QuickReply label="Departments" payload="which departments are available" />
            <QuickReply label="Hours" payload="what are your visiting hours" />
            <QuickReply label="Emergency" payload="do you have 24/7 emergency service" />
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const val = inputRef.current?.value || "";
              if (inputRef.current) inputRef.current.value = "";
              handleUserSend(val);
            }}
            className="border-t border-cyan-700/40 bg-slate-950/70 px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <input
                id="hospify-chat-input"
                ref={inputRef}
                type="text"
                placeholder="Type your message..."
                className="flex-1 rounded-xl border border-cyan-700/40 bg-slate-900/70 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-400 outline-none focus:border-cyan-400/70"
              />
              <button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-3 py-2 text-sm text-white shadow hover:shadow-cyan-400/30"
              >
                Send
              </button>
            </div>

            {/* Session context chips */}
            {(session.selectedDepartment || session.selectedDoctorId) && (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-cyan-200">
                {session.selectedDepartment && (
                  <span className="rounded-full border border-cyan-400/60 bg-cyan-500/10 px-2 py-0.5">
                    Dept: {session.selectedDepartment}
                  </span>
                )}
                {session.selectedDoctorId && (
                  <span className="rounded-full border border-cyan-400/60 bg-cyan-500/10 px-2 py-0.5">
                    Doctor: {session.selectedDoctorId}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setSession({})}
                  className="ml-auto rounded-full border border-cyan-400/60 bg-transparent px-2 py-0.5 text-gray-300 hover:bg-cyan-500/10"
                >
                  Clear
                </button>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
}

function bot(rich: React.ReactNode): Message {
  return { id: uid(), from: "bot", timestamp: Date.now(), rich };
}

function extractContact(q: string): SessionContext["contactInfo"] {
  // naive extraction of phone and email and name tokens
  const emailMatch = q.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  const phoneMatch = q.match(/(?<!\d)(?:\+?\d{1,3}[- ]?)?(?:\d{10})(?!\d)/);
  // name: take first capitalized word sequence at start
  const nameMatch = q.match(/^[A-Za-z][A-Za-z ]{1,40}/);
  return {
    name: nameMatch?.[0]?.trim(),
    email: emailMatch?.[0],
    phone: phoneMatch?.[0],
  };
}
