import React from 'react';
import { HospitalReview } from '../types/index.js';
import { Star, MessageSquare, CheckCircle, ExternalLink, Heart } from 'lucide-react';

interface ReviewsSectionProps {
  reviews: HospitalReview[];
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({ reviews }) => {
  return (
    <section id="reviews" className="py-16 sm:py-20 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-3 mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
            <span>Parent Testimonials &amp; Trust</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            Parents’ Experiences
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Real feedback from families across Kakinada and Pithapuram who rely on Sri Devi Children Hospital for their children’s health.
          </p>

          {/* Rating Summary Card */}
          <div className="inline-flex flex-wrap items-center justify-center gap-6 p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 mt-4">
            <div className="flex items-center gap-2">
              <span className="text-3xl font-black text-slate-900">4.8</span>
              <div className="text-left">
                <div className="flex text-amber-500 text-sm">★★★★★</div>
                <div className="text-[11px] text-slate-500 font-medium">Google Review Average</div>
              </div>
            </div>
            <div className="h-8 w-px bg-amber-200 hidden sm:block" />
            <div className="text-xs text-slate-700 font-medium">
              <strong className="text-slate-900 block font-bold text-sm">1,000+ Families</strong>
              <span>Trusted in Kakinada &amp; Pithapuram</span>
            </div>
          </div>
        </div>

        {/* Review Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="p-6 rounded-3xl bg-slate-50/70 border border-slate-200/80 shadow-xs hover:border-teal-200 hover:bg-teal-50/20 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex text-amber-400 text-sm">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-[11px] text-slate-400">{review.date}</span>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                  “{review.comment}”
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-200/60 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-xs sm:text-sm">{review.parentName}</div>
                  {review.childName && (
                    <div className="text-[11px] text-teal-700 font-medium">Parent of {review.childName}</div>
                  )}
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 text-[11px] font-medium">
                  {review.branch} Branch
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
