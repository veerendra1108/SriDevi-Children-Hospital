import React from 'react';
import { Award, Heart, Sparkles, CheckCircle2, Shield, Users } from 'lucide-react';

export const TrustSection: React.FC = () => {
  const highlights = [
    {
      title: 'Experienced Pediatric Care',
      desc: 'Deep clinical mastery treating thousands of neonatal, infant, and childhood illnesses over decades.',
    },
    {
      title: 'Personal Doctor–Parent Relationship',
      desc: 'Doctors who know your child’s history, listen patiently, and treat every family with warmth and dignity.',
    },
    {
      title: 'Continuity of Care',
      desc: 'Same trusted senior doctors for subsequent checkups, vaccinations, and growth milestones.',
    },
    {
      title: 'Child-Focused Environment',
      desc: 'Designed to reduce fear and anxiety in children with gentle examination and clean spaces.',
    },
    {
      title: 'Trusted by Generations of Families',
      desc: 'Parents in Kakinada and Pithapuram who were treated here as children now bring their own kids.',
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5 text-sky-600" />
            <span>Our Clinical Philosophy</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            “Healthcare is built on trust.”
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Modern healthcare does not depend only on the size of a hospital. For parents, what matters most is the experience of the doctor, personal attention and the confidence that their child is in trusted hands.
          </p>

          <p className="text-sm sm:text-base text-teal-800 font-medium leading-relaxed">
            At Sri Devi Children Hospital, we believe pediatric care should remain personal, accessible and centered around every child.
          </p>
        </div>

        {/* Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {highlights.map((item, index) => (
            <div
              key={index}
              className="p-5 rounded-2xl bg-slate-50/70 border border-slate-100 hover:border-teal-200 hover:bg-teal-50/30 transition-all duration-200 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs">
                  0{index + 1}
                </div>
                <h3 className="font-bold text-slate-900 text-sm">{item.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
              <div className="pt-4 flex items-center gap-1 text-[11px] font-semibold text-teal-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Hospital Standard</span>
              </div>
            </div>
          ))}
        </div>

        {/* Quotes Strip */}
        <div className="mt-14 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-teal-900 to-sky-900 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-teal-300 text-xs uppercase tracking-widest font-semibold">
              Most Trusted Children’s Hospital by Parents in Kakinada
            </span>
            <h3 className="text-lg sm:text-xl font-bold">
              “Treatment is not about how large a hospital is. It is about the experience of the doctor and the trust between the doctor and the family.”
            </h3>
            <p className="text-xs text-teal-100/90">
              Serving Kakinada and Pithapuram with consistent dedication and compassionate child healthcare.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <div className="px-5 py-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15 text-center">
              <div className="text-2xl font-black text-white">28+</div>
              <div className="text-[11px] text-teal-200">Years of Experience</div>
            </div>
            <div className="px-5 py-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15 text-center">
              <div className="text-2xl font-black text-white">100%</div>
              <div className="text-[11px] text-teal-200">Child-Centered Care</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
