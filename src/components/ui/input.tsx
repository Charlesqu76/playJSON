import * as React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return (
    <input
      className={cn(
        'w-full rounded-[10px] border border-[#d0c4b5] bg-[#fffefb] px-[0.6rem] py-[0.48rem] text-[#2e2a26] focus:outline-none focus:ring-2 focus:ring-[#f3bc82] focus:ring-offset-1',
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export { Input };
