import React, { useState, useEffect, useRef } from 'react';
import {
  Car,
  Lock,
  Mail,
  User,
  Phone,
  Eye,
  EyeOff,
  ShieldCheck,
  Wrench,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Terminal,
  Activity,
  Cpu,
  Radio,
  Zap,
  ShieldAlert,
  Clock,
  RotateCcw,
  Key
} from 'lucide-react';
import { apiClient } from '../../services/apiClient.ts';
import { User as UserType } from '../../types.ts';
import { signInWithGooglePopup } from '../../config/firebase.ts';

const GoogleIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.88c2.27-2.09 3.665-5.17 3.665-9.09z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.27v3.09C3.26 21.36 7.35 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.32c-.25-.72-.38-1.49-.38-2.32s.13-1.6.38-2.32V6.59H1.27C.46 8.21 0 10.05 0 12s.46 3.79 1.27 5.41l4.01-3.09z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.27 6.59l4.01 3.09c.95-2.83 3.6-4.93 6.72-4.93z"
    />
  </svg>
);

interface LoginViewProps {
  onLoginSuccess: (user: UserType) => void;
  isStaff?: boolean;
  onNavigate?: (path: string) => void;
  initialPendingAuth?: { pendingToken: string; email: string } | null;
  initialMode?: 'login' | 'register' | 'forgot-password';
}

// Technical Wireframe Blueprint SVG Illustration for Service Vehicle
const BlueprintVehicle: React.FC<{ isStaff?: boolean }> = ({ isStaff }) => {
  return (
    <div className="relative w-full h-64 sm:h-72 lg:h-80 my-4 flex items-center justify-center overflow-hidden rounded-xl bg-slate-950/80 border border-slate-800/80 p-4 shadow-inner">
      {/* Background Grid Pattern */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, ${isStaff ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)'} 1px, transparent 1px),
            linear-gradient(to bottom, ${isStaff ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)'} 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}
      />

      {/* Sweep Diagnostic Scan Line */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className={`w-1.5 h-full bg-gradient-to-b from-transparent ${isStaff ? 'via-rose-500 shadow-[0_0_15px_#f43f5e]' : 'via-amber-500 shadow-[0_0_15px_#f59e0b]'} to-transparent opacity-80 animate-laserScan absolute top-0`} />
      </div>

      {/* Blueprint SVG Schematic */}
      <svg
        viewBox="0 0 600 280"
        className={`w-full h-full max-w-lg object-contain ${isStaff ? 'text-amber-500/80' : 'text-amber-500/80'} relative z-10`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="amberGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Chassis & Body Shell Wireframe */}
        <path
          d="M 50,180 L 70,180 L 85,110 L 170,105 L 210,105 L 225,80 L 410,80 L 530,95 L 540,180 L 520,180"
          stroke="#f59e0b"
          strokeWidth="1.8"
          strokeDasharray="none"
          className="opacity-90"
          filter="url(#amberGlow)"
        />

        {/* Hood & Windshield */}
        <path d="M 85,110 L 140,110 L 175,135 L 210,135 L 225,80" stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.6" />
        <path d="M 140,110 L 175,135 M 170,105 L 185,135" stroke="#f59e0b" strokeWidth="1" opacity="0.5" />

        {/* Driver Window & Cargo Bay Partition */}
        <rect x="235" y="90" width="80" height="40" rx="3" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
        <line x1="325" y1="80" x2="325" y2="180" stroke="#f59e0b" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />

        {/* Main Frame Rails */}
        <line x1="40" y1="180" x2="540" y2="180" stroke="#f59e0b" strokeWidth="2.5" opacity="0.8" />
        <line x1="40" y1="190" x2="540" y2="190" stroke="#f59e0b" strokeWidth="1.5" opacity="0.6" />

        {/* Front Wheel Well & Wheel */}
        <circle cx="130" cy="190" r="32" stroke="#f59e0b" strokeWidth="1.8" filter="url(#amberGlow)" />
        <circle cx="130" cy="190" r="22" stroke="#f59e0b" strokeWidth="1" strokeDasharray="4 2" />
        <circle cx="130" cy="190" r="8" stroke="#f59e0b" strokeWidth="1.5" />
        <line x1="130" y1="168" x2="130" y2="212" stroke="#f59e0b" strokeWidth="1" opacity="0.7" />
        <line x1="108" y1="190" x2="152" y2="190" stroke="#f59e0b" strokeWidth="1" opacity="0.7" />

        {/* Rear Wheel Well & Wheel */}
        <circle cx="450" cy="190" r="32" stroke="#f59e0b" strokeWidth="1.8" filter="url(#amberGlow)" />
        <circle cx="450" cy="190" r="22" stroke="#f59e0b" strokeWidth="1" strokeDasharray="4 2" />
        <circle cx="450" cy="190" r="8" stroke="#f59e0b" strokeWidth="1.5" />
        <line x1="450" y1="168" x2="450" y2="212" stroke="#f59e0b" strokeWidth="1" opacity="0.7" />
        <line x1="428" y1="190" x2="472" y2="190" stroke="#f59e0b" strokeWidth="1" opacity="0.7" />

        {/* Dimension Line Callouts */}
        <g opacity="0.5" className="font-mono text-[9px]">
          <line x1="40" y1="230" x2="540" y2="230" stroke="#f59e0b" strokeWidth="0.8" />
          <line x1="40" y1="222" x2="40" y2="238" stroke="#f59e0b" strokeWidth="0.8" />
          <line x1="540" y1="222" x2="540" y2="238" stroke="#f59e0b" strokeWidth="0.8" />
          <text x="270" y="243" fill="#fbbf24" textAnchor="middle" fontSize="10" fontFamily="monospace">
            L: 5,980mm
          </text>

          <line x1="20" y1="80" x2="20" y2="190" stroke="#f59e0b" strokeWidth="0.8" />
          <line x1="12" y1="80" x2="28" y2="80" stroke="#f59e0b" strokeWidth="0.8" />
          <line x1="12" y1="190" x2="28" y2="190" stroke="#f59e0b" strokeWidth="0.8" />
          <text x="15" y="140" fill="#fbbf24" textAnchor="middle" fontSize="10" fontFamily="monospace" transform="rotate(-90, 15, 140)">
            H: 2,420mm
          </text>
        </g>

        {/* Telemetry Sensor Nodes */}
        <g>
          <circle cx="110" cy="130" r="4" fill="#f59e0b" className="animate-ping opacity-75" />
          <circle cx="110" cy="130" r="3" fill="#fbbf24" />
          <line x1="110" y1="130" x2="80" y2="50" stroke="#f59e0b" strokeWidth="0.8" opacity="0.8" />
          <rect x="40" y="36" width="70" height="18" rx="2" fill="#0f172a" stroke="#f59e0b" strokeWidth="0.8" />
          <text x="75" y="48" fill="#fbbf24" textAnchor="middle" fontSize="9" fontWeight="bold" fontFamily="monospace">
            {isStaff ? 'DISPATCH: OK' : 'ECU: OK'}
          </text>
        </g>

        <g>
          <circle cx="280" cy="160" r="4" fill="#f59e0b" className="animate-ping opacity-75" />
          <circle cx="280" cy="160" r="3" fill="#fbbf24" />
          <line x1="280" y1="160" x2="310" y2="50" stroke="#f59e0b" strokeWidth="0.8" opacity="0.8" />
          <rect x="270" y="36" width="80" height="18" rx="2" fill="#0f172a" stroke="#f59e0b" strokeWidth="0.8" />
          <text x="310" y="48" fill="#fbbf24" textAnchor="middle" fontSize="9" fontWeight="bold" fontFamily="monospace">
            {isStaff ? 'BAY QUEUE: LIVE' : 'OBD-II: READY'}
          </text>
        </g>

        <g>
          <circle cx="450" cy="190" r="4" fill="#f59e0b" className="animate-ping opacity-75" />
          <circle cx="450" cy="190" r="3" fill="#fbbf24" />
          <line x1="450" y1="190" x2="480" y2="250" stroke="#f59e0b" strokeWidth="0.8" opacity="0.8" />
          <rect x="440" y="250" width="85" height="18" rx="2" fill="#0f172a" stroke="#f59e0b" strokeWidth="0.8" />
          <text x="482" y="262" fill="#fbbf24" textAnchor="middle" fontSize="9" fontWeight="bold" fontFamily="monospace">
            {isStaff ? 'DIAGNOSTICS: 100%' : 'BRAKES: 98%'}
          </text>
        </g>
      </svg>
    </div>
  );
};

// Mask email helper for 2FA UI (e.g. robert@acmecorp.com -> r***t@acmecorp.com)
const maskEmail = (emailStr: string): string => {
  if (!emailStr) return '';
  const parts = emailStr.split('@');
  if (parts.length !== 2) return emailStr;
  const [userPart, domain] = parts;
  if (userPart.length <= 2) {
    return `${userPart[0]}***@${domain}`;
  }
  return `${userPart[0]}***${userPart[userPart.length - 1]}@${domain}`;
};

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  isStaff = false,
  onNavigate,
  initialPendingAuth,
  initialMode = 'login'
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot-password'>(initialMode);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register extra fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Forgot password states
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotEmailTouched, setForgotEmailTouched] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [resetOtpDigits, setResetOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState<string | null>(null);
  const [resetTimeRemaining, setResetTimeRemaining] = useState<number>(600);
  const [resetResendCooldown, setResetResendCooldown] = useState<number>(60);
  const [resetResendLoading, setResetResendLoading] = useState<boolean>(false);

  // UI status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Field validation errors
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  // 2FA OTP step states
  const [pendingToken, setPendingToken] = useState<string | null>(initialPendingAuth?.pendingToken || null);
  const [pendingEmail, setPendingEmail] = useState<string>(initialPendingAuth?.email || '');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [otpInfoMessage, setOtpInfoMessage] = useState<string | null>(
    initialPendingAuth ? 'OTP sent successfully to your email' : null
  );

  useEffect(() => {
    if (initialPendingAuth?.pendingToken) {
      setPendingToken(initialPendingAuth.pendingToken);
      setPendingEmail(initialPendingAuth.email);
      setOtpDigits(['', '', '', '', '', '']);
      setOtpTimeRemaining(600);
      setResendCooldown(60);
      setOtpError(null);
      setRemainingAttempts(null);
      setOtpInfoMessage('OTP sent successfully to your email');
      setIsBooting(false);
    }
  }, [initialPendingAuth]);

  // Timers: 10-minute expiry countdown & 60-second resend cooldown
  const [otpTimeRemaining, setOtpTimeRemaining] = useState<number>(600);
  const [resendCooldown, setResendCooldown] = useState<number>(60);
  const [resendLoading, setResendLoading] = useState<boolean>(false);

  const otpInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  const resetOtpInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  // System Boot Sequence State
  const [isBooting, setIsBooting] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return false;
    }
    return true;
  });
  const [bootStep, setBootStep] = useState(0);

  const bootLogs = isStaff
    ? [
        'INITIALIZING FLEETOPS PRO INTERNAL STAFF CORE v2.4',
        'AUTHENTICATING ENCRYPTED PERSONNEL GATEWAY',
        'LOADING REPAIR QUEUE & DISPATCH MODULES',
        'RESTRICTED TERMINAL — AWAITING STAFF CREDENTIALS'
      ]
    : [
        'INITIALIZING FLEETOPS PRO SERVICE CORE v2.4',
        'AUTHENTICATING SECURE TELEMETRY PIPELINE',
        'MOUNTING DIAGNOSTIC QUEUE GATEWAY',
        'SYSTEM READY — AWAITING USER AUTHENTICATION'
      ];

  useEffect(() => {
    if (!isBooting) return;

    const t1 = setTimeout(() => setBootStep(1), 300);
    const t2 = setTimeout(() => setBootStep(2), 650);
    const t3 = setTimeout(() => setBootStep(3), 1000);
    const t4 = setTimeout(() => setBootStep(4), 1300);
    const tEnd = setTimeout(() => setIsBooting(false), 1600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(tEnd);
    };
  }, [isBooting]);

  // 2FA Expiry & Resend Timers
  useEffect(() => {
    if (!pendingToken) return;

    const interval = setInterval(() => {
      setOtpTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [pendingToken]);

  // Auto-focus first box when 2FA screen mounts
  useEffect(() => {
    if (pendingToken) {
      setTimeout(() => otpInputRefs[0].current?.focus(), 100);
    }
  }, [pendingToken]);

  // Validation getters
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isPasswordValid = password.length >= 6;

  // Helper to determine human-friendly error titles instead of generic "Authentication Failure"
  const getErrorTitle = () => {
    if (forgotError) return 'Password Reset Notice';
    if (!error) return '';
    const errLower = error.toLowerCase();
    if (
      errLower.includes('email') ||
      errLower.includes('password must') ||
      errLower.includes('password is') ||
      errLower.includes('required') ||
      errLower.includes('match') ||
      errLower.includes('please enter')
    ) {
      return 'Action Required';
    }
    if (mode === 'register') return 'Registration Notice';
    return 'Authentication Failed';
  };

  // Handle Login Submit (Step 1)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEmailTouched(true);
    setPasswordTouched(true);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Email address is required.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please enter a valid email address (e.g. name@example.com).');
      return;
    }

    if (!password) {
      setError('Password is required.');
      return;
    }

    if (!isPasswordValid) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const res = await apiClient.login(cleanEmail, password);
      if (res.pendingToken) {
        setPendingToken(res.pendingToken);
        setPendingEmail(res.email || cleanEmail);
        setOtpDigits(['', '', '', '', '', '']);
        setOtpTimeRemaining(600);
        setResendCooldown(60);
        setOtpError(null);
        setRemainingAttempts(null);
        setOtpInfoMessage(res.message || 'OTP sent successfully to your email');
      } else if (res.token) {
        // Fallback if 2FA disabled
        const meRes = await apiClient.getMe();
        onLoginSuccess(meRes.user);
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Register Submit (Customer flow only)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEmailTouched(true);
    setPasswordTouched(true);

    const cleanName = name.trim();
    if (!cleanName) {
      setError('Full name is required.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Email address is required.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please enter a valid email address (e.g. name@example.com).');
      return;
    }

    if (!password) {
      setError('Password is required.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please check and try again.');
      return;
    }

    setLoading(true);

    try {
      const res = await apiClient.register(cleanName, cleanEmail, password, phone?.trim());
      if (res?.user) {
        onLoginSuccess(res.user);
      } else {
        const meRes = await apiClient.getMe();
        onLoginSuccess(meRes.user);
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. This email may already be registered.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Continue with Google
  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);

    try {
      const { idToken } = await signInWithGooglePopup();
      const res = await apiClient.loginWithGoogle(idToken);
      if (res?.user) {
        onLoginSuccess(res.user);
      } else {
        const meRes = await apiClient.getMe();
        onLoginSuccess(meRes.user);
      }
    } catch (err: any) {
      console.error('Google Sign-in error:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        setError('Google sign-in popup was closed before completing.');
      } else if (err?.code === 'auth/popup-blocked') {
        setError('Popup was blocked by your browser. Please allow popups for this site and try again.');
      } else if (err?.code === 'auth/cancelled-popup-request') {
        setError('Another Google sign-in window is already open.');
      } else if (err?.code === 'auth/network-request-failed') {
        setError('Network connection error during Google sign-in. Please try again.');
      } else if (err?.code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized for Google Sign-In in Firebase Console.');
      } else if (err?.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err?.message && !err.message.includes('Firebase') && !err.message.includes('auth/')) {
        setError(err.message);
      } else {
        setError('Google sign-in could not be completed. Please try again.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  // Handle 2FA OTP Digit Box Inputs
  const handleOtpDigitChange = (index: number, value: string) => {
    // Handle paste event of full 6-digit code
    if (value.length > 1) {
      const cleanPasted = value.replace(/\D/g, '').slice(0, 6);
      if (cleanPasted.length > 0) {
        const newDigits = ['', '', '', '', '', ''];
        for (let i = 0; i < cleanPasted.length; i++) {
          newDigits[i] = cleanPasted[i];
        }
        setOtpDigits(newDigits);
        if (cleanPasted.length === 6) {
          otpInputRefs[5].current?.focus();
          submitOtpCode(cleanPasted);
        } else {
          otpInputRefs[Math.min(cleanPasted.length, 5)].current?.focus();
        }
      }
      return;
    }

    // Handle single digit input
    const cleanChar = value.replace(/\D/g, '');
    const newDigits = [...otpDigits];
    newDigits[index] = cleanChar;
    setOtpDigits(newDigits);

    if (cleanChar && index < 5) {
      otpInputRefs[index + 1].current?.focus();
    }

    // Auto-submit on filling 6th digit
    if (cleanChar && index === 5 && newDigits.every((d) => d !== '')) {
      submitOtpCode(newDigits.join(''));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs[index - 1].current?.focus();
    }
  };

  // Submit 2FA Code (Step 2)
  const submitOtpCode = async (codeToSubmit?: string) => {
    const finalCode = codeToSubmit || otpDigits.join('');
    if (!pendingToken) return;

    if (finalCode.length < 6) {
      setOtpError('Please enter all 6 digits of the verification code.');
      return;
    }

    if (otpTimeRemaining <= 0) {
      setOtpError('Verification code has expired. Please request a new code.');
      return;
    }

    setOtpLoading(true);
    setOtpError(null);
    setOtpInfoMessage(null);

    try {
      const res = await apiClient.verifyOtp(pendingToken, finalCode);
      if (res.user) {
        onLoginSuccess(res.user);
      } else {
        const meRes = await apiClient.getMe();
        onLoginSuccess(meRes.user);
      }
    } catch (err: any) {
      setOtpError(err.message || 'Invalid or expired code.');
      if (err.remainingAttempts !== undefined) {
        setRemainingAttempts(err.remainingAttempts);
      }
    } finally {
      setOtpLoading(false);
    }
  };

  // Resend OTP Code
  const handleResendOtp = async () => {
    if (!pendingToken || resendCooldown > 0) return;

    setResendLoading(true);
    setOtpError(null);
    setOtpInfoMessage(null);

    try {
      const res = await apiClient.resendOtp(pendingToken);
      setOtpDigits(['', '', '', '', '', '']);
      setOtpTimeRemaining(600);
      setResendCooldown(60);
      setRemainingAttempts(null);
      setOtpInfoMessage(res.message || 'OTP sent successfully to your email');
      otpInputRefs[0].current?.focus();
    } catch (err: any) {
      setOtpError(err.message || 'Failed to resend verification code.');
    } finally {
      setResendLoading(false);
    }
  };

  // Reset Password Expiry & Resend Timers
  useEffect(() => {
    if (mode !== 'forgot-password' || !resetToken) return;

    const interval = setInterval(() => {
      setResetTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
      setResetResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [mode, resetToken]);

  // Auto-focus first box when Reset OTP screen mounts
  useEffect(() => {
    if (mode === 'forgot-password' && forgotStep === 2) {
      setTimeout(() => resetOtpInputRefs[0].current?.focus(), 100);
    }
  }, [mode, forgotStep]);

  // Handle Request Password Reset Code
  const handleRequestResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotEmailTouched(true);

    const cleanEmail = forgotEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setForgotError('Email address is required.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setForgotError('Please enter a valid email address (e.g. name@example.com).');
      return;
    }

    setForgotLoading(true);

    try {
      const res = await apiClient.forgotPassword(cleanEmail);
      setResetToken(res.resetToken);
      setResetOtpDigits(['', '', '', '', '', '']);
      setResetTimeRemaining(600);
      setResetResendCooldown(60);
      setForgotStep(2);
    } catch (err: any) {
      setForgotError(err.message || 'Failed to send reset code. Please verify the email and try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  // Handle Reset OTP Digit Box Inputs
  const handleResetOtpDigitChange = (index: number, value: string) => {
    if (value.length > 1) {
      const cleanPasted = value.replace(/\D/g, '').slice(0, 6);
      if (cleanPasted.length > 0) {
        const newDigits = ['', '', '', '', '', ''];
        for (let i = 0; i < cleanPasted.length; i++) {
          newDigits[i] = cleanPasted[i];
        }
        setResetOtpDigits(newDigits);
        resetOtpInputRefs[Math.min(cleanPasted.length, 5)].current?.focus();
      }
      return;
    }

    const cleanChar = value.replace(/\D/g, '');
    const newDigits = [...resetOtpDigits];
    newDigits[index] = cleanChar;
    setResetOtpDigits(newDigits);

    if (cleanChar && index < 5) {
      resetOtpInputRefs[index + 1].current?.focus();
    }
  };

  const handleResetOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !resetOtpDigits[index] && index > 0) {
      resetOtpInputRefs[index - 1].current?.focus();
    }
  };

  // Handle Reset Password Submission
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);

    const finalCode = resetOtpDigits.join('');
    if (finalCode.length < 6) {
      setForgotError('Please enter all 6 digits of the password reset code.');
      return;
    }

    if (newPassword.length < 6) {
      setForgotError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setForgotError('Passwords do not match. Please verify and try again.');
      return;
    }

    if (!resetToken) {
      setForgotError('Missing password reset session. Please request a new code.');
      return;
    }

    setForgotLoading(true);

    try {
      const res = await apiClient.resetPassword(resetToken, finalCode, newPassword);
      setForgotSuccessMsg(res.message || 'Password reset successfully! Redirecting to login...');
      setForgotStep(3);

      setTimeout(() => {
        setEmail(forgotEmail);
        setPassword('');
        setMode('login');
        setForgotStep(1);
        setForgotSuccessMsg(null);
        setResetToken(null);
        setNewPassword('');
        setConfirmNewPassword('');
        setResetOtpDigits(['', '', '', '', '', '']);
      }, 2200);
    } catch (err: any) {
      setForgotError(err.message || 'Failed to reset password. Code may be invalid or expired.');
    } finally {
      setForgotLoading(false);
    }
  };

  // Handle Resend Reset Code
  const handleResendResetCode = async () => {
    if (!resetToken || resetResendCooldown > 0) return;

    setResetResendLoading(true);
    setForgotError(null);

    try {
      await apiClient.resendResetOtp(resetToken);
      setResetOtpDigits(['', '', '', '', '', '']);
      setResetTimeRemaining(600);
      setResetResendCooldown(60);
      resetOtpInputRefs[0].current?.focus();
    } catch (err: any) {
      setForgotError(err.message || 'Failed to resend reset code.');
    } finally {
      setResetResendLoading(false);
    }
  };

  // Helper for mm:ss display
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex font-['Public_Sans']">
      {/* Left Side: Image Panel */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-slate-900">
        <img
          src="https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80"
          alt="Professional vehicle workshop"
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent opacity-90" />
        
        <div className="absolute inset-0 p-12 flex flex-col justify-end">
          <h1 className="text-4xl font-black text-white font-['Oswald'] uppercase tracking-tight mb-2">
            FleetOps <span className="text-amber-500">Pro</span>
          </h1>
          <p className="text-lg text-slate-300 font-medium max-w-md mb-8">
            {mode === 'register'
              ? 'Create your account and start managing your vehicles and service operations.'
              : 'Sign in to manage your vehicles and service operations.'}
          </p>
          <div className="space-y-4">
            {(mode === 'register' ? [
              'Vehicle Management',
              'Service Booking',
              'Repair Tracking'
            ] : [
              'Vehicle Management',
              'Live Service Tracking',
              'Fleet Operations'
            ]).map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-amber-500" />
                </div>
                <span className="text-slate-200 font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side: Form Workspace */}
      <div className="w-full lg:w-1/2 flex flex-col bg-white">
        <div className="p-6">
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('/')}
            className="text-sm font-semibold text-slate-500 hover:text-amber-600 transition-colors inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-md space-y-8 animate-fadeIn">
            {pendingToken ? (
              /* ================= STEP 2: 2FA OTP ENTRY SCREEN ================= */
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight font-['Oswald'] uppercase">
                    Verify Your Identity
                  </h2>
                  <p className="text-sm text-slate-500 mt-2">
                    Enter the 6-digit verification code sent to{' '}
                    <span className="font-semibold text-slate-700">{maskEmail(pendingEmail)}</span>
                  </p>
                </div>

                {otpInfoMessage && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{otpInfoMessage}</span>
                  </div>
                )}

                {otpError && (
                  <div role="alert" className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Verification Error</p>
                      <p className="mt-0.5">{otpError}</p>
                      {remainingAttempts !== null && remainingAttempts > 0 && (
                        <p className="mt-1 font-semibold text-rose-600">
                          Attempts remaining: {remainingAttempts}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    submitOtpCode();
                  }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-6 gap-2">
                    {otpDigits.map((digit, index) => (
                      <input
                        key={index}
                        ref={otpInputRefs[index]}
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={digit}
                        onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="w-full h-12 text-center bg-white border border-slate-300 rounded-xl text-lg font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all font-mono"
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Clock className="w-4 h-4 text-amber-500" />
                      <span>Expires:</span>
                      <span className={`font-semibold ${otpTimeRemaining < 60 ? 'text-rose-500 animate-pulse' : 'text-slate-700'}`}>
                        {formatTime(otpTimeRemaining)}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={resendCooldown > 0 || resendLoading}
                      onClick={handleResendOtp}
                      className="text-amber-600 hover:text-amber-500 disabled:text-slate-400 disabled:cursor-not-allowed font-semibold flex items-center gap-1 transition-colors"
                    >
                      {resendLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : resendCooldown > 0 ? (
                        <span>Resend in {resendCooldown}s</span>
                      ) : (
                        <>
                          <RotateCcw className="w-4 h-4" />
                          <span>Resend Code</span>
                        </>
                      )}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={otpLoading || otpDigits.some((d) => d === '')}
                    className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all shadow-md font-['Oswald'] uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    {otpLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify Identity</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPendingToken(null);
                      setOtpError(null);
                    }}
                    className="text-sm font-semibold text-slate-500 hover:text-amber-600 transition-colors inline-flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to Sign In
                  </button>
                </div>
              </div>
            ) : (
              /* Real Auth Form Workspace (Step 1) */
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight font-['Oswald'] uppercase">
                    {mode === 'forgot-password'
                      ? 'Reset Password'
                      : mode === 'register'
                      ? 'Create Your Account'
                      : 'Welcome Back'}
                  </h2>
                  <p className="text-sm text-slate-500 mt-2">
                    {mode === 'forgot-password'
                      ? 'Recover access to your FleetOps Pro account.'
                      : mode === 'register'
                      ? 'Get started with FleetOps Pro.'
                      : 'Sign in to continue to your FleetOps dashboard.'}
                  </p>
                </div>

                {(error || forgotError) && (
                  <div role="alert" className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">
                        {getErrorTitle()}
                      </p>
                      <p className="mt-0.5">{error || forgotError}</p>
                    </div>
                  </div>
                )}

                {forgotSuccessMsg && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span>{forgotSuccessMsg}</span>
                  </div>
                )}

                {mode === 'forgot-password' ? (
                  forgotStep === 1 ? (
                    <form onSubmit={handleRequestResetCode} className="space-y-5" noValidate>
                      <div>
                        <label htmlFor="forgot-email" className="block text-sm font-bold text-slate-700 mb-2">
                          Email Address
                        </label>
                        <input
                          id="forgot-email"
                          required
                          type="email"
                          value={forgotEmail}
                          onChange={(e) => {
                            setForgotEmail(e.target.value);
                            if (!forgotEmailTouched) setForgotEmailTouched(true);
                            if (forgotError) setForgotError(null);
                          }}
                          onBlur={() => setForgotEmailTouched(true)}
                          placeholder="Enter your email"
                          className={`w-full px-4 py-3 bg-white border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all ${
                            forgotEmailTouched && (!forgotEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail.trim()))
                              ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                              : 'border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                          }`}
                        />
                        {forgotEmailTouched && !forgotEmail.trim() && (
                          <p className="mt-1.5 text-xs text-rose-600 font-medium">Email address is required</p>
                        )}
                        {forgotEmailTouched && forgotEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail.trim()) && (
                          <p className="mt-1.5 text-xs text-rose-600 font-medium">Please enter a valid email address (e.g. name@example.com)</p>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={forgotLoading}
                        className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all shadow-md font-['Oswald'] uppercase tracking-wider flex items-center justify-center gap-2"
                      >
                        {forgotLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Sending...</span>
                          </>
                        ) : (
                          <>
                            <span>Send Reset Code</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>

                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setMode('login');
                            setForgotError(null);
                          }}
                          className="text-sm font-semibold text-slate-500 hover:text-amber-600 transition-colors inline-flex items-center gap-1.5"
                        >
                          <ArrowLeft className="w-4 h-4" /> Back to Sign In
                        </button>
                      </div>
                    </form>
                  ) : forgotStep === 2 ? (
                    <form onSubmit={handleResetPasswordSubmit} className="space-y-5" noValidate>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                          6-Digit Reset Code
                        </label>
                        <div className="grid grid-cols-6 gap-2">
                          {resetOtpDigits.map((digit, index) => (
                            <input
                              key={index}
                              ref={resetOtpInputRefs[index]}
                              type="text"
                              inputMode="numeric"
                              maxLength={6}
                              value={digit}
                              onChange={(e) => handleResetOtpDigitChange(index, e.target.value)}
                              onKeyDown={(e) => handleResetOtpKeyDown(index, e)}
                              className="w-full h-12 text-center bg-white border border-slate-300 rounded-xl text-lg font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all font-mono"
                            />
                          ))}
                        </div>

                        <div className="flex items-center justify-between text-sm mt-3">
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <Clock className="w-4 h-4 text-amber-500" />
                            <span>Expires:</span>
                            <span className={`font-semibold ${resetTimeRemaining < 60 ? 'text-rose-500 animate-pulse' : 'text-slate-700'}`}>
                              {formatTime(resetTimeRemaining)}
                            </span>
                          </div>

                          <button
                            type="button"
                            disabled={resetResendCooldown > 0 || resetResendLoading}
                            onClick={handleResendResetCode}
                            className="text-amber-600 hover:text-amber-500 disabled:text-slate-400 disabled:cursor-not-allowed font-semibold flex items-center gap-1 transition-colors"
                          >
                            {resetResendLoading ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Sending...</span>
                              </>
                            ) : resetResendCooldown > 0 ? (
                              <span>Resend in {resetResendCooldown}s</span>
                            ) : (
                              <>
                                <RotateCcw className="w-4 h-4" />
                                <span>Resend Code</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="new-pass" className="block text-sm font-bold text-slate-700 mb-2">
                          New Password
                        </label>
                        <div className="relative">
                          <input
                            id="new-pass"
                            required
                            type={showNewPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter your new password"
                            className="w-full px-4 pr-10 py-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-600 p-1"
                          >
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="confirm-new-pass" className="block text-sm font-bold text-slate-700 mb-2">
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <input
                            id="confirm-new-pass"
                            required
                            type={showConfirmNewPassword ? 'text' : 'password'}
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            placeholder="Confirm your new password"
                            className="w-full px-4 pr-10 py-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-600 p-1"
                          >
                            {showConfirmNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={forgotLoading || resetOtpDigits.some((d) => d === '')}
                        className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all shadow-md font-['Oswald'] uppercase tracking-wider flex items-center justify-center gap-2"
                      >
                        {forgotLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Updating...</span>
                          </>
                        ) : (
                          <>
                            <span>Reset Password</span>
                            <CheckCircle2 className="w-4 h-4" />
                          </>
                        )}
                      </button>

                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setMode('login');
                            setForgotError(null);
                          }}
                          className="text-sm font-semibold text-slate-500 hover:text-amber-600 transition-colors inline-flex items-center gap-1.5"
                        >
                          <ArrowLeft className="w-4 h-4" /> Cancel & Sign In
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="py-8 text-center space-y-4">
                      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-500">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 font-['Oswald'] uppercase">Password Reset Successfully</h3>
                        <p className="text-sm text-slate-500 mt-2">Your password has been updated. Redirecting to sign in...</p>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-sm text-amber-600">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Signing in...</span>
                      </div>
                    </div>
                  )
                ) : mode === 'login' || isStaff ? (
                  <form onSubmit={handleLoginSubmit} className="space-y-5" noValidate>
                    <div>
                      <label htmlFor="login-email" className="block text-sm font-bold text-slate-700 mb-2">
                        {isStaff ? 'Staff Email' : 'Email Address'}
                      </label>
                      <input
                        id="login-email"
                        required
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (!emailTouched) setEmailTouched(true);
                          if (error) setError(null);
                        }}
                        onBlur={() => setEmailTouched(true)}
                        placeholder="Enter your email"
                        className={`w-full px-4 py-3 bg-white border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all ${
                          emailTouched && (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
                            ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                            : 'border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                        }`}
                      />
                      {emailTouched && !email.trim() && (
                        <p className="mt-1.5 text-xs text-rose-600 font-medium">Email address is required</p>
                      )}
                      {emailTouched && email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && (
                        <p className="mt-1.5 text-xs text-rose-600 font-medium">Please enter a valid email address (e.g. name@example.com)</p>
                      )}
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label htmlFor="login-password" className="block text-sm font-bold text-slate-700">
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setMode('forgot-password');
                            setForgotStep(1);
                            setForgotEmail(email || '');
                            setForgotError(null);
                            setForgotSuccessMsg(null);
                          }}
                          className="text-sm font-semibold text-amber-600 hover:text-amber-500 transition-colors"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          id="login-password"
                          required
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            if (!passwordTouched) setPasswordTouched(true);
                            if (error) setError(null);
                          }}
                          onBlur={() => setPasswordTouched(true)}
                          placeholder="Enter your password"
                          className={`w-full px-4 pr-10 py-3 bg-white border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all ${
                            passwordTouched && (!password || password.length < 6)
                              ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                              : 'border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-600 p-1"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {passwordTouched && !password && (
                        <p className="mt-1.5 text-xs text-rose-600 font-medium">Password is required</p>
                      )}
                      {passwordTouched && password && password.length < 6 && (
                        <p className="mt-1.5 text-xs text-rose-600 font-medium">Password must be at least 6 characters</p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loading || googleLoading}
                      className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all shadow-md font-['Oswald'] uppercase tracking-wider flex items-center justify-center gap-2 mt-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Signing in...</span>
                        </>
                      ) : (
                        <span>Sign In</span>
                      )}
                    </button>

                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-3 text-slate-400 font-semibold tracking-wider">
                          Or continue with
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={googleLoading || loading}
                      className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-slate-700 font-semibold text-sm shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      {googleLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                          <span>Connecting to Google...</span>
                        </>
                      ) : (
                        <>
                          <GoogleIcon className="w-5 h-5 transition-transform group-hover:scale-105" />
                          <span>Continue with Google</span>
                        </>
                      )}
                    </button>

                    {!isStaff && (
                      <div className="text-center pt-4">
                        <p className="text-sm text-slate-500">
                          Don't have an account?{' '}
                          <button
                            type="button"
                            onClick={() => {
                              setMode('register');
                              setError(null);
                            }}
                            className="font-bold text-amber-600 hover:text-amber-500 transition-colors"
                          >
                            Create an account
                          </button>
                        </p>
                      </div>
                    )}
                    
                    {/* Demo Login Options */}
                    <div className="mt-8 pt-6 border-t border-slate-200">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-center mb-4">Quick Demo Login</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        <button
                          type="button"
                          onClick={() => {
                            setEmail('kjindal509@gmail.com');
                            setPassword('Password123!');
                            setError(null);
                            setEmailTouched(false);
                            setPasswordTouched(false);
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-slate-500" /> Admin
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEmail('mechanic_e2e_1789825908212@example.com');
                            setPassword('Password123!');
                            setError(null);
                            setEmailTouched(false);
                            setPasswordTouched(false);
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                        >
                          <Wrench className="w-3.5 h-3.5 text-slate-500" /> Mechanic
                        </button>
                        {!isStaff && (
                          <button
                            type="button"
                            onClick={() => {
                              setEmail('test_customer_1789888867921@test.com');
                              setPassword('Password123!');
                              setError(null);
                              setEmailTouched(false);
                              setPasswordTouched(false);
                            }}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                          >
                            <User className="w-3.5 h-3.5 text-slate-500" /> Customer
                          </button>
                        )}
                      </div>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleRegisterSubmit} className="space-y-4" noValidate>
                    <div>
                      <label htmlFor="reg-name" className="block text-sm font-bold text-slate-700 mb-1.5">
                        Full Name
                      </label>
                      <input
                        id="reg-name"
                        required
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your full name"
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>

                    <div>
                      <label htmlFor="reg-email" className="block text-sm font-bold text-slate-700 mb-1.5">
                        Email Address
                      </label>
                      <input
                        id="reg-email"
                        required
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>

                    <div>
                      <label htmlFor="reg-phone" className="block text-sm font-bold text-slate-700 mb-1.5">
                        Phone Number (Optional)
                      </label>
                      <input
                        id="reg-phone"
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Enter your phone number"
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="reg-pass" className="block text-sm font-bold text-slate-700 mb-1.5">
                          Password
                        </label>
                        <div className="relative">
                          <input
                            id="reg-pass"
                            required
                            type={showRegPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                          />
                          <button
                            type="button"
                            onClick={() => setShowRegPassword(!showRegPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-600 p-1"
                          >
                            {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="reg-confirm" className="block text-sm font-bold text-slate-700 mb-1.5">
                          Confirm
                        </label>
                        <div className="relative">
                          <input
                            id="reg-confirm"
                            required
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm"
                            className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-600 p-1"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || googleLoading}
                      className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all shadow-md font-['Oswald'] uppercase tracking-wider flex items-center justify-center gap-2 mt-4"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Creating Account...</span>
                        </>
                      ) : (
                        <span>Create Account</span>
                      )}
                    </button>

                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-3 text-slate-400 font-semibold tracking-wider">
                          Or continue with
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={googleLoading || loading}
                      className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-slate-700 font-semibold text-sm shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      {googleLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                          <span>Connecting to Google...</span>
                        </>
                      ) : (
                        <>
                          <GoogleIcon className="w-5 h-5 transition-transform group-hover:scale-105" />
                          <span>Continue with Google</span>
                        </>
                      )}
                    </button>

                    <div className="text-center pt-2">
                      <p className="text-sm text-slate-500">
                        Already have an account?{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setMode('login');
                            setError(null);
                          }}
                          className="font-bold text-amber-600 hover:text-amber-500 transition-colors"
                        >
                          Sign In
                        </button>
                      </p>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

};
