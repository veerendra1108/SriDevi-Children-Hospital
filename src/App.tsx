import React, { useState, useEffect } from 'react';
import {
  Doctor,
  DoctorSchedule,
  HospitalBranch,
  BranchId,
  Parent,
  Appointment,
  GalleryItem,
  HospitalReview,
  SystemConfiguration,
} from './types/index.js';
import { Header } from './components/Header.js';
import { Footer } from './components/Footer.js';
import { SimulationBar } from './components/SimulationBar.js';
import { HeroSection } from './components/HeroSection.js';
import { TrustSection } from './components/TrustSection.js';
import { DoctorsSection } from './components/DoctorsSection.js';
import { LocationsSection } from './components/LocationsSection.js';
import { GallerySection } from './components/GallerySection.js';
import { ReviewsSection } from './components/ReviewsSection.js';
import { ContactSection } from './components/ContactSection.js';
import { ParentLoginModal } from './components/ParentLoginModal.js';
import { ReceptionLoginModal } from './components/ReceptionLoginModal.js';
import { BookAppointmentModal } from './components/BookAppointmentModal.js';
import { RescheduleModal } from './components/RescheduleModal.js';
import { ParentDashboard } from './components/ParentDashboard.js';
import { ReceptionDashboard } from './components/ReceptionDashboard.js';
import { AnalyticsModal } from './components/AnalyticsModal.js';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [parentUser, setParentUser] = useState<Parent | null>(null);
  const [receptionUser, setReceptionUser] = useState<{
    username: string;
    branchId: BranchId;
    name: string;
  } | null>(null);

  // Modals
  const [isParentLoginOpen, setIsParentLoginOpen] = useState(false);
  const [isReceptionLoginOpen, setIsReceptionLoginOpen] = useState(false);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [rescheduleTargetAppt, setRescheduleTargetAppt] = useState<Appointment | null>(null);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);

  // Booking prep
  const [bookingDoctorId, setBookingDoctorId] = useState<string | undefined>(undefined);
  const [bookingBranchId, setBookingBranchId] = useState<BranchId | undefined>(undefined);

  // Hospital domain data
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [branches, setBranches] = useState<HospitalBranch[]>([]);
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [reviews, setReviews] = useState<HospitalReview[]>([]);
  const [config, setConfig] = useState<SystemConfiguration>({
    simulatedTime: '10:30',
    simulatedDate: new Date().toISOString().split('T')[0],
    isSimulating: false,
    slotDurationMinutes: 15,
    bufferFrequencySlots: 4,
    bufferDurationMinutes: 15,
    reportingTimeMinutesBeforeSlot: 15,
    rescheduleCutoffMinutes: 60,
    notificationThresholdMinutes: 30,
    activeScenario: null,
  });

  // Initial data loading
  useEffect(() => {
    loadHospitalData();
  }, []);

  const loadHospitalData = async () => {
    try {
      // First try unified public/info endpoint
      const res = await fetch('/api/public/info');
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (Array.isArray(data.doctors)) setDoctors(data.doctors);
        if (Array.isArray(data.branches)) setBranches(data.branches);
        if (Array.isArray(data.schedules)) setSchedules(data.schedules);
        if (Array.isArray(data.gallery)) setGallery(data.gallery);
        if (Array.isArray(data.reviews)) setReviews(data.reviews);
        if (data.config && data.config.simulatedTime) setConfig(data.config);
        return;
      }

      // Fallback: Individual endpoints
      const [docRes, branchRes, schRes, galRes, revRes, cfgRes] = await Promise.all([
        fetch('/api/doctors').catch(() => null),
        fetch('/api/branches').catch(() => null),
        fetch('/api/schedules').catch(() => null),
        fetch('/api/gallery').catch(() => null),
        fetch('/api/reviews').catch(() => null),
        fetch('/api/simulation/config').catch(() => null),
      ]);

      if (docRes && docRes.ok && docRes.headers.get('content-type')?.includes('application/json')) {
        const docs = await docRes.json();
        if (Array.isArray(docs)) setDoctors(docs);
      }
      if (branchRes && branchRes.ok && branchRes.headers.get('content-type')?.includes('application/json')) {
        const brs = await branchRes.json();
        if (Array.isArray(brs)) setBranches(brs);
      }
      if (schRes && schRes.ok && schRes.headers.get('content-type')?.includes('application/json')) {
        const schs = await schRes.json();
        if (Array.isArray(schs)) setSchedules(schs);
      }
      if (galRes && galRes.ok && galRes.headers.get('content-type')?.includes('application/json')) {
        const gals = await galRes.json();
        if (Array.isArray(gals)) setGallery(gals);
      }
      if (revRes && revRes.ok && revRes.headers.get('content-type')?.includes('application/json')) {
        const revs = await revRes.json();
        if (Array.isArray(revs)) setReviews(revs);
      }
      if (cfgRes && cfgRes.ok && cfgRes.headers.get('content-type')?.includes('application/json')) {
        const cfg = await cfgRes.json();
        if (cfg && cfg.simulatedTime) setConfig(cfg);
      }
    } catch (err) {
      console.warn('Initial hospital data fetch error:', err);
    }
  };

  const handleNavigate = (view: string) => {
    if (view === 'book') {
      handleOpenBooking();
      return;
    }
    if (view === 'track' || view === 'parent-dashboard') {
      if (parentUser) {
        setActiveTab('parent-portal');
      } else {
        setIsParentLoginOpen(true);
      }
      return;
    }
    if (view === 'reception-dashboard') {
      if (receptionUser) {
        setActiveTab('reception-desk');
      } else {
        setIsReceptionLoginOpen(true);
      }
      return;
    }

    // Scroll to landing page sections
    if (activeTab !== 'home') {
      setActiveTab('home');
      setTimeout(() => {
        if (view === 'home') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          const el = document.getElementById(view);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      if (view === 'home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const el = document.getElementById(view);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleConfigUpdate = (newConfig: SystemConfiguration) => {
    setConfig(newConfig);
  };

  const handleOpenBooking = (doctorId?: string, branchId?: BranchId) => {
    setBookingDoctorId(doctorId);
    setBookingBranchId(branchId);
    setIsBookModalOpen(true);
  };

  const handleOpenReschedule = (appointment: Appointment) => {
    setRescheduleTargetAppt(appointment);
    setIsRescheduleModalOpen(true);
  };

  const handleParentLoginSuccess = (parent: Parent) => {
    setParentUser(parent);
    setActiveTab('parent-portal');
  };

  const handleReceptionLoginSuccess = (user: {
    username: string;
    branchId: BranchId;
    name: string;
  }) => {
    setReceptionUser(user);
    setActiveTab('reception-desk');
  };

  const handleLogoutParent = () => {
    setParentUser(null);
    setActiveTab('home');
  };

  const handleLogoutReception = () => {
    setReceptionUser(null);
    setActiveTab('home');
  };

  const handleRefreshParent = async () => {
    if (!parentUser) return;
    try {
      const res = await fetch(`/api/parents/search?mobile=${parentUser.mobile}`);
      const data = await res.json();
      if (data && data.id) {
        setParentUser(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 selection:bg-teal-100 selection:text-teal-900">
      {/* Dev Simulation Bar for testing real-world operational scenarios */}
      <SimulationBar config={config} onConfigUpdate={handleConfigUpdate} />

      {/* Global Header */}
      <Header
        currentView={activeTab}
        onNavigate={handleNavigate}
        parentUser={parentUser}
        receptionUser={receptionUser}
        onOpenParentLogin={() => setIsParentLoginOpen(true)}
        onOpenReceptionLogin={() => setIsReceptionLoginOpen(true)}
        onLogoutParent={handleLogoutParent}
        onLogoutReception={handleLogoutReception}
      />

      {/* Main View Switcher */}
      <main className="flex-1">
        {activeTab === 'parent-portal' && parentUser ? (
          <ParentDashboard
            parentUser={parentUser}
            config={config}
            onOpenBookAppointment={() => handleOpenBooking()}
            onRescheduleAppointment={handleOpenReschedule}
            onLogout={handleLogoutParent}
            onRefreshParent={handleRefreshParent}
          />
        ) : activeTab === 'reception-desk' && receptionUser ? (
          <ReceptionDashboard
            receptionUser={receptionUser}
            doctors={doctors}
            branches={branches}
            config={config}
            onLogout={handleLogoutReception}
            onOpenAnalytics={() => setIsAnalyticsOpen(true)}
          />
        ) : (
          /* Public Website View */
          <div>
            <HeroSection
              onBookClick={() => handleOpenBooking()}
              onTrackQueueClick={() => {
                if (parentUser) {
                  setActiveTab('parent-portal');
                } else {
                  setIsParentLoginOpen(true);
                }
              }}
              onDoctorScheduleClick={() => {
                const el = document.getElementById('doctors');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            <TrustSection />

            <DoctorsSection
              doctors={doctors}
              schedules={schedules}
              onBookWithDoctor={(docId) => handleOpenBooking(docId)}
            />

            <LocationsSection
              branches={branches}
              onBookAtBranch={(bId) => handleOpenBooking(undefined, bId)}
            />

            <GallerySection gallery={gallery} />

            <ReviewsSection reviews={reviews} />

            <ContactSection branches={branches} />
          </div>
        )}
      </main>

      {/* Global Footer */}
      <Footer
        onNavigate={handleNavigate}
        onOpenParentLogin={() => setIsParentLoginOpen(true)}
        onOpenReceptionLogin={() => setIsReceptionLoginOpen(true)}
      />

      {/* Modals */}
      <ParentLoginModal
        isOpen={isParentLoginOpen}
        onClose={() => setIsParentLoginOpen(false)}
        onLoginSuccess={handleParentLoginSuccess}
      />

      <ReceptionLoginModal
        isOpen={isReceptionLoginOpen}
        onClose={() => setIsReceptionLoginOpen(false)}
        onLoginSuccess={handleReceptionLoginSuccess}
      />

      <BookAppointmentModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        parentUser={parentUser}
        onOpenParentLogin={() => setIsParentLoginOpen(true)}
        doctors={doctors}
        branches={branches}
        initialDoctorId={bookingDoctorId}
        initialBranchId={bookingBranchId}
        onBookingSuccess={() => {
          if (parentUser) {
            handleRefreshParent();
          }
        }}
      />

      <RescheduleModal
        isOpen={isRescheduleModalOpen}
        onClose={() => {
          setIsRescheduleModalOpen(false);
          setRescheduleTargetAppt(null);
        }}
        appointment={rescheduleTargetAppt}
        onRescheduleSuccess={() => {
          handleRefreshParent();
        }}
      />

      <AnalyticsModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
      />
    </div>
  );
}
