import React from 'react';
import { HospitalBranch, BranchId } from '../types/index.js';
import { MapPin, Phone, Clock, ExternalLink, Calendar, ShieldAlert } from 'lucide-react';

interface LocationsSectionProps {
  branches: HospitalBranch[];
  onBookAtBranch: (branchId: BranchId) => void;
}

export const LocationsSection: React.FC<LocationsSectionProps> = ({
  branches,
  onBookAtBranch,
}) => {
  return (
    <section id="locations" className="py-16 sm:py-20 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-3 mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
            <MapPin className="w-3.5 h-3.5 text-teal-600" />
            <span>Hospital Branches</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            Kakinada &amp; Pithapuram
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Conveniently located centers providing comprehensive outpatient pediatric consultations and emergency support.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {branches.map((branch) => (
            <div
              key={branch.id}
              id={`branch-card-${branch.id}`}
              className="bg-slate-50/70 rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs hover:border-teal-300 hover:bg-teal-50/20 transition-all flex flex-col justify-between"
            >
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-700 block mb-1">
                      {branch.id === 'kakinada' ? 'Main Hospital Branch' : 'Clinical Consulting Branch'}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900">{branch.name}</h3>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-semibold shrink-0 shadow-2xs">
                    {branch.id === 'kakinada' ? 'Kakinada' : 'Pithapuram'}
                  </span>
                </div>

                <div className="space-y-3 text-xs sm:text-sm text-slate-600">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-900 block">Address:</span>
                      <span>{branch.address}</span>
                      <span className="block text-slate-500 text-xs mt-0.5">Landmark: {branch.landmark}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-900 block">Consulting Timings:</span>
                      <span>{branch.timings}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Phone className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-900 block">Reception Phone:</span>
                      <span className="font-mono text-slate-800 font-medium">{branch.phone}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 bg-rose-50 rounded-xl border border-rose-100">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-rose-900 block text-xs">Emergency Contact:</span>
                      <span className="font-mono text-rose-800 font-bold text-xs">{branch.emergencyPhone}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-200/80 flex flex-col sm:flex-row gap-3">
                <button
                  id={`btn-book-branch-${branch.id}`}
                  onClick={() => onBookAtBranch(branch.id)}
                  className="flex-1 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Book at {branch.id === 'kakinada' ? 'Kakinada' : 'Pithapuram'}</span>
                </button>

                <a
                  href={branch.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 px-4 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <span>Google Maps</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
