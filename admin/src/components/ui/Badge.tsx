import React from 'react';
import { clsx } from 'clsx';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'default'
    | 'accent'
    | 'success'
    | 'warning'
    | 'error'
    | 'danger'
    | 'neon'
    | 'neutral'
    | 'outline';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center font-bold tracking-wide uppercase rounded-full select-none';

  const variants = {
    default: 'bg-surfaceElevated text-slate-300 border border-border',
    neutral: 'bg-surfaceElevated text-slate-300 border border-border',
    accent: 'bg-accent/15 text-accent border border-accent/40',
    neon: 'bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/40',
    success: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    error: 'bg-red-500/15 text-red-400 border border-red-500/30',
    danger: 'bg-red-500/15 text-red-400 border border-red-500/30',
    outline: 'border border-border text-slate-400',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span className={clsx(baseStyles, variants[variant], sizes[size], className)} {...props}>
      {children}
    </span>
  );
};
