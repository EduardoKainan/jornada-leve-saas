import * as React from 'react';
import { cn } from '@/lib/utils';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
};

export function Button({ className, variant = 'default', size = 'default', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
        variant === 'default' && 'bg-primary text-primary-foreground hover:bg-primary/90',
        variant === 'outline' && 'border bg-background hover:bg-accent',
        variant === 'ghost' && 'hover:bg-accent',
        variant === 'destructive' && 'bg-destructive text-destructive-foreground',
        size === 'default' && 'h-11 px-4 py-2',
        size === 'sm' && 'h-9 px-3 text-sm',
        size === 'lg' && 'h-12 px-6 text-base',
        size === 'icon' && 'size-11',
        className,
      )}
      {...props}
    />
  );
}