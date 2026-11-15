'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useId,
} from 'react';
import Image from 'next/image';
import BrandLogo from '@/components/ui/BrandLogo';
import styles from './AdvisorModal.module.css';
import { BRAND_INFO, PROGRAMS_DATA } from '@/data/siteData';
import { submitAdvisoryEnquiryAction, advisoryInquirySchema } from '@/app/actions/advisory';

/* ==========================================================================
   Types & Context Definitions
   ========================================================================== */

export interface AdvisorModalContextType {
  isOpen: boolean;
  selectedCourse: string;
  openModal: (course?: string) => void;
  closeModal: () => void;
}

const AdvisorModalContext = createContext<AdvisorModalContextType>({
  isOpen: false,
  selectedCourse: '',
  openModal: () => {},
  closeModal: () => {},
});

export function AdvisorModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');

  const openModal = useCallback((course?: string) => {
    setSelectedCourse(course || '');
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <AdvisorModalContext.Provider value={{ isOpen, selectedCourse, openModal, closeModal }}>
      {children}
      <AdvisorModalDialog />
    </AdvisorModalContext.Provider>
  );
}

export function useAdvisorModal() {
  return useContext(AdvisorModalContext);
}

/* ==========================================================================
   Domain Data: Profiles & Curricula
   ========================================================================== */

export const ADVISOR_PROFILES = [
  { value: 'College Student', label: 'College & Degree Student' },
  { value: 'Fresh Graduate', label: 'Fresh Graduate / Job Seeker' },
  { value: 'Working Professional', label: 'Working Professional' },
  { value: 'Entrepreneur / Founder', label: 'Founder / Entrepreneur' },
  { value: 'Other', label: 'Other / Career Switcher' },
] as const;

export const ADVISOR_PROGRAMMES = [
  ...PROGRAMS_DATA.map((prog) => ({ value: prog.name, label: prog.name })),
  { value: 'Not sure yet / General assessment', label: 'Not sure yet (Recommend a track)' },
];

/* ==========================================================================
   Main Dialog Component
   ========================================================================== */

export interface AdvisorModalDialogProps {
  defaultCourse?: string;
}

export function AdvisorModalDialog({ defaultCourse }: AdvisorModalDialogProps = {}) {
  const { isOpen, selectedCourse, closeModal } = useAdvisorModal();

  // Animation lifecycle
  const [isMounted, setIsMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [profile, setProfile] = useState<string>(ADVISOR_PROFILES[0].value);
  const [programme, setProgramme] = useState<string>('');
  const [isNoteExpanded, setIsNoteExpanded] = useState(false);
  const [note, setNote] = useState('');
  const [honeypot, setHoneypot] = useState('');

  // Dropdown States for Custom Listbox
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isProgrammeOpen, setIsProgrammeOpen] = useState(false);

  // Submission & Validation States
  const [errors, setErrors] = useState<{
    name?: string;
    phone?: string;
    email?: string;
    general?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Accessibility & DOM references
  const dialogRef = useRef<HTMLDivElement>(null);
  const successHeadingRef = useRef<HTMLHeadingElement>(null);
  const lastActiveElementRef = useRef<HTMLElement | null>(null);
  const profileListboxRef = useRef<HTMLDivElement>(null);
  const programmeListboxRef = useRef<HTMLDivElement>(null);

  // Unique IDs for accessibility
  const nameId = useId();
  const phoneId = useId();
  const emailId = useId();
  const profileId = useId();
  const programmeId = useId();
  const noteId = useId();
  const dialogHeadingId = useId();

  // Handle open / course sync
  useEffect(() => {
    if (isOpen) {
      lastActiveElementRef.current = document.activeElement as HTMLElement | null;
      setIsMounted(true);
      setIsClosing(false);
      setIsSuccess(false);
      setErrors({});

      const initialCourse = selectedCourse || defaultCourse || '';
      setProgramme(initialCourse);
    }
  }, [isOpen, selectedCourse, defaultCourse]);

  // Graceful Close with 200ms exit animation
  const handleRequestClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsMounted(false);
      setIsClosing(false);
      setIsProfileOpen(false);
      setIsProgrammeOpen(false);
      closeModal();

      // Return focus to previous trigger
      if (lastActiveElementRef.current && typeof lastActiveElementRef.current.focus === 'function') {
        lastActiveElementRef.current.focus();
      }
    }, 200);
  }, [closeModal]);

  // Escape key & Body Scroll Lock without layout shift
  useEffect(() => {
    if (!isMounted) return;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isProfileOpen) {
          setIsProfileOpen(false);
        } else if (isProgrammeOpen) {
          setIsProgrammeOpen(false);
        } else {
          handleRequestClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMounted, isProfileOpen, isProgrammeOpen, handleRequestClose]);

  // Outside click listener for listbox dropdowns
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (profileListboxRef.current && !profileListboxRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
      if (programmeListboxRef.current && !programmeListboxRef.current.contains(e.target as Node)) {
        setIsProgrammeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Focus trap inside modal
  const handleKeyDownTrap = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab' || !dialogRef.current) return;

    const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  // Focus heading upon success
  useEffect(() => {
    if (isSuccess && successHeadingRef.current) {
      successHeadingRef.current.focus();
    }
  }, [isSuccess]);

  if (!isMounted && !isOpen) return null;

  // Client-side Zod validation
  const validateForm = () => {
    const parseResult = advisoryInquirySchema.safeParse({
      name,
      phone,
      email,
      profile,
      course: programme || 'General Academic Assessment',
      message: note,
      honeypot,
    });

    if (!parseResult.success) {
      const nextErrors: typeof errors = {};
      for (const issue of parseResult.error.issues) {
        const field = issue.path[0] as string;
        if (!nextErrors[field as keyof typeof errors]) {
          nextErrors[field as keyof typeof errors] = issue.message;
        }
      }
      setErrors(nextErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  // Form Submit Handler wired via Next.js Server Action
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Honeypot check: silently drop bots
    if (honeypot) {
      setIsSuccess(true);
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const result = await submitAdvisoryEnquiryAction({
        name,
        phone,
        email,
        profile,
        course: programme || 'General Academic Assessment',
        message: note,
        honeypot,
      });

      if (result.success) {
        setIsSuccess(true);
      } else {
        setErrors({
          general: result.error,
          ...result.fieldErrors,
        });
      }
    } catch {
      setErrors({
        general: 'An unexpected connection error occurred. Please try again or reach out on WhatsApp.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedProfileObj = ADVISOR_PROFILES.find((p) => p.value === profile);
  const selectedProgrammeObj = ADVISOR_PROGRAMMES.find((p) => p.value === programme);

  return (
    <div
      className={`${styles.backdrop} ${isClosing ? styles.backdropClosing : styles.backdropOpen}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleRequestClose();
      }}
      aria-hidden={!isOpen}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogHeadingId}
        onKeyDown={handleKeyDownTrap}
        className={`${styles.dialog} ${isClosing ? styles.dialogClosing : styles.dialogOpen}`}
      >
        {/* ====================================================================
            LEFT PANEL: 300px, Deep Navy (#0a1628), Padding 40px
            ==================================================================== */}
        <div className={styles.leftPanel}>
          <div className={styles.leftTop}>
            {/* Official Brand Logo Lockup */}
            <div className={styles.brandLockup}>
              <BrandLogo variant="dark" size="sm" showTagline={true} />
            </div>

            {/* Headline (Serif Display, 30px / 1.2, off-white) */}
            <h1 id={dialogHeadingId} className={styles.leftHeadline}>
              Talk to an academic advisor
            </h1>

            {/* Hairline Rule */}
            <hr className={styles.hairline} />

            {/* Four Short Lines in Muted Blue-Grey, No Bullets, 15px */}
            <ul className={styles.leftCurriculumList}>
              <li className={styles.leftCurriculumItem}>Curriculum details</li>
              <li className={styles.leftCurriculumItem}>Batch schedules</li>
              <li className={styles.leftCurriculumItem}>Hands-on lab projects</li>
              <li className={styles.leftCurriculumItem}>Digital certification</li>
            </ul>
          </div>

          {/* Bottom, Pinned: Phone + WhatsApp with hairline above */}
          <div className={styles.leftBottom}>
            <hr className={styles.hairline} />
            <div className={styles.leftContactRow}>
              <a href="tel:+919442605096" className={styles.contactLink}>
                +91 94426 05096
              </a>
              <span className={styles.contactDivider} aria-hidden="true">
                /
              </span>
              <a
                href={BRAND_INFO.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.contactLink}
              >
                WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* ====================================================================
            RIGHT PANEL: Warm Paper (#f6f4ef), Padding 48px 44px
            ==================================================================== */}
        <div className={styles.rightPanel}>
          {/* Header Row: Label top-left, Bare 24px × glyph top-right */}
          <div className={styles.rightHeader}>
            <span className={styles.panelLabel}>Enquiry</span>
            <button
              type="button"
              onClick={handleRequestClose}
              className={styles.closeButton}
              aria-label="Close dialog"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>

          {isSuccess ? (
            /* Calm Confirmation View */
            <div className={styles.successPanel}>
              <h2
                ref={successHeadingRef}
                tabIndex={-1}
                className={styles.successHeading}
              >
                Thank you
              </h2>
              <p className={styles.successMessage}>
                An advisor will be in touch on the number you provided.
              </p>
              <button
                type="button"
                onClick={handleRequestClose}
                className={styles.successCloseLink}
              >
                Close
              </button>
            </div>
          ) : (
            /* Fields Stacked with 28px Rhythm */
            <form onSubmit={handleSubmit} noValidate>
              
              {/* General Failure Message */}
              {errors.general && (
                <div role="alert" className={styles.inlineFailure}>
                  {errors.general}
                </div>
              )}

              {/* Hidden Honeypot for Anti-Bot protection */}
              <input
                type="text"
                name="website_url_check"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', height: 0 }}
                aria-hidden="true"
              />

              <div className={styles.formStack}>
                
                {/* 1. Full name (required) */}
                <div className={styles.fieldGroup}>
                  <label htmlFor={nameId} className={styles.fieldLabel}>
                    <span>
                      Full name <span className={styles.requiredMarker}>(required)</span>
                    </span>
                  </label>
                  <input
                    id={nameId}
                    type="text"
                    name="name"
                    required
                    autoComplete="name"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                    }}
                    className={`${styles.underlinedInput} ${errors.name ? styles.inputError : ''}`}
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? `${nameId}-error` : undefined}
                  />
                  {errors.name && (
                    <div id={`${nameId}-error`} className={styles.errorMessage}>
                      {errors.name}
                    </div>
                  )}
                </div>

                {/* 2. Phone / WhatsApp (required) and Email (required) side by side */}
                <div className={styles.fieldRow}>
                  {/* Phone */}
                  <div className={styles.fieldGroup}>
                    <label htmlFor={phoneId} className={styles.fieldLabel}>
                      <span>
                        Phone / WhatsApp <span className={styles.requiredMarker}>(required)</span>
                      </span>
                    </label>
                    <input
                      id={phoneId}
                      type="tel"
                      name="phone"
                      required
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="+91 94426 05096"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                      }}
                      className={`${styles.underlinedInput} ${errors.phone ? styles.inputError : ''}`}
                      aria-invalid={!!errors.phone}
                      aria-describedby={errors.phone ? `${phoneId}-error` : undefined}
                    />
                    {errors.phone && (
                      <div id={`${phoneId}-error`} className={styles.errorMessage}>
                        {errors.phone}
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div className={styles.fieldGroup}>
                    <label htmlFor={emailId} className={styles.fieldLabel}>
                      <span>
                        Email <span className={styles.requiredMarker}>(required)</span>
                      </span>
                    </label>
                    <input
                      id={emailId}
                      type="email"
                      name="email"
                      required
                      autoComplete="email"
                      placeholder="your.name@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                      }}
                      className={`${styles.underlinedInput} ${errors.email ? styles.inputError : ''}`}
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? `${emailId}-error` : undefined}
                    />
                    {errors.email && (
                      <div id={`${emailId}-error`} className={styles.errorMessage}>
                        {errors.email}
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Current profile and Programme of interest side by side */}
                <div className={styles.fieldRow}>
                  {/* Current Profile Custom Accessible Listbox */}
                  <div className={styles.fieldGroup} ref={profileListboxRef}>
                    <label id={`${profileId}-label`} className={styles.fieldLabel}>
                      <span>Current profile</span>
                    </label>
                    
                    <button
                      type="button"
                      id={profileId}
                      aria-haspopup="listbox"
                      aria-expanded={isProfileOpen}
                      aria-labelledby={`${profileId}-label ${profileId}`}
                      onClick={() => {
                        setIsProfileOpen((prev) => !prev);
                        setIsProgrammeOpen(false);
                      }}
                      className={`${styles.listboxTrigger} ${isProfileOpen ? styles.listboxTriggerOpen : ''}`}
                    >
                      <span className={styles.listboxValue}>
                        {selectedProfileObj ? selectedProfileObj.label : 'Select profile'}
                      </span>
                      <svg
                        className={`${styles.chevronGlyph} ${isProfileOpen ? styles.chevronGlyphOpen : ''}`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>

                    {/* Popover options list */}
                    {isProfileOpen && (
                      <ul
                        role="listbox"
                        aria-labelledby={`${profileId}-label`}
                        className={styles.listboxMenu}
                      >
                        {ADVISOR_PROFILES.map((item) => (
                          <li
                            key={item.value}
                            role="option"
                            aria-selected={profile === item.value}
                            onClick={() => {
                              setProfile(item.value);
                              setIsProfileOpen(false);
                            }}
                            className={`${styles.listboxOption} ${
                              profile === item.value ? styles.listboxOptionSelected : ''
                            }`}
                          >
                            <span>{item.label}</span>
                            {profile === item.value && (
                              <span aria-hidden="true" style={{ fontSize: '12px' }}>
                                ✓
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Native fallback for touch devices */}
                    <select
                      className={styles.nativeSelect}
                      value={profile}
                      onChange={(e) => setProfile(e.target.value)}
                      aria-hidden="true"
                      tabIndex={-1}
                    >
                      {ADVISOR_PROFILES.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Programme of Interest Custom Accessible Listbox */}
                  <div className={styles.fieldGroup} ref={programmeListboxRef}>
                    <label id={`${programmeId}-label`} className={styles.fieldLabel}>
                      <span>Programme of interest</span>
                    </label>

                    <button
                      type="button"
                      id={programmeId}
                      aria-haspopup="listbox"
                      aria-expanded={isProgrammeOpen}
                      aria-labelledby={`${programmeId}-label ${programmeId}`}
                      onClick={() => {
                        setIsProgrammeOpen((prev) => !prev);
                        setIsProfileOpen(false);
                      }}
                      className={`${styles.listboxTrigger} ${isProgrammeOpen ? styles.listboxTriggerOpen : ''}`}
                    >
                      <span className={styles.listboxValue}>
                        {selectedProgrammeObj ? (
                          selectedProgrammeObj.label
                        ) : (
                          <span className={styles.listboxPlaceholder}>Select a programme</span>
                        )}
                      </span>
                      <svg
                        className={`${styles.chevronGlyph} ${isProgrammeOpen ? styles.chevronGlyphOpen : ''}`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>

                    {/* Popover options list */}
                    {isProgrammeOpen && (
                      <ul
                        role="listbox"
                        aria-labelledby={`${programmeId}-label`}
                        className={styles.listboxMenu}
                      >
                        {ADVISOR_PROGRAMMES.map((item) => (
                          <li
                            key={item.value}
                            role="option"
                            aria-selected={programme === item.value}
                            onClick={() => {
                              setProgramme(item.value);
                              setIsProgrammeOpen(false);
                            }}
                            className={`${styles.listboxOption} ${
                              programme === item.value ? styles.listboxOptionSelected : ''
                            }`}
                          >
                            <span>{item.label}</span>
                            {programme === item.value && (
                              <span aria-hidden="true" style={{ fontSize: '12px' }}>
                                ✓
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Native fallback for touch devices */}
                    <select
                      className={styles.nativeSelect}
                      value={programme}
                      onChange={(e) => setProgramme(e.target.value)}
                      aria-hidden="true"
                      tabIndex={-1}
                    >
                      <option value="">Select a programme</option>
                      {ADVISOR_PROGRAMMES.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 4. Text link "Add a note" that expands a 3-line textarea (optional) */}
                <div className={styles.fieldGroup}>
                  {!isNoteExpanded ? (
                    <div className={styles.noteToggleRow}>
                      <button
                        type="button"
                        onClick={() => setIsNoteExpanded(true)}
                        className={styles.noteToggleLink}
                      >
                        Add a note
                      </button>
                    </div>
                  ) : (
                    <div
                      className={`${styles.expandableArea} ${
                        isNoteExpanded ? styles.expandableAreaOpen : styles.expandableAreaClosed
                      }`}
                    >
                      <label htmlFor={noteId} className={styles.fieldLabel}>
                        <span>Questions or notes (optional)</span>
                      </label>
                      <textarea
                        id={noteId}
                        rows={3}
                        placeholder="Share your technical background, specific questions, or scheduling preferences..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className={styles.underlinedTextarea}
                        maxLength={1000}
                      />
                    </div>
                  )}
                </div>

              </div>

              {/* Submit: One filled amber button (#f5a50a) with navy text, 52px tall, radius 4px, no icon */}
              <div className={styles.submitSection}>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={styles.submitButton}
                >
                  {isSubmitting ? 'Sending...' : 'Request a callback'}
                </button>
                <p className={styles.submitDisclaimer}>
                  We will contact you on the number provided.
                </p>
              </div>

            </form>
          )}

          {/* Mobile bottom sheet contact footer */}
          <div className={styles.mobileContactFooter}>
            <a href="tel:+919442605096" className={styles.mobileContactLink}>
              +91 94426 05096
            </a>
            <span style={{ color: '#9c978b' }} aria-hidden="true">
              /
            </span>
            <a
              href={BRAND_INFO.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.mobileContactLink}
            >
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdvisorModalDialog;
