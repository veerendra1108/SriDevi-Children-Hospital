import React, { useState } from 'react';
import { HospitalBranch } from '../types/index.js';
import { Phone, MapPin, Clock, Send, CheckCircle2, ShieldAlert, Mail } from 'lucide-react';

interface ContactSectionProps {
  branches: HospitalBranch[];
}

export const ContactSection: React.FC<ContactSectionProps> = ({ branches }) => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    branch: 'kakinada',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.mobile) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', mobile: '', branch: 'kakinada', message: '' });
    }, 4000);
  };

  return (
    <section id="contact" className="py-16 sm:py-20 bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-3 mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
            <Phone className="w-3.5 h-3.5 text-teal-600" />
            <span>Hospital Inquiries &amp; Assistance</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            Contact Sri Devi Children Hospital
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Reach our frontdesk team for scheduling questions, emergency guidance, or branch locations.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-5xl mx-auto">
          {/* Emergency and Branch Info */}
          <div className="lg:col-span-6 space-y-6">
            <div className="p-6 rounded-3xl bg-rose-50 border border-rose-200 text-rose-950 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <span>24/7 Pediatric Emergency Helplines</span>
              </div>
              <p className="text-xs text-rose-800/90 leading-relaxed">
                In acute childhood emergencies such as high fever convulsions, respiratory distress, or severe dehydration, proceed immediately to the hospital or call:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 bg-white rounded-xl border border-rose-200">
                  <span className="text-[11px] text-slate-500 block font-medium">Kakinada Emergency:</span>
                  <a href="tel:+919440112233" className="text-sm font-bold text-rose-700 font-mono">
                    +91 944 011 2233
                  </a>
                </div>
                <div className="p-3 bg-white rounded-xl border border-rose-200">
                  <span className="text-[11px] text-slate-500 block font-medium">Pithapuram Emergency:</span>
                  <a href="tel:+919440112244" className="text-sm font-bold text-rose-700 font-mono">
                    +91 944 011 2244
                  </a>
                </div>
              </div>
            </div>

            {/* Branch Cards */}
            <div className="space-y-4">
              {branches.map((b) => (
                <div key={b.id} className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
                  <h4 className="font-bold text-slate-900 text-sm">{b.name}</h4>
                  <div className="text-xs text-slate-600 flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                    <span>{b.address}</span>
                  </div>
                  <div className="text-xs text-slate-600 flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span className="font-mono font-medium">{b.phone}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Contact / Inquiry Form */}
          <div className="lg:col-span-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Send a Message to Reception</h3>
            <p className="text-xs text-slate-500 mb-6">
              Our frontdesk team responds quickly to parent queries regarding clinic timings and appointments.
            </p>

            {submitted ? (
              <div className="p-6 rounded-2xl bg-teal-50 border border-teal-200 text-center space-y-2 animate-in fade-in">
                <CheckCircle2 className="w-8 h-8 text-teal-600 mx-auto" />
                <h4 className="font-bold text-teal-900 text-sm">Message Received</h4>
                <p className="text-xs text-teal-700">
                  Thank you! Our reception desk will call you back shortly on your mobile number.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Parent Name *</label>
                  <input
                    id="contact-input-name"
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Mobile Number *</label>
                  <input
                    id="contact-input-mobile"
                    type="tel"
                    required
                    placeholder="10-digit mobile number"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Preferred Hospital Branch</label>
                  <select
                    id="contact-select-branch"
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="kakinada">Sri Devi Children Hospital - Kakinada</option>
                    <option value="pithapuram">Sri Devi Children Hospital - Pithapuram</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Message or Query</label>
                  <textarea
                    id="contact-textarea-message"
                    rows={3}
                    placeholder="E.g., Inquiring about Dr. Subba Rao's consulting day this week..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <button
                  id="contact-submit-btn"
                  type="submit"
                  className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Inquiry to Reception</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
