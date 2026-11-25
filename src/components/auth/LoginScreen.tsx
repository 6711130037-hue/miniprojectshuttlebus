import React, { useState } from 'react';
import { useBus, LiveRole } from '../../context/BusContext';
import { apiLogin, apiRegisterPassenger } from '../../api/client';
import {
  Bus,
  Shield,
  User,
  KeyRound,
  ArrowRight,
  Sparkles,
  Info,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  ChevronRight,
  Mail,
  Phone,
  UserPlus,
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login, apiLoginComplete, apiAdminLoginComplete, setAppMode, employees, users, isLoggingIn } = useBus();

  const [formRole, setFormRole] = useState<LiveRole>('passenger');
  const [username, setUsername] = useState<string>('dev.passenger@example.test');
  const [password, setPassword] = useState<string>('');
  const [registering, setRegistering] = useState(false);
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerUserType, setRegisterUserType] = useState('นักศึกษา');
  const [formNotice, setFormNotice] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  // errorKey ใช้เพื่อ trigger animation shake ใหม่ทุกครั้งที่ error เปลี่ยน
  const [errorKey, setErrorKey] = useState<number>(0);

  const showError = (msg: string) => {
    setFormError(msg);
    setErrorKey((k) => k + 1);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (registering) {
      const email = registerEmail.trim().toLowerCase();
      if (!/^[^\s@]+@mut\.ac\.th$/i.test(email)) {
        showError('กรุณาใช้อีเมลของมหาวิทยาลัยที่ลงท้ายด้วย @mut.ac.th');
        return;
      }
      try {
        await apiRegisterPassenger({
          name: registerName.trim(),
          username: email,
          email,
          phone: registerPhone.trim(),
          user_type: registerUserType,
          password,
        });
        setUsername(email);
        setPassword('');
        setRegistering(false);
        setFormNotice('ลงทะเบียนสำเร็จ กรุณาเข้าสู่ระบบด้วยอีเมลและรหัสผ่านที่สมัครไว้');
      } catch (error) {
        showError(error instanceof Error ? error.message : 'ลงทะเบียนไม่สำเร็จ กรุณาลองอีกครั้ง');
      }
      return;
    }
    setFormNotice(null);

    if (!username.trim()) {
      showError('กรุณากรอกชื่อผู้ใช้ / รหัสนักศึกษา / รหัสพนักงาน');
      return;
    }
    if (!password.trim()) {
      showError('กรุณากรอกรหัสผ่าน');
      return;
    }

    if (formRole === 'passenger' || formRole === 'driver') {
      try {
        const user = await apiLogin(formRole, username.trim(), password);
        await apiLoginComplete(formRole, user);
      } catch (error) {
        showError(error instanceof Error ? error.message : 'Unable to sign in. Check API connection and credentials.');
      }
      return;
    }

    if (formRole === 'admin') {
      try {
        const user = await apiLogin('admin', username.trim(), password);
        await apiAdminLoginComplete(user);
      } catch (error) {
        showError(error instanceof Error ? error.message : 'Unable to sign in. Check API connection and administrator credentials.');
      }
      return;
    }

    // ---------- ADMIN ----------
    // ---------- DRIVER ----------
    if (formRole === 'driver') {
      const emp = employees.find(
        (e) => e.username.toLowerCase() === username.toLowerCase() || e.employee_id === username
      );
      if (!emp) {
        showError('ไม่พบข้อมูลพนักงานขับรถนี้ในระบบ กรุณาตรวจสอบ Username หรือรหัสพนักงาน');
        return;
      }
      if (emp.password && emp.password !== password) {
        showError('รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบรหัสผ่านอีกครั้ง');
        return;
      }
      login('driver', emp.username);
      return;
    }

    // ---------- PASSENGER ----------
    const u = users.find(
      (usr) =>
        usr.username.toLowerCase() === username.toLowerCase() ||
        String(usr.user_id) === username
    );
    if (!u) {
      showError('ไม่พบข้อมูลผู้ใช้งานนี้ในระบบ กรุณาตรวจสอบรหัสนักศึกษา / รหัสบุคลากร');
      return;
    }
    if (u.password !== password) {
      showError('รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบรหัสผ่านอีกครั้ง');
      return;
    }
    login('passenger', u.username);
  };

  const fillCredentials = (role: LiveRole, user: string, pass: string) => {
    setFormRole(role);
    setUsername(user);
    setPassword(pass);
    setFormError(null);
  };

  const roleOptions: {
    value: LiveRole;
    label: string;
    icon: React.ElementType;
    accent: 'amber' | 'blue' | 'purple';
  }[] = [
    { value: 'passenger', label: 'ผู้โดยสาร', icon: User, accent: 'amber' },
    { value: 'driver', label: 'พนักงานขับรถ', icon: Bus, accent: 'blue' },
    { value: 'admin', label: 'ผู้ดูแลระบบ', icon: Shield, accent: 'purple' },
  ];

  const quickAccounts: {
    role: LiveRole;
    name: string;
    user: string;
    accent: 'amber' | 'blue' | 'purple';
  }[] = [
    { role: 'passenger', name: 'พลพิธ (นักศึกษา)', user: 'dev.passenger@example.test', accent: 'amber' },
    { role: 'passenger', name: 'เพ็ญศรี (อาจารย์)', user: 'dev.passenger@example.test', accent: 'amber' },
    { role: 'driver', name: 'สมหมาย (คนขับ)', user: 'dev.driver@example.test', accent: 'blue' },
    { role: 'admin', name: 'ผู้ดูแลระบบ (Admin)', user: 'dev.admin@example.test', accent: 'purple' },
  ];

  const accentActiveClass = (accent: 'amber' | 'blue' | 'purple') => {
    void accent;
    return 'bg-gradient-to-br from-amber-500 to-orange-500 text-white border-transparent shadow-md shadow-amber-500/30';
  };

  const quickCardClass = (accent: 'amber' | 'blue' | 'purple') => {
    void accent;
    return 'border-amber-200 bg-amber-50/60 hover:border-amber-300 hover:bg-amber-50';
  };

  const quickTextClass = (accent: 'amber' | 'blue' | 'purple') => {
    void accent;
    return 'text-amber-900';
  };

  const quickMonoClass = (accent: 'amber' | 'blue' | 'purple') => {
    void accent;
    return 'text-amber-800';
  };

  return (
    <div className="relative min-h-[calc(100vh-4.5rem)] overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-100">
      {/* Animated background blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="animate-float-slow absolute -top-40 -left-32 h-[420px] w-[420px] rounded-full bg-amber-200/40 blur-3xl" />
        <div className="animate-float-slower absolute -top-24 right-0 h-[380px] w-[380px] rounded-full bg-orange-200/40 blur-3xl" />
        <div className="animate-float-slowest absolute bottom-0 left-1/3 h-[360px] w-[360px] rounded-full bg-amber-200/30 blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        {/* ================= HERO ================= */}
        <div className="animate-fade-in-up text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/80 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-900 shadow-sm backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>MUT Bus Booking · Miniproject</span>
          </div>

          <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            ระบบจองรถบัส
            <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 bg-clip-text text-transparent">
              {" "}
              มหาวิทยาลัยเทคโนโลยีมหานคร
            </span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-600 sm:text-base">
            เข้าสู่ระบบเพื่อใช้งานสำหรับผู้โดยสาร พนักงานขับรถ และผู้ดูแลระบบ
          </p>
        </div>

        {/* ================= LOGIN CARD ================= */}
        <div
          className="animate-fade-in-up mx-auto mt-10 max-w-lg"
          style={{ animationDelay: '120ms' }}
        >
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/60">
            {/* Top accent bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400" />

            {/* Header */}
            <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50/70 to-white px-6 py-5 sm:px-8">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 text-white shadow-lg shadow-slate-300">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">{registering ? 'ลงทะเบียนผู้โดยสาร' : 'เข้าสู่ระบบ'}</h2>
                  <p className="text-xs text-slate-500">
                    {registering ? 'สร้างบัญชีผู้ใช้งานใหม่' : 'กรอก Username และ Password ของคุณ'}
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="space-y-5 px-6 py-6 sm:px-8">
              {/* Role picker */}
              {!registering && <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  เลือกบทบาท
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {roleOptions.map((opt) => {
                    const Icon = opt.icon;
                    const active = formRole === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setFormRole(opt.value);
                          setFormError(null);
                        }}
                        className={`group flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 text-[11px] font-bold transition-all duration-200 ${
                          active
                            ? accentActiveClass(opt.accent)
                            : 'border-slate-200 bg-white text-slate-600 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <Icon
                          className={`h-4 w-4 transition-transform ${
                            active ? 'scale-110' : 'group-hover:scale-110'
                          }`}
                        />
                        <span className="whitespace-nowrap">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>}

              {formNotice && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-xs font-medium text-emerald-700" role="status">
                  {formNotice}
                </div>
              )}

              {/* Error banner with shake */}
              {formError && (
                <div
                  key={errorKey}
                  className="animate-shake flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs text-rose-700"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="font-medium leading-relaxed">{formError}</span>
                </div>
              )}

              {registering && <>
                <div>
                  <label htmlFor="register-name" className="mb-1.5 block text-xs font-bold text-slate-700">ชื่อ-นามสกุล</label>
                  <div className="group relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input id="register-name" required maxLength={150} value={registerName} onChange={(e) => setRegisterName(e.target.value)} placeholder="ชื่อ-นามสกุล" autoComplete="name" className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-500/10" />
                  </div>
                </div>
                <div>
                  <label htmlFor="register-email" className="mb-1.5 block text-xs font-bold text-slate-700">อีเมล (ใช้เข้าสู่ระบบ)</label>
                  <div className="group relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input id="register-email" required maxLength={100} type="email" pattern="[^\s@]+@mut\.ac\.th" title="กรุณาใช้อีเมลที่ลงท้ายด้วย @mut.ac.th" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} placeholder="name@mut.ac.th" autoComplete="email" className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-500/10" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="register-phone" className="mb-1.5 block text-xs font-bold text-slate-700">เบอร์โทรศัพท์</label>
                    <div className="group relative">
                      <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input id="register-phone" required maxLength={20} type="tel" value={registerPhone} onChange={(e) => setRegisterPhone(e.target.value)} placeholder="08xxxxxxxx" autoComplete="tel" className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-2 text-sm text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-500/10" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="register-type" className="mb-1.5 block text-xs font-bold text-slate-700">ประเภทผู้ใช้</label>
                    <select id="register-type" value={registerUserType} onChange={(e) => setRegisterUserType(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-500/10">
                      <option value="นักศึกษา">นักศึกษา</option>
                      <option value="อาจารย์">อาจารย์</option>
                      <option value="บุคลากร">บุคลากร</option>
                    </select>
                  </div>
                </div>
              </>}

              {/* Username */}
              {!registering && <div>
                <label
                  htmlFor="login-username"
                  className="mb-1.5 block text-xs font-bold text-slate-700"
                >
                  ชื่อผู้ใช้ / รหัสนักศึกษา / รหัสพนักงาน
                </label>
                <div className="group relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-amber-500" />
                  <input
                    id="login-username"
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setFormError(null);
                    }}
                    placeholder="เช่น 6711130037 หรือ somchai"
                    autoComplete="username"
                    className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-500/10"
                  />
                </div>
              </div>}

              {/* Password */}
              <div>
                <label
                  htmlFor="login-password"
                  className="mb-1.5 block text-xs font-bold text-slate-700"
                >
                  {registering ? 'รหัสผ่าน (อย่างน้อย 8 ตัวอักษร)' : 'รหัสผ่าน'}
                </label>
                <div className="group relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-amber-500" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setFormError(null);
                    }}
                    placeholder="••••••••"
                    minLength={registering ? 8 : undefined}
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-10 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-500/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                    aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit button with shine effect */}
              <button
                type="submit"
                disabled={isLoggingIn}
                aria-busy={isLoggingIn}
                className={`btn-shine group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/20 transition-all hover:shadow-xl hover:shadow-slate-900/30 active:scale-[0.99] ${isLoggingIn ? 'cursor-not-allowed opacity-80' : ''}`}
              >
                <span className="relative z-10">{isLoggingIn ? 'กำลังเข้าสู่ระบบ...' : (registering ? 'ลงทะเบียน' : 'เข้าสู่ระบบ')}</span>
                {registering ? <UserPlus className="relative z-10 h-4 w-4" /> : <ChevronRight className={`relative z-10 h-4 w-4 transition-transform ${isLoggingIn ? '' : 'group-hover:translate-x-0.5'}`} />}
              </button>

              <p className="text-center text-xs text-slate-500">
                {registering ? 'มีบัญชีอยู่แล้ว? ' : 'ยังไม่มีบัญชี? '}
                <button type="button" onClick={() => {
                  setRegistering(!registering);
                  setFormRole('passenger');
                  setFormError(null);
                  setFormNotice(null);
                  setPassword('');
                }} className="font-bold text-amber-700 hover:text-amber-800">
                  {registering ? 'เข้าสู่ระบบ' : 'ลงทะเบียนผู้โดยสาร'}
                </button>
              </p>

              {/* Divider */}
              {!registering && <div className="relative pt-1">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-dashed border-slate-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    หรือใช้บัญชีตัวอย่าง
                  </span>
                </div>
              </div>}

              {/* Quick-fill accounts (ย้ายมาใต้ปุ่ม login) */}
              {!registering && <div className="grid grid-cols-2 gap-2">
                {quickAccounts.map((acc) => (
                  <button
                    key={`${acc.role}-${acc.name}`}
                    type="button"
                    onClick={() => fillCredentials(acc.role, acc.user, '')}
                    className={`flex flex-col items-start gap-1 rounded-xl border px-3 py-2.5 text-left transition-all active:scale-[0.98] ${quickCardClass(
                      acc.accent
                    )}`}
                  >
                    <span
                      className={`text-[11px] font-bold ${quickTextClass(acc.accent)}`}
                    >
                      {acc.name}
                    </span>
                    <span
                      className={`font-mono text-[10px] opacity-80 ${quickMonoClass(
                        acc.accent
                      )}`}
                    >
                      {acc.user}
                    </span>
                  </button>
                ))}
              </div>}

              {!registering && <p className="pt-1 text-center text-[11px] text-slate-400">
                บัญชีพัฒนาใช้รหัสผ่านจากค่า DEV_SEED_PASSWORD ในไฟล์ .env{' '}
                <span className="font-mono font-bold text-slate-600">DEV_SEED_PASSWORD (.env)</span>
              </p>}
            </form>
          </div>
        </div>

        {/* ================= FOOTER ================= */}
        <div
          className="animate-fade-in-up mt-10 flex flex-col items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white/70 p-4 text-xs backdrop-blur sm:flex-row sm:items-center sm:p-5"
          style={{ animationDelay: '240ms' }}
        >
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700">
              <Info className="h-4 w-4" />
            </div>
            <div>
              <p className="font-bold text-slate-800">
                ข้อมูลเชื่อมโยงกับ Entity & Attributes ในเอกสาร Miniproject
              </p>
              <p className="mt-0.5 text-slate-500">
                สิทธิตามตำแหน่ง · พนักงาน · ผู้ใช้งานระบบ · รอบรถ · เส้นทาง · การจอง
              </p>
            </div>
          </div>

          <div className="flex w-full gap-2 sm:w-auto">
            <button
              type="button"
              onClick={() => setAppMode('figma')}
              className="flex-1 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 font-semibold text-indigo-700 transition-colors hover:bg-indigo-100 sm:flex-none"
            >
              Figma Canvas
            </button>
            <button
              type="button"
              onClick={() => setAppMode('er')}
              className="flex-1 rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-2 font-semibold text-sky-700 transition-colors hover:bg-sky-100 sm:flex-none"
            >
              ER Diagram
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
