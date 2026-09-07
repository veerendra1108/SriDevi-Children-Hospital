import React from 'react';
import { HeartHandshake, Phone, MapPin, Clock, Shield, Award, Heart } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string) => void;
  onOpenParentLogin: () => void;
  onOpenReceptionLogin: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate,
  onOpenParentLogin,
  onOpenReceptionLogin,
}) => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-14 pb-10 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          {/* Hospital Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-sky-400 flex items-center justify-center text-white shadow-md">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-white text-lg leading-tight">Sri Devi Children Hospital</div>
                <div className="text-xs text-teal-400 font-medium">Kakinada • Pithapuram</div>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              “Great pediatric care is built on clinical experience, personal attention and the trust families place in their doctor.”
            </p>
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs">
              <span className="text-teal-300 font-semibold block mb-0.5">Core Hospital Mission:</span>
              <span className="text-slate-300">
                “Parents wait at home. Children spend less time waiting at the hospital.”
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Hospital Navigation</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button
                  id="footer-link-home"
                  onClick={() => onNavigate('home')}
                  className="hover:text-teal-400 transition"
                >
                  Home &amp; Overview
                </button>
              </li>
              <li>
                <button
                  id="footer-link-doctors"
                  onClick={() => onNavigate('doctors')}
                  className="hover:text-teal-400 transition"
                >
                  Our Pediatric Doctors
                </button>
              </li>
              <li>
                <button
                  id="footer-link-book"
                  onClick={() => onNavigate('book')}
                  className="hover:text-teal-400 transition"
                >
                  Book Consultation Slot
                </button>
              </li>
              <li>
                <button
                  id="footer-link-track"
                  onClick={() => onNavigate('track')}
                  className="hover:text-teal-400 transition text-teal-300 font-medium"
                >
                  Track Live Hospital Queue
                </button>
              </li>
              <li>
                <button
                  id="footer-link-locations"
                  onClick={() => onNavigate('locations')}
                  className="hover:text-teal-400 transition"
                >
                  Hospital Branches &amp; Directions
                </button>
              </li>
              <li>
                <button
                  id="footer-link-gallery"
                  onClick={() => onNavigate('gallery')}
                  className="hover:text-teal-400 transition"
                >
                  Hospital Facility Gallery
                </button>
              </li>
              <li>
                <button
                  id="footer-link-reviews"
                  onClick={() => onNavigate('reviews')}
                  className="hover:text-teal-400 transition"
                >
                  Parents Verified Reviews
                </button>
              </li>
            </ul>
          </div>

          {/* Kakinada & Pithapuram Branch Details */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Our Hospital Branches</h4>
            <div className="space-y-4 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-800">
                <strong className="text-teal-300 block mb-1">Kakinada Branch</strong>
                <p className="text-slate-400">Near Rama Rao Peta, Main Road, Kakinada, AP 533004</p>
                <p className="text-slate-300 mt-1 font-mono">Tel: +91 884 237 8899</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-800">
                <strong className="text-teal-300 block mb-1">Pithapuram Branch</strong>
                <p className="text-slate-400">Station Road, Opp. Municipal Complex, Pithapuram, AP 533450</p>
                <p className="text-slate-300 mt-1 font-mono">Tel: +91 8869 252 777</p>
              </div>
            </div>
          </div>

          {/* Portals & Emergency */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Hospital Portals</h4>
            <div className="space-y-3">
              <button
                id="footer-parent-portal-btn"
                onClick={onOpenParentLogin}
                className="w-full text-left p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs transition"
              >
                <span className="text-teal-300 font-semibold block">Parent Portal Login</span>
                <span className="text-[11px] text-slate-400">Book appointments, track queue &amp; view children profile</span>
              </button>

              <button
                id="footer-reception-portal-btn"
                onClick={onOpenReceptionLogin}
                className="w-full text-left p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs transition"
              >
                <span className="text-amber-300 font-semibold block">Receptionist Desk</span>
                <span className="text-[11px] text-slate-400">Manage queue, payments, doctor delays &amp; phone bookings</span>
              </button>

              <div className="pt-2">
                <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs mb-1">
                  <Phone className="w-3.5 h-3.5" />
                  24x7 Pediatric Emergency
                </div>
                <div className="font-mono text-sm text-white font-bold tracking-wide">
                  +91 944 011 2233
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Sri Devi Children Hospital. All rights reserved. Built with clinical integrity.</p>
          <div className="flex items-center gap-6">
            <span>Pediatric Confidentiality Protected</span>
            <span>•</span>
            <span>No Clinical Diagnostic Records Stored Online</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
