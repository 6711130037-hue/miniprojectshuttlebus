import React from 'react';
import {
  CheckCircle2,
  CheckCheck,
  Flag,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import {
  TicketActionStatus,
  TICKET_STATUS_CONFIG,
} from '../../types/schema';

export const TicketStatusBadge: React.FC<{
  status: TicketActionStatus;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}> = ({ status, showIcon = true, size = 'sm' }) => {
  const meta = TICKET_STATUS_CONFIG[status] || TICKET_STATUS_CONFIG['จองสำเร็จ'];
  const sizeClasses =
    size === 'lg'
      ? 'px-3.5 py-1.5 text-xs font-bold'
      : size === 'md'
      ? 'px-3 py-1 text-xs font-bold'
      : 'px-2.5 py-0.5 text-[11px] font-bold';

  const renderIcon = () => {
    switch (status) {
      case 'จองสำเร็จ':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
      case 'เช็กอินแล้ว':
        return <CheckCheck className="w-3.5 h-3.5 text-white shrink-0" />;
      case 'เสร็จสิ้น':
        return <Flag className="w-3.5 h-3.5 text-sky-600 shrink-0" />;
      case 'ยกเลิก':
        return <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />;
      case 'ไม่ได้ขึ้นรถ':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-800 shrink-0" />;
      default:
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border shadow-2xs whitespace-nowrap tracking-tight transition-all ${sizeClasses} ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}
      title={meta.description}
    >
      {showIcon && renderIcon()}
      <span>{meta.labelTh}</span>
      <span className="text-[10px] opacity-80 font-normal">({meta.labelEn})</span>
    </span>
  );
};