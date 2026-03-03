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
        'ui-separator',
        orientation === 'vertical' ? 'ui-separator-vertical' : 'ui-separator-horizontal',
        className,
      )}
      {...props}
    />
  );
};

export { Separator };

