import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

const API = 'http://localhost:5000/api';

// ============ PERMISSIONS DEFINITIONS ============
export const ALL_PERMISSIONS = [
  { key: 'students.view', label: 'عرض الطلاب', group: 'التسجيل' },
  { key: 'students.add', label: 'إضافة طالب', group: 'التسجيل' },
  { key: 'students.edit', label: 'تعديل بيانات طالب', group: 'التسجيل' },
  { key: 'students.delete', label: 'حذف طالب', group: 'التسجيل' },
  { key: 'subscriptions.view', label: 'عرض الاشتراكات', group: 'التسجيل' },
  { key: 'subscriptions.add', label: 'إضافة اشتراك', group: 'التسجيل' },
  { key: 'subscriptions.edit', label: 'تعديل / إلغاء اشتراك', group: 'التسجيل' },
  { key: 'courses.manage', label: 'إدارة الدورات', group: 'التسجيل' },
  { key: 'diplomas.manage', label: 'إدارة الدبلومات', group: 'التسجيل' },
  { key: 'sections.manage', label: 'إدارة الشعب', group: 'التسجيل' },
  { key: 'sections.assign', label: 'إسناد الطلاب للشعب', group: 'التسجيل' },
  { key: 'attendance.manage', label: 'إدارة الحضور', group: 'التسجيل' },
  { key: 'reports.academic', label: 'التقارير الأكاديمية', group: 'التسجيل' },
  { key: 'finance.view', label: 'عرض المالية', group: 'المالية' },
  { key: 'finance.receipts', label: 'سندات القبض', group: 'المالية' },
  { key: 'finance.payments', label: 'سندات الصرف', group: 'المالية' },
  { key: 'finance.installments', label: 'إدارة الأقساط', group: 'المالية' },
  { key: 'finance.reports', label: 'التقارير المالية', group: 'المالية' },
  { key: 'finance.settlements', label: 'التسويات والشراكات', group: 'المالية' },
  { key: 'admin.users', label: 'إدارة المستخدمين', group: 'الإدارة' },
  { key: 'admin.settings', label: 'إعدادات النظام', group: 'الإدارة' },
  { key: 'admin.audit', label: 'سجل العمليات', group: 'الإدارة' },
  { key: 'admin.entities', label: 'إدارة الجهات التعليمية', group: 'الإدارة' },
  { key: 'admin.rooms', label: 'إدارة القاعات', group: 'الإدارة' },
  { key: 'admin.instructors', label: 'إدارة المدرّسين', group: 'الإدارة' },
];

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: string;
  isAdmin: boolean;
  permissions: string[];
  status: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  centerName: string;
  centerLogo: string;
}

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (perm: string) => boolean;
  updateCenter: (name: string, logo: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    centerName: localStorage.getItem('centerName') || 'المركز التعليمي الحديث',
    centerLogo: localStorage.getItem('centerLogo') || '',
  });

  // On mount: restore session
  useEffect(() => {
    const savedToken = localStorage.getItem('ems_token');
    if (savedToken) {
      // Verify token is still valid by calling /me
      fetch(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${savedToken}` }
      })
        .then(res => res.ok ? res.json() : null)
        .then(user => {
          if (user) {
            setState(prev => ({ ...prev, user, token: savedToken, isLoading: false }));
          } else {
            localStorage.removeItem('ems_token');
            setState(prev => ({ ...prev, isLoading: false }));
          }
        })
        .catch(() => {
          setState(prev => ({ ...prev, isLoading: false }));
        });
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = async (username: string, password: string) => {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'فشل تسجيل الدخول');
    }

    localStorage.setItem('ems_token', data.token);
    setState(prev => ({ ...prev, user: data.user, token: data.token }));
  };

  const logout = async () => {
    try {
      if (state.token) {
        await fetch(`${API}/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${state.token}` }
        });
      }
    } catch { /* ignore network errors on logout */ }
    localStorage.removeItem('ems_token');
    setState(prev => ({ ...prev, user: null, token: null }));
  };

  const hasPermission = (perm: string): boolean => {
    if (!state.user) return false;
    if (state.user.isAdmin || state.user.permissions.includes('ADMIN_ALL')) return true;
    return state.user.permissions.includes(perm);
  };

  const updateCenter = (name: string, logo: string) => {
    localStorage.setItem('centerName', name);
    localStorage.setItem('centerLogo', logo);
    setState(prev => ({ ...prev, centerName: name, centerLogo: logo }));
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, hasPermission, updateCenter }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

// API helper with auth token
export const useApi = () => {
  const { token, logout } = useAuth();

  const apiFetch = async (path: string, options: RequestInit = {}) => {
    const res = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {})
      }
    });

    if (res.status === 401) {
      await logout();
      throw new Error('انتهت الجلسة. يرجى تسجيل الدخول.');
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'حدث خطأ في الخادم');
    return data;
  };

  return { apiFetch };
};
