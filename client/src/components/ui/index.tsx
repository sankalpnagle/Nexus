import React, { useRef } from 'react';
import { User } from '../../types';
import { getAvatar, cx } from '../../utils/helpers';

// ─── Avatar ────────────────────────────────────────────────────────────────
interface AvatarProps {
  user?: User | null;
  size?: number;
  online?: boolean;
  className?: string;
  onClick?: () => void;
}
export const Avatar = ({ user, size = 40, online, className, onClick }: AvatarProps) => (
  <div
    className={cx('relative inline-block shrink-0', onClick && 'cursor-pointer', className)}
    style={{ width: size, height: size }}
    onClick={onClick}
  >
    <img
      src={getAvatar(user, size * 2)}
      alt={user?.firstName || 'User'}
      className="rounded-full object-cover w-full h-full"
      style={{ width: size, height: size }}
    />
    {online && (
      <span
        className="absolute bottom-0 right-0 rounded-full bg-emerald-400 border-2 border-[#0d0f14] online-pulse"
        style={{ width: Math.max(10, size * 0.22), height: Math.max(10, size * 0.22) }}
      />
    )}
  </div>
);

// ─── Button ────────────────────────────────────────────────────────────────
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type BtnSize = 'xs' | 'sm' | 'md' | 'lg';

const btnVariant: Record<BtnVariant, string> = {
  primary:   'bg-[#00d4b4] text-[#0d0f14] hover:bg-[#00b89c] font-bold shadow-[0_0_20px_rgba(0,212,180,0.2)]',
  secondary: 'bg-[#232736] text-[#e8eaf0] hover:bg-[#2e3347] border border-[#2e3347]',
  ghost:     'text-[#9ca3af] hover:text-[#e8eaf0] hover:bg-[#181c26]',
  danger:    'bg-[#f43f5e] text-white hover:bg-[#e11d48]',
  outline:   'border border-[#2e3347] text-[#e8eaf0] hover:border-[#00d4b4] hover:text-[#00d4b4] bg-transparent',
};
const btnSize: Record<BtnSize, string> = {
  xs: 'px-2.5 py-1 text-xs rounded-lg',
  sm: 'px-3 py-1.5 text-sm rounded-xl',
  md: 'px-4 py-2 text-sm rounded-xl',
  lg: 'px-5 py-2.5 text-base rounded-xl',
};

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: BtnSize;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = ({
  variant = 'secondary', size = 'md', loading, icon, fullWidth,
  className, children, disabled, ...rest
}: BtnProps) => (
  <button
    {...rest}
    disabled={disabled || loading}
    className={cx(
      'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none font-[var(--font-body)]',
      btnVariant[variant], btnSize[size],
      fullWidth && 'w-full',
      className
    )}
  >
    {loading
      ? <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      : icon}
    {children}
  </button>
);

// ─── Card ──────────────────────────────────────────────────────────────────
export const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cx('bg-[#181c26] border border-[#232736] rounded-2xl', className)}>
    {children}
  </div>
);

// ─── Input ─────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}
export const Input = ({ label, error, icon, className, ...rest }: InputProps) => (
  <div className="w-full">
    {label && (
      <label className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-1.5 font-[var(--font-display)]">
        {label}
      </label>
    )}
    <div className="relative">
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280] pointer-events-none">
          {icon}
        </span>
      )}
      <input
        {...rest}
        className={cx(
          'w-full bg-[#13161e] border border-[#232736] text-[#e8eaf0] placeholder-[#6b7280] rounded-xl text-sm transition-all',
          'focus:outline-none focus:border-[#00d4b4] focus:ring-1 focus:ring-[rgba(0,212,180,0.3)]',
          icon ? 'pl-9 pr-3.5 py-2.5' : 'px-3.5 py-2.5',
          error && 'border-[#f43f5e]',
          className
        )}
      />
    </div>
    {error && <p className="mt-1 text-xs text-[#f43f5e]">{error}</p>}
  </div>
);

// ─── Textarea ──────────────────────────────────────────────────────────────
interface TAProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}
export const Textarea = ({ label, className, ...rest }: TAProps) => (
  <div className="w-full">
    {label && (
      <label className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-1.5 font-[var(--font-display)]">
        {label}
      </label>
    )}
    <textarea
      {...rest}
      className={cx(
        'w-full bg-[#13161e] border border-[#232736] text-[#e8eaf0] placeholder-[#6b7280] rounded-xl text-sm transition-all resize-none',
        'focus:outline-none focus:border-[#00d4b4] focus:ring-1 focus:ring-[rgba(0,212,180,0.3)]',
        'px-3.5 py-2.5',
        className
      )}
    />
  </div>
);

// ─── Spinner ───────────────────────────────────────────────────────────────
export const Spinner = ({ size = 32, className }: { size?: number; className?: string }) => (
  <div
    className={cx('border-2 border-[#232736] border-t-[#00d4b4] rounded-full animate-spin', className)}
    style={{ width: size, height: size }}
  />
);

// ─── Badge ─────────────────────────────────────────────────────────────────
export const Badge = ({
  count,
  className,
}: { count: number; className?: string }) =>
  count > 0 ? (
    <span
      className={cx(
        'absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-[#f43f5e] text-white text-[10px] font-bold',
        className
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  ) : null;

// ─── Modal ─────────────────────────────────────────────────────────────────
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
}
export const Modal = ({ open, onClose, title, children, maxWidth = 'max-w-lg' }: ModalProps) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={cx('bg-[#13161e] border border-[#2e3347] rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-auto animate-fade-in', maxWidth)}
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#232736]">
            <h2 className="text-base font-bold text-[#f4f6fc] font-[var(--font-display)]">{title}</h2>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-[#6b7280] hover:text-[#e8eaf0] hover:bg-[#232736] text-xl leading-none transition-colors"
            >
              ×
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

// ─── Empty State ───────────────────────────────────────────────────────────
export const EmptyState = ({
  icon, title, subtitle,
}: { icon: React.ReactNode; title: string; subtitle?: string }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-16 h-16 rounded-2xl bg-[#181c26] border border-[#232736] flex items-center justify-center text-[#6b7280] mb-4">
      {icon}
    </div>
    <p className="font-semibold text-[#9ca3af] mb-1 font-[var(--font-display)]">{title}</p>
    {subtitle && <p className="text-sm text-[#6b7280] max-w-xs">{subtitle}</p>}
  </div>
);

// ─── Divider ───────────────────────────────────────────────────────────────
export const Divider = ({ className }: { className?: string }) => (
  <hr className={cx('border-[#232736]', className)} />
);

// ─── Tab Bar ───────────────────────────────────────────────────────────────
interface TabsProps<T extends string> {
  tabs: { key: T; label: string; count?: number }[];
  active: T;
  onChange: (t: T) => void;
  className?: string;
}
export function Tabs<T extends string>({ tabs, active, onChange, className }: TabsProps<T>) {
  return (
    <div className={cx('flex items-center gap-1 p-1 bg-[#13161e] rounded-xl border border-[#232736]', className)}>
      {tabs.map(({ key, label, count }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={cx(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center',
            active === key
              ? 'bg-[#00d4b4] text-[#0d0f14] font-bold'
              : 'text-[#6b7280] hover:text-[#e8eaf0] hover:bg-[#181c26]'
          )}
        >
          {label}
          {count !== undefined && count > 0 && (
            <span className={cx(
              'text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center',
              active === key ? 'bg-[#0d0f14]/30 text-[#0d0f14]' : 'bg-[#f43f5e] text-white'
            )}>
              {count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
