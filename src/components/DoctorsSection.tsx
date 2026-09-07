import React, { useState } from 'react';
import { Doctor, DoctorSchedule, BranchId } from '../types/index.js';
import { Calendar, Clock, MapPin, Award, CheckCircle2, ChevronRight, User, Info } from 'lucide-react';

interface DoctorsSectionProps {
  doctors: Doctor[];
  schedules?: DoctorSchedule[];
  onSelectDoctorToBook?: (doctorId: string, branchId: BranchId) => void;
  onBookWithDoctor?: (doctorId: string) => void;
}

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const DoctorsSection: React.FC<DoctorsSectionProps> = ({
  doctors,
  schedules = [],
  onSelectDoctorToBook,
  onBookWithDoctor,
}) => {
  const [selectedDoctorModal, setSelectedDoctorModal] = useState<Doctor | null>(null);

  const handleBookDoctor = (doctorId: string, branchId?: BranchId) => {
    if (onBookWithDoctor) {
      onBookWithDoctor(doctorId);
    } else if (onSelectDoctorToBook) {
      onSelectDoctorToBook(doctorId, branchId || 'kakinada');
    }
  };

  const getDoctorSchedules = (doctorId: string) => {
    if (!Array.isArray(schedules)) return [];
    return schedules.filter((s) => s.doctorId === doctorId && s.isAvailable);
  };

  return (
    <section id="doctors" className="py-16 sm:py-20 bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-3 mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
            <User className="w-3.5 h-3.5 text-teal-600" />
            <span>Senior Pediatric Leadership</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            Our Primary Doctors
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Experienced care. Personal attention. Trusted by generations of parents across Kakinada and Pithapuram.
          </p>
        </div>

        {/* Doctor Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {doctors.map((doctor) => {
            const docSchedules = getDoctorSchedules(doctor.id);

            return (
              <div
                key={doctor.id}
                id={`doctor-card-${doctor.id}`}
                className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Doctor Head */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-slate-100">
                    <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden shadow-md shrink-0 border-2 border-teal-100">
                      <img
                        src={doctor.photoUrl}
                        alt={doctor.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-teal-600/90 text-[10px] text-white font-bold">
                        {doctor.experienceYears}+ Yrs
                      </div>
                    </div>

                    <div className="space-y-2 text-center sm:text-left flex-1">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 text-xs font-semibold border border-teal-200">
                          Primary Pediatrician
                        </span>
                        {doctor.id === 'dr-subba-rao' && (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[11px] font-semibold border border-amber-200">
                            Selected Configured Days
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                        {doctor.name}
                      </h3>

                      <p className="text-xs font-medium text-teal-700">
                        {doctor.specialty}
                      </p>

                      <div className="text-xs text-slate-500 italic">
                        {doctor.qualifications}
                      </div>
                    </div>
                  </div>

                  {/* Summary / Placeholder */}
                  <div className="py-4 space-y-3">
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {doctor.summary}
                    </p>

                    {doctor.scheduleDescription && (
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-600 flex items-center gap-2">
                        <Info className="w-4 h-4 text-teal-600 shrink-0" />
                        <span>{doctor.scheduleDescription}</span>
                      </div>
                    )}
                  </div>

                  {/* Branch & Schedule Timings (Dynamic from Backend Schedule) */}
                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-teal-600" />
                      <span>Configured Consulting Schedules</span>
                    </h4>

                    <div className="space-y-2">
                      {docSchedules.length > 0 ? (
                        docSchedules.map((sch) => (
                          <div
                            key={sch.id}
                            className="p-2.5 rounded-xl bg-teal-50/50 border border-teal-100 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                              <span className="font-semibold text-slate-900 capitalize">
                                {sch.branchId} Branch:
                              </span>
                              <span className="text-slate-600">
                                {sch.daysOfWeek.map((d) => dayNames[d]).join(', ')}
                              </span>
                            </div>
                            <span className="font-mono font-medium text-teal-800">
                              {sch.startTime} - {sch.endTime}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-slate-500 italic p-2 bg-slate-50 rounded-lg">
                          Consulting schedules will be updated by reception.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-6 mt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
                  <button
                    id={`book-with-dr-btn-${doctor.id}`}
                    onClick={() => handleBookDoctor(doctor.id, doctor.branches[0] || 'kakinada')}
                    className="flex-1 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Book Appointment with {doctor.name.split(' ')[1]}</span>
                  </button>

                  <button
                    id={`view-profile-btn-${doctor.id}`}
                    onClick={() => setSelectedDoctorModal(doctor)}
                    className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs flex items-center justify-center gap-1 transition"
                  >
                    <span>Doctor Profile</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Doctor Profile Details Modal */}
        {selectedDoctorModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95">
              <button
                onClick={() => setSelectedDoctorModal(null)}
                className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                ✕
              </button>

              <div className="flex items-center gap-4">
                <img
                  src={selectedDoctorModal.photoUrl}
                  alt={selectedDoctorModal.name}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-teal-200"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedDoctorModal.name}</h3>
                  <p className="text-xs font-semibold text-teal-700">{selectedDoctorModal.specialty}</p>
                  <p className="text-xs text-slate-500">{selectedDoctorModal.experienceYears}+ Years Clinical Experience</p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-600">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-800 block mb-1">Qualifications:</span>
                  <span>{selectedDoctorModal.qualifications}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-800 block mb-1">Specialty &amp; Scope of Care:</span>
                  <span>Infant and neonatal stabilization, pediatric infectious illnesses, developmental nutrition, and family-centered consultation.</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-800 block mb-1">Consulting Locations:</span>
                  <span className="capitalize">{selectedDoctorModal.branches.join(' and ')}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  const doc = selectedDoctorModal;
                  setSelectedDoctorModal(null);
                  handleBookDoctor(doc.id, doc.branches[0] || 'kakinada');
                }}
                className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                <span>Proceed to Book Appointment</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
