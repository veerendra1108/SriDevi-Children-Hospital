import React from 'react';
import {
  Calendar,
  Activity,
  ShieldCheck,
  HeartHandshake,
  Clock,
  Star,
  MapPin,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface HeroSectionProps {
  onBookClick: () => void;
  onTrackClick: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onBookClick, onTrackClick }) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-teal-50/70 via-sky-50/40 to-white pt-8 pb-16 lg:pt-14 lg:pb-24">
      {/* Decorative subtle background accents */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-teal-200/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-sky-200/20 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Text Content */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Location & Trust Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-100/80 border border-teal-200 text-teal-900 text-xs font-semibold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-teal-600" />
              <span>Sri Devi Children Hospital</span>
              <span className="text-teal-400">•</span>
              <span className="flex items-center gap-1 font-medium text-teal-800">
                <MapPin className="w-3 h-3" />
                Kakinada &amp; Pithapuram
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Trusted Pediatric Care.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-700 via-teal-600 to-sky-600">
                Less Waiting.
              </span>
            </h1>

            {/* Supporting Subtext */}
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Book your child’s consultation time and track the live queue from home. Spend less time waiting at the hospital and more time caring for your child.
            </p>

            {/* Call to Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button
                id="hero-book-appointment-btn"
                onClick={onBookClick}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-base shadow-lg shadow-teal-600/25 hover:shadow-teal-600/35 transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                <Calendar className="w-5 h-5 text-teal-200 group-hover:scale-110 transition-transform" />
                <span>Book Appointment</span>
                <ChevronRight className="w-4 h-4 text-teal-200 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                id="hero-track-appointment-btn"
                onClick={onTrackClick}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white hover:bg-sky-50 text-slate-800 border border-slate-200 hover:border-sky-300 font-semibold text-base shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Activity className="w-5 h-5 text-teal-600" />
                <span>Track My Appointment</span>
              </button>
            </div>

            {/* Reassuring Philosophy Statement */}
            <div className="pt-3 text-xs sm:text-sm text-slate-500 italic max-w-xl mx-auto lg:mx-0">
              “Great pediatric care is built on clinical experience, personal attention and the trust families place in their doctor.”
            </div>
          </div>

          {/* Right Visual Image & Live Card Mockup */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Doctor / Pediatric Care Image Card */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-white">
                <img
                  src="https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80"
                  alt="Pediatric doctor caring gently for a child patient"
                  className="w-full h-80 sm:h-96 object-cover object-top"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="text-xs font-semibold uppercase tracking-wider text-teal-300">
                    Sri Devi Children Hospital
                  </div>
                  <div className="text-base font-bold">
                    Experienced Pediatric Leadership
                  </div>
                  <div className="text-xs text-slate-200">
                    Dr. Subba Rao Vadarevu • Dr. Prashant
                  </div>
                </div>
              </div>

              {/* Floating Google Rating Trust Card */}
              <div className="absolute -bottom-6 -left-4 sm:-left-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500">
                  <Star className="w-7 h-7 fill-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-lg font-bold text-slate-900">4.8</span>
                    <span className="text-xs text-amber-500 font-semibold">★★★★★</span>
                  </div>
                  <div className="text-xs font-medium text-slate-500">Google Verified Rating</div>
                  <div className="text-[11px] text-teal-700 font-semibold">Trusted by 1,000+ families</div>
                </div>
              </div>

              {/* Floating Queue Promise Card */}
              <div className="hidden sm:flex absolute -top-4 -right-4 bg-teal-900 text-white p-3.5 rounded-2xl shadow-xl border border-teal-800 items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-800 flex items-center justify-center text-teal-300">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] text-teal-300 font-medium">Smart Queue Engine</div>
                  <div className="text-xs font-bold">Arrive 15 min before slot</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Strip Beneath Hero */}
        <div className="mt-16 pt-8 border-t border-slate-200/80">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/70 border border-slate-100 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Experienced Pediatric Care</h4>
                <p className="text-xs text-slate-500">Decades of clinical care trusted by generations</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/70 border border-slate-100 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Personal Attention</h4>
                <p className="text-xs text-slate-500">Patient doctor-parent dialogue without rush</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/70 border border-slate-100 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Convenient Booking</h4>
                <p className="text-xs text-slate-500">Pick exact 15-min consultation times</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/70 border border-slate-100 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Live Queue Updates</h4>
                <p className="text-xs text-slate-500">Real-time ETA prevents long hospital waiting</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
