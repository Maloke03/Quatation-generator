import { useLang } from '../i18n/LangContext';
import { statusColor, invoiceStatusColor } from '../utils/format';

export function Button({ children, onClick, variant = 'primary', size = 'md', disabled, className = '', type = 'button' }) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed';
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-5 py-3 text-base',
  };
  const variants = {
    primary: 'bg-green-500 text-white hover:bg-green-400',
    secondary: 'bg-[#1e3a2a] text-green-300 border border-[#2d5a3d] hover:bg-[#264a34]',
    danger: 'bg-red-900/40 text-red-400 border border-red-800/50 hover:bg-red-900/60',
    ghost: 'text-gray-400 hover:text-white hover:bg-white/5',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Input({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</label>}
      <input
        {...props}
        className={`w-full bg-[#0f2318] border ${error ? 'border-red-500' : 'border-[#2d5a3d]'} rounded-xl px-3 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/30 text-sm ${className}`}
      />
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}

export function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</label>}
      <select
        {...props}
        className={`w-full bg-[#0f2318] border ${error ? 'border-red-500' : 'border-[#2d5a3d]'} rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/30 text-sm ${className}`}
      >
        {children}
      </select>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}

export function Textarea({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</label>}
      <textarea
        {...props}
        className={`w-full bg-[#0f2318] border ${error ? 'border-red-500' : 'border-[#2d5a3d]'} rounded-xl px-3 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/30 text-sm resize-none ${className}`}
      />
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}

export function Card({ children, className = '', onClick }) {
  return (
    <div
      onClick={onClick}
      className={`bg-[#142a1e] border border-[#1e3a2a] rounded-2xl p-4 ${onClick ? 'cursor-pointer hover:border-green-700/50 transition-colors active:scale-[0.99]' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

export function StatusBadge({ status }) {
  const { t } = useLang();
  const colors = statusColor(status);
  const label = t.quote.statuses[status] || status;
  return (
    <span
      className="text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
    >
      {label}
    </span>
  );
}

export function InvoiceStatusBadge({ status }) {
  const { t } = useLang();
  const colors = invoiceStatusColor(status);
  const label = t.invoice.statuses[status] || status;
  return (
    <span
      className="text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
    >
      {label}
    </span>
  );
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-4">
      <div className="text-5xl opacity-30">{icon}</div>
      <div>
        <div className="text-white font-semibold text-lg">{title}</div>
        {description && <div className="text-gray-500 text-sm mt-1">{description}</div>}
      </div>
      {action}
    </div>
  );
}

export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-[#0f2318] border border-[#2d5a3d] rounded-t-3xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-[#1e3a2a] sticky top-0 bg-[#0f2318] z-10">
          <h2 className="font-bold text-white text-lg">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white p-1 rounded-lg">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

export function Confirm({ open, message, onConfirm, onCancel }) {
  const { t } = useLang();
  if (!open) return null;
  return (
    <Modal open={open} onClose={onCancel} title={t.common.confirm}>
      <p className="text-gray-300 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <Button variant="ghost" onClick={onCancel}>{t.common.cancel}</Button>
        <Button variant="danger" onClick={onConfirm}>{t.common.yes}</Button>
      </div>
    </Modal>
  );
}

export function TopBar({ title, left, right }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e3a2a] sticky top-0 bg-[#0a1810]/90 backdrop-blur-md z-20">
      <div className="flex items-center gap-2 min-w-0">
        {left}
        <h1 className="text-white font-bold text-lg truncate">{title}</h1>
      </div>
      {right && <div className="flex items-center gap-2 ml-2">{right}</div>}
    </div>
  );
}
