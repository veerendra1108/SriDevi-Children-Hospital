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
  DoctorAccount,
  Hospital,
  HospitalAdminUser,
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
import { DoctorLoginModal } from './components/DoctorLoginModal.js';
import { BookAppointmentModal } from './components/BookAppointmentModal.js';
import { RescheduleModal } from './components/RescheduleModal.js';
import { ParentDashboard } from './components/ParentDashboard.js';
import { ReceptionDashboard } from './components/ReceptionDashboard.js';
import { DoctorDashboard } from './components/DoctorDashboard.js';
import { AnalyticsModal } from './components/AnalyticsModal.js';
import { TrackAppointmentModal } from './components/TrackAppointmentModal.js';
import { TeleconsultationSection } from './components/TeleconsultationSection.js';

// Doctormate SaaS Phase 1 Components
import { DoctormateHome } from './components/DoctormateHome.js';
import { PublicHospitalBooking } from './components/PublicHospitalBooking.js';
import { SecureTrackerView } from './components/SecureTrackerView.js';
import { HospitalRegistrationModal } from './components/HospitalRegistrationModal.js';
import { HospitalOnboardingWizard } from './components/HospitalOnboardingWizard.js';
import { HospitalAdminDashboard } from './components/HospitalAdminDashboard.js';
import { HospitalLoginModal } from './components/HospitalLoginModal.js';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>(() => {
    const saved = localStorage.getItem('sri_devi_active_tab');
    return (
      saved === 'doctor-desk' ||
      saved === 'reception-desk' ||
      saved === 'parent-portal' ||
      saved === 'hospital-admin' ||
      saved === 'hospital-booking' ||
      saved === 'track-appointment' ||
      saved === 'hospital-legacy'
    )
      ? saved
      : 'saas-home';
  });

  const [parentUser, setParentUser] = useState<Parent | null>(null);
  const [parentToken, setParentToken] = useState<string | null>(() => {
    return localStorage.getItem('sri_devi_parent_token');
  });

  const [receptionUser, setReceptionUser] = useState<{
    username: string;
    branchId: BranchId;
    name: string;
    hospitalId?: string;
    hospitalName?: string;
  } | null>(() => {
    const saved = localStorage.getItem('doctormate_reception_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [doctorUser, setDoctorUser] = useState<{
    doctor: Doctor;
    account: DoctorAccount;
    token: string;
  } | null>(null);

  // Hospital Admin session
  const [hospitalAdmin, setHospitalAdmin] = useState<{
    admin: HospitalAdminUser;
    hospital: Hospital;
    token: string;
  } | null>(() => {
    const saved = localStorage.getItem('doctormate_admin_session');
    return saved ? JSON.parse(saved) : null;
  });

  // Active hospital for public booking view
  const [activeHospitalSlug, setActiveHospitalSlug] = useState<string>('sri-devi');
  const [trackingToken, setTrackingToken] = useState<string | undefined>(undefined);
  const [onboardingHospital, setOnboardingHospital] = useState<Hospital | null>(null);

  // Modals
  const [isHospitalRegOpen, setIsHospitalRegOpen] = useState(false);
  const [isHospitalLoginOpen, setIsHospitalLoginOpen] = useState(false);
  const [isParentLoginOpen, setIsParentLoginOpen] = useState(false);
  const [isReceptionLoginOpen, setIsReceptionLoginOpen] = useState(false);
  const [isDoctorLoginOpen, setIsDoctorLoginOpen] = useState(false);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
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
    simulatedDate: new Date().toLocaleDateString('en-CA'),
    isSimulating: false,
    slotDurationMinutes: 15,
    bufferFrequencySlots: 4,
    bufferDurationMinutes: 15,
    reportingTimeMinutesBeforeSlot: 15,
    rescheduleCutoffMinutes: 60,
    notificationThresholdMinutes: 30,
    activeScenario: null,
  });

  // Synchronize activeTab in localStorage
  useEffect(() => {
    localStorage.setItem('sri_devi_active_tab', activeTab);
  }, [activeTab]);

  // Initial data loading
  useEffect(() => {
    loadHospitalData();
    restoreDoctorSession();

    // Cross-dashboard hospital clock synchronization
    const syncHospitalClock = async () => {
      try {
        const res = await fetch('/api/simulation/config');
        if (res.ok) {
          const cfg = await res.json();
          if (cfg && cfg.simulatedTime) {
            setConfig((prev) => {
              if (
                prev.simulatedTime !== cfg.simulatedTime ||
                prev.simulatedDate !== cfg.simulatedDate
              ) {
                return { ...prev, ...cfg };
              }
              return prev;
            });
          }
        }
      } catch {
        // Silently ignore background poll errors
      }
    };

    const syncInterval = setInterval(syncHospitalClock, 4000);
    return () => clearInterval(syncInterval);
  }, []);

  const restoreDoctorSession = async () => {
    const savedToken = localStorage.getItem('sri_devi_doctor_token');
    if (!savedToken) return;
    try {
      const res = await fetch('/api/doctor/me', {
        headers: { 'x-doctor-token': savedToken },
      });
      const data = await res.json();
      if (data.success && data.doctor && data.account) {
        setDoctorUser({ doctor: data.doctor, account: data.account, token: savedToken });
      }
    } catch (err) {
      console.error('Session restore failed:', err);
    }
  };

  const loadHospitalData = async () => {
    try {
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
    if (view === 'track') {
      setActiveTab('track-appointment');
      return;
    }
    if (view === 'saas-home') {
      setActiveTab('saas-home');
      return;
    }
    if (view === 'parent-dashboard') {
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
        setIsHospitalLoginOpen(true);
      }
      return;
    }
    if (view === 'doctor-desk' || view === 'doctor-dashboard') {
      if (doctorUser) {
        setActiveTab('doctor-desk');
      } else {
        setIsDoctorLoginOpen(true);
      }
      return;
    }

    // Scroll to landing page sections
    if (activeTab !== 'hospital-legacy') {
      setActiveTab('hospital-legacy');
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

  const handleAdvanceTime = async (minutes: number) => {
    try {
      const res = await fetch('/api/simulation/advance-time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minutes }),
      });
      const data = await res.json();
      if (data.newTime) {
        setConfig((prev) => ({ ...prev, simulatedTime: data.newTime }));
      }
      if (data.config) {
        setConfig(data.config);
      }
      loadHospitalData();
      if (parentUser) handleRefreshParent();
    } catch (err) {
      console.error('Advance time error:', err);
    }
  };

  const handleSetTime = async (time: string) => {
    try {
      const res = await fetch('/api/simulation/advance-time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetTime: time }),
      });
      const data = await res.json();
      if (data.newTime) {
        setConfig((prev) => ({ ...prev, simulatedTime: data.newTime }));
      }
      if (data.config) {
        setConfig(data.config);
      }
      loadHospitalData();
      if (parentUser) handleRefreshParent();
    } catch (err) {
      console.error('Set time error:', err);
    }
  };

  const handleSetDate = async (date: string) => {
    try {
      const res = await fetch('/api/simulation/set-date', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date }),
      });
      const data = await res.json();
      if (data.newDate) {
        setConfig((prev) => ({ ...prev, simulatedDate: data.newDate }));
      }
      if (data.config) {
        setConfig(data.config);
      }
      loadHospitalData();
      if (parentUser) handleRefreshParent();
    } catch (err) {
      console.error('Set date error:', err);
    }
  };

  const handleTriggerScenario = async (scenarioId: string) => {
    try {
      const res = await fetch('/api/simulation/trigger-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId }),
      });
      const data = await res.json();
      if (data.config) {
        setConfig(data.config);
      }
      loadHospitalData();
      if (parentUser) handleRefreshParent();
    } catch (err) {
      console.error('Trigger scenario error:', err);
    }
  };

  const handleRefreshAll = () => {
    loadHospitalData();
    if (parentUser) handleRefreshParent();
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

  const handleParentLoginSuccess = (parent: Parent, token?: string) => {
    setParentUser(parent);
    if (token) {
      setParentToken(token);
      localStorage.setItem('sri_devi_parent_token', token);
    }
    setActiveTab('parent-portal');
  };

  const handleReceptionLoginSuccess = (user: {
    username: string;
    branchId: BranchId;
    name: string;
    hospitalId?: string;
    hospitalName?: string;
  }) => {
    setReceptionUser(user);
    localStorage.setItem('doctormate_reception_user', JSON.stringify(user));
    setActiveTab('reception-desk');
  };

  const handleAdminLoginSuccess = (admin: HospitalAdminUser, hospital: Hospital, token: string) => {
    const session = { admin, hospital, token };
    setHospitalAdmin(session);
    localStorage.setItem('doctormate_admin_session', JSON.stringify(session));
    setActiveTab('hospital-admin');
  };

  const handleLogoutAdmin = () => {
    localStorage.removeItem('doctormate_admin_session');
    setHospitalAdmin(null);
    setActiveTab('saas-home');
  };

  const handleLogoutReception = () => {
    localStorage.removeItem('doctormate_reception_user');
    localStorage.removeItem('sri_devi_active_tab');
    setReceptionUser(null);
    setActiveTab('saas-home');
  };

  const handleLogoutParent = async () => {
    if (parentToken) {
      try {
        await fetch('/api/auth/parent-logout', {
          method: 'POST',
          headers: { 'x-parent-token': parentToken },
        });
      } catch (err) {}
    }
    localStorage.removeItem('sri_devi_parent_token');
    localStorage.removeItem('sri_devi_active_tab');
    setParentToken(null);
    setParentUser(null);
    setActiveTab('saas-home');
  };

  const handleLogoutDoctor = async () => {
    if (doctorUser?.token) {
      try {
        await fetch('/api/auth/doctor-logout', {
          method: 'POST',
          headers: { 'x-doctor-token': doctorUser.token },
        });
      } catch (err) {
        console.error(err);
      }
    }
    localStorage.removeItem('sri_devi_doctor_token');
    localStorage.removeItem('sri_devi_active_tab');
    setDoctorUser(null);
    setActiveTab('saas-home');
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

  // Quick switch navigation bar when viewing sub-pages
  const isSaasHome = activeTab === 'saas-home';
  const isLegacyWebsite = activeTab === 'hospital-legacy';

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 selection:bg-teal-100 selection:text-teal-900">
      {/* Dev Simulation Bar for testing real-world operational scenarios */}
      <SimulationBar
        config={config}
        simulatedTime={config.simulatedTime}
        simulatedDate={config.simulatedDate}
        onAdvanceTime={handleAdvanceTime}
        onSetTime={handleSetTime}
        onSetDate={handleSetDate}
        onTriggerScenario={handleTriggerScenario}
        onRefresh={handleRefreshAll}
        onConfigUpdate={handleConfigUpdate}
      />

      {/* Global Context Bar when navigating away from SaaS Home */}
      {!isSaasHome && !isLegacyWebsite && (
        <div className="bg-slate-900 text-white text-xs py-2 px-4 border-b border-slate-800">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab('saas-home')}
                className="font-bold text-teal-400 hover:text-white transition flex items-center gap-1"
              >
                ← Doctormate Platform
              </button>
              <span className="text-slate-600">|</span>
              <span className="text-slate-300 font-medium capitalize">
                {activeTab.replace('-', ' ')}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab('track-appointment')}
                className="text-teal-200 hover:text-white font-medium"
              >
                Track Live Queue
              </button>
              <span className="text-slate-600">|</span>
              <button
                onClick={() => setIsHospitalLoginOpen(true)}
                className="text-slate-300 hover:text-white font-medium"
              >
                Hospital Portal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header ONLY shown for legacy hospital site */}
      {isLegacyWebsite && (
        <Header
          currentView={activeTab}
          onNavigate={handleNavigate}
          parentUser={parentUser}
          receptionUser={receptionUser}
          doctorUser={doctorUser}
          onOpenParentLogin={() => setIsParentLoginOpen(true)}
          onOpenReceptionLogin={() => setIsReceptionLoginOpen(true)}
          onOpenDoctorLogin={() => setIsDoctorLoginOpen(true)}
          onLogoutParent={handleLogoutParent}
          onLogoutReception={handleLogoutReception}
          onLogoutDoctor={handleLogoutDoctor}
        />
      )}

      {/* Main View Switcher */}
      <main className="flex-1">
        {activeTab === 'saas-home' ? (
          <DoctormateHome
            onOpenRegister={() => setIsHospitalRegOpen(true)}
            onOpenLogin={() => setIsHospitalLoginOpen(true)}
            onOpenTracker={(tok) => {
              setTrackingToken(tok);
              setActiveTab('track-appointment');
            }}
            onSelectHospital={(slug) => {
              setActiveHospitalSlug(slug);
              setActiveTab('hospital-booking');
            }}
            onGoToReceptionDemo={() => {
              setReceptionUser({
                username: 'reception.kakinada',
                branchId: 'kakinada-main',
                name: 'Sri Devi Reception Desk',
                hospitalId: 'hosp_sdch',
                hospitalName: 'Sri Devi Children Hospital',
              });
              setActiveTab('reception-desk');
            }}
            onGoToAdminDemo={() => {
              handleAdminLoginSuccess(
                {
                  id: 'admin_sdch',
                  hospitalId: 'hosp_sdch',
                  name: 'Dr. M. Subba Rao',
                  email: 'admin@sridevi.com',
                  mobile: '9440112233',
                  role: 'HOSPITAL_ADMIN',
                  createdAt: new Date().toISOString(),
                },
                {
                  id: 'hosp_sdch',
                  slug: 'sri-devi',
                  name: 'Sri Devi Children Hospital',
                  address: 'Main Road',
                  city: 'Kakinada',
                  state: 'Andhra Pradesh',
                  pincode: '533001',
                  phone: '+91 944 011 2233',
                  adminName: 'Dr. M. Subba Rao',
                  adminEmail: 'admin@sridevi.com',
                  adminMobile: '9440112233',
                  hospitalType: 'Children Hospital & Research Institute',
                  status: 'ACTIVE',
                  onboardingStep: 6,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
                'demo-token'
              );
            }}
          />
        ) : activeTab === 'hospital-booking' ? (
          <PublicHospitalBooking
            hospitalSlug={activeHospitalSlug}
            onBackToHome={() => setActiveTab('saas-home')}
            onOpenTracker={(token) => {
              setTrackingToken(token);
              setActiveTab('track-appointment');
            }}
          />
        ) : activeTab === 'track-appointment' ? (
          <SecureTrackerView
            initialToken={trackingToken}
            onBack={() => setActiveTab('saas-home')}
            onBookNew={() => setActiveTab('hospital-booking')}
          />
        ) : activeTab === 'hospital-admin' ? (
          hospitalAdmin ? (
            <HospitalAdminDashboard
              hospitalId={hospitalAdmin.hospital.id}
              adminName={hospitalAdmin.admin.name}
              onLogout={handleLogoutAdmin}
              onNavigateToBooking={(slug) => {
                setActiveHospitalSlug(slug);
                setActiveTab('hospital-booking');
              }}
              onLaunchOnboarding={(hosp) => {
                setOnboardingHospital(hosp);
                setActiveTab('onboarding');
              }}
            />
          ) : (
            <div className="py-20 text-center">
              <p className="text-slate-600 mb-4">Please log in to access the Hospital Admin Portal.</p>
              <button
                onClick={() => setIsHospitalLoginOpen(true)}
                className="px-6 py-2.5 bg-teal-600 text-white rounded-xl font-semibold"
              >
                Admin Sign In
              </button>
            </div>
          )
        ) : activeTab === 'onboarding' && onboardingHospital ? (
          <HospitalOnboardingWizard
            hospital={onboardingHospital}
            onCompleted={(updatedHosp) => {
              if (hospitalAdmin) {
                setHospitalAdmin({ ...hospitalAdmin, hospital: updatedHosp });
              }
              setActiveTab('hospital-admin');
            }}
            onCancel={() => setActiveTab('hospital-admin')}
          />
        ) : activeTab === 'parent-portal' && parentUser ? (
          <ParentDashboard
            parentUser={parentUser}
            parentToken={parentToken}
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
            onConfigUpdate={handleConfigUpdate}
          />
        ) : activeTab === 'doctor-desk' && doctorUser ? (
          <DoctorDashboard
            doctorUser={doctorUser}
            config={config}
            onLogout={handleLogoutDoctor}
          />
        ) : (
          /* Legacy Sri Devi Website View */
          <div>
            <HeroSection
              onBookClick={() => handleOpenBooking()}
              onTrackClick={() => setIsTrackModalOpen(true)}
            />
            <TrustSection />
            <DoctorsSection
              doctors={doctors}
              schedules={schedules}
              onBookWithDoctor={(docId) => handleOpenBooking(docId)}
            />
            <TeleconsultationSection
              doctors={doctors}
              simulatedDate={config.simulatedDate}
              onBookInPerson={() => handleOpenBooking()}
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

      {/* Footer ONLY for legacy website */}
      {isLegacyWebsite && (
        <Footer
          onNavigate={handleNavigate}
          onOpenParentLogin={() => setIsParentLoginOpen(true)}
          onOpenReceptionLogin={() => setIsReceptionLoginOpen(true)}
        />
      )}

      {/* Hospital Registration Modal */}
      <HospitalRegistrationModal
        isOpen={isHospitalRegOpen}
        onClose={() => setIsHospitalRegOpen(false)}
        onRegistrationSuccess={(newHosp, tok) => {
          setIsHospitalRegOpen(false);
          setOnboardingHospital(newHosp);
          setHospitalAdmin({
            admin: {
              id: `admin_${Date.now()}`,
              hospitalId: newHosp.id,
              name: newHosp.adminName,
              email: newHosp.adminEmail,
              mobile: newHosp.adminMobile,
              role: 'HOSPITAL_ADMIN',
              createdAt: new Date().toISOString(),
            },
            hospital: newHosp,
            token: tok,
          });
          setActiveTab('onboarding');
        }}
      />

      {/* Hospital Login Modal (Admin & Reception) */}
      <HospitalLoginModal
        isOpen={isHospitalLoginOpen}
        onClose={() => setIsHospitalLoginOpen(false)}
        onAdminLoginSuccess={handleAdminLoginSuccess}
        onReceptionLoginSuccess={handleReceptionLoginSuccess}
        onOpenRegister={() => setIsHospitalRegOpen(true)}
      />

      {/* Legacy Modals */}
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

      <DoctorLoginModal
        isOpen={isDoctorLoginOpen}
        onClose={() => setIsDoctorLoginOpen(false)}
        onLoginSuccess={(doctor, account, token) => {
          setDoctorUser({ doctor, account, token });
          setActiveTab('doctor-desk');
        }}
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
        simulatedDate={config.simulatedDate}
        onBookingSuccess={() => {
          if (parentUser) handleRefreshParent();
        }}
        onViewDashboard={() => {
          setActiveTab('parent-portal');
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
          if (parentUser) handleRefreshParent();
        }}
      />

      <TrackAppointmentModal
        isOpen={isTrackModalOpen}
        onClose={() => setIsTrackModalOpen(false)}
        config={config}
        initialMobile={parentUser?.mobile || ''}
        onOpenBooking={() => {
          setIsTrackModalOpen(false);
          handleOpenBooking();
        }}
        onNavigateToParentPortal={() => {
          setIsTrackModalOpen(false);
          if (parentUser) {
            setActiveTab('parent-portal');
          } else {
            setIsParentLoginOpen(true);
          }
        }}
      />

      <AnalyticsModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
      />
    </div>
  );
}
