import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-[0.3rem] rounded-[10px] border border-transparent font-semibold text-inherit no-underline transition-colors cursor-pointer disabled:pointer-events-none disabled:opacity-50',
  {
  variants: {
    variant: {
      default: 'bg-[#24221f] text-[#f8f2eb] hover:bg-[#171614]',
      destructive: 'bg-[#be123c] text-white hover:bg-[#9f1239]',
      outline: 'bg-[#fffefb] text-[#302822] border-[#d9d0c4] hover:bg-[#f5efe7]',
      secondary: 'bg-[#f4ece2] text-[#302822] border-[#d9d0c4] hover:bg-[#eadecf]',
      ghost: 'bg-transparent text-[#302822] hover:bg-[#f4ece2]',
    },
    size: {
      default: 'h-[2.2rem] px-[0.85rem]',
      sm: 'h-[1.9rem] px-[0.65rem] text-[0.85rem]',
      lg: 'h-10 px-4',
      icon: 'h-[2.2rem] w-[2.2rem] p-0',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
