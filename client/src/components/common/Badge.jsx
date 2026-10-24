export default function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  showDot = true,
  className = ''
}) {
  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-medium',
    lg: 'text-sm px-3 py-1.5 font-semibold'
  };

  const variants = {
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    warning: 'bg-amber-50 text-amber-800 border-amber-200/80',
    danger: 'bg-rose-50 text-rose-800 border-rose-200/80',
    info: 'bg-sky-50 text-sky-800 border-sky-200/80',
    indigo: 'bg-indigo-50 text-indigo-800 border-indigo-200/80',
    purple: 'bg-purple-50 text-purple-800 border-purple-200/80',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200'
  };

  const dotColors = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-sky-500',
    indigo: 'bg-indigo-500',
    purple: 'bg-purple-500',
    neutral: 'bg-slate-400'
  };

  // Automatic variant detection if standard string matches
  let resolvedVariant = variant;
  const str = String(children || '').toLowerCase();
  if (variant === 'neutral') {
    if (str.includes('approved') || str.includes('complied') || str.includes('cleared')) {
      resolvedVariant = 'success';
    } else if (str.includes('overdue') || str.includes('reject') || str.includes('critical')) {
      resolvedVariant = 'danger';
    } else if (str.includes('deficienc') || str.includes('warning') || str.includes('pending')) {
      resolvedVariant = 'warning';
    } else if (str.includes('scrutiny') || str.includes('review') || str.includes('progress')) {
      resolvedVariant = 'indigo';
    } else if (str.includes('evc') || str.includes('scheduled')) {
      resolvedVariant = 'purple';
    }
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${variants[resolvedVariant] || variants.neutral} ${sizeClasses[size]} ${className}`}
    >
      {showDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[resolvedVariant] || dotColors.neutral}`}
        />
      )}
      <span>{children}</span>
    </span>
  );
}
