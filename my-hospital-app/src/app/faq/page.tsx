'use client'

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type FAQ = { category: string; question: string; answer: string };

const faqs: FAQ[] = [
  { category: 'General', question: 'What are the hospital visiting hours?', answer: 'Visiting hours are from 9 AM to 8 PM every day.' },
  { category: 'Appointments', question: 'How can I book an appointment?', answer: 'You can book an appointment online or by calling our reception.' },
  { category: 'Pharmacy', question: 'Can I get prescribed medicines delivered home?', answer: 'Yes, we offer home delivery for prescribed medicines within city limits.' },
  { category: 'Ambulance', question: 'How can I contact the hospital ambulance service?', answer: 'Visit our Ambulance page or call the number displayed on the main page popup.' },
  { category: 'Blood Donation', question: 'How do I register for blood donation?', answer: "Visit the 'Donate Blood' page from the main menu or popup to register." },
];

export default function FAQPage() {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const grouped = useMemo(() => {
    const groups: Record<string, FAQ[]> = {};
    for (const f of faqs) {
      const key = f.category || 'General';
      if (!groups[key]) groups[key] = [];
      groups[key].push(f);
    }
    return groups;
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return grouped;
    const out: Record<string, FAQ[]> = {};
    Object.entries(grouped).forEach(([cat, items]) => {
      const keep = items.filter(x => x.question.toLowerCase().includes(q) || x.answer.toLowerCase().includes(q));
      if (keep.length) out[cat] = keep;
    });
    return out;
  }, [grouped, query]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      <div className="max-w-3xl mx-auto mt-10 p-6">
        <h2 className="text-2xl font-bold text-center text-[#0077b6] mb-6">Frequently Asked Questions</h2>

        {/* Search (optional) */}
        <div className="mb-6">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions..."
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>

        <div className="space-y-8">
          {Object.entries(filtered).map(([category, items]) => (
            <div key={category} className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">{categoryIcon(category)}</span>
                <h3 className="text-xl font-semibold text-blue-700">{category}</h3>
              </div>

              <ul className="space-y-3">
                {items.map((faq, idx) => {
                  const idxKey = `${category}-${idx}`;
                  const isOpen = openKey === idxKey;
                  return (
                    <li key={idxKey} className="border border-slate-200 rounded-xl overflow-hidden">
                      <button
                        className="w-full flex items-center justify-between gap-3 text-left px-4 py-3 bg-white hover:bg-blue-50 transition-all duration-300 ease-in-out"
                        onClick={() => setOpenKey(prev => (prev === idxKey ? null : idxKey))}
                        aria-expanded={isOpen}
                      >
                        <span className="text-blue-700 font-semibold">{faq.question}</span>
                        <span className={`transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} aria-hidden>
                          ▸
                        </span>
                      </button>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            key="content"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="px-4 pb-4"
                          >
                            <p className="text-slate-600 mt-2">{faq.answer}</p>
                            {/* Bonus (placeholder) */}
                            <div className="mt-3 text-xs text-slate-500 select-none">Did this help? 👍 👎</div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function categoryIcon(cat: string) {
  const c = cat.toLowerCase();
  if (c.includes('general')) return '🏥';
  if (c.includes('appointment')) return '👩‍⚕️';
  if (c.includes('pharmacy')) return '💊';
  if (c.includes('ambulance') || c.includes('emergency')) return '🚑';
  if (c.includes('blood')) return '🩸';
  return '❓';
}
