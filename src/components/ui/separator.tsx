import * as React from 'react';
import { cn } from '../../lib/utils';

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
}

const Separator = ({ className, orientation = 'horizontal', ...props }: SeparatorProps) => {
  return (
    <div
      aria-hidden
      className={cn(
        'shrink-0 bg-[#efe7dc]',
        orientation === 'vertical' ? 'h-full w-px' : 'h-px w-full',
        className,
      )}
      {...props}
    />
  );
};

export { Separator };
