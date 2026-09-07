import React, { useState } from 'react';
import { GalleryItem } from '../types/index.js';
import { Image as ImageIcon, X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

interface GallerySectionProps {
  gallery: GalleryItem[];
}

export const GallerySection: React.FC<GallerySectionProps> = ({ gallery }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);

  const categories = ['All', 'Facilities', 'Doctors', 'Waiting Area', 'Pediatric Care', 'Hospital'];

  const safeGallery = Array.isArray(gallery) ? gallery : [];
  const filteredItems = selectedCategory === 'All'
    ? safeGallery
    : safeGallery.filter((item) => item.category === selectedCategory);

  const openLightbox = (index: number) => {
    setActiveLightboxIndex(index);
  };

  const closeLightbox = () => {
    setActiveLightboxIndex(null);
  };

  const nextImage = () => {
    if (activeLightboxIndex !== null) {
      setActiveLightboxIndex((activeLightboxIndex + 1) % filteredItems.length);
    }
  };

  const prevImage = () => {
    if (activeLightboxIndex !== null) {
      setActiveLightboxIndex((activeLightboxIndex - 1 + filteredItems.length) % filteredItems.length);
    }
  };

  return (
    <section id="gallery" className="py-16 sm:py-20 bg-slate-50/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-3 mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
            <ImageIcon className="w-3.5 h-3.5 text-teal-600" />
            <span>Hospital Environment</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            Hospital Gallery &amp; Facilities
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Take a look inside our clean, child-comforting examination suites, waiting lounges, and clinical areas.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center justify-center flex-wrap gap-2 mb-10">
          {categories.map((cat) => (
            <button
              key={cat}
              id={`gallery-cat-${cat.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/25'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => openLightbox(idx)}
              className="group cursor-pointer bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col"
            >
              <div className="relative h-56 sm:h-64 overflow-hidden bg-slate-100">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-slate-900/70 backdrop-blur-xs text-white text-[11px] font-medium">
                  {item.category}
                </div>
                <div className="absolute inset-0 bg-teal-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-white/90 text-teal-800 flex items-center justify-center shadow-lg">
                    <ZoomIn className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base mb-1.5">{item.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{item.caption}</p>
                </div>
                <div className="pt-3 mt-3 border-t border-slate-100 text-[11px] text-teal-700 font-semibold flex items-center gap-1">
                  <span>Sri Devi Children Hospital</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Lightbox Modal */}
        {activeLightboxIndex !== null && filteredItems[activeLightboxIndex] && (
          <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
            <button
              onClick={closeLightbox}
              className="absolute top-5 right-5 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition z-10"
              aria-label="Close Lightbox"
            >
              <X className="w-6 h-6" />
            </button>

            {filteredItems.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition z-10"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition z-10"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            <div className="max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center p-2">
              <img
                src={filteredItems[activeLightboxIndex].imageUrl}
                alt={filteredItems[activeLightboxIndex].title}
                className="max-h-[70vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
                referrerPolicy="no-referrer"
              />
              <div className="mt-4 text-center max-w-xl text-white">
                <span className="text-xs text-teal-400 font-semibold uppercase tracking-wider block mb-1">
                  {filteredItems[activeLightboxIndex].category}
                </span>
                <h3 className="text-lg font-bold">{filteredItems[activeLightboxIndex].title}</h3>
                <p className="text-xs text-slate-300 mt-1">{filteredItems[activeLightboxIndex].caption}</p>
                <div className="text-[11px] text-slate-400 mt-2">
                  {activeLightboxIndex + 1} of {filteredItems.length}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
