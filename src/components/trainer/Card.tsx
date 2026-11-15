import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  as?: React.ElementType;
}

export default function Card({
  children,
  className = '',
  padding = 'md',
  as: Component = 'div',
  ...rest
}: CardProps) {
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-7',
  }[padding];

  return (
    <Component
      className={`bg-white border border-slate-200/80 rounded-2xl shadow-[0_2px_12px_-4px_rgba(10,58,122,0.05),0_1px_3px_rgba(0,0,0,0.03)] ${paddingStyles} ${className}`}
      {...rest}
    >
      {children}
    </Component>
  );
}
