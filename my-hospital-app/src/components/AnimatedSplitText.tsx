'use client';

import * as React from 'react';
import { motion, Variants } from 'framer-motion';  // ✅ Correct import

type AllowedTags = 'h1' | 'h2' | 'div' | 'span';

type AnimatedSplitTextBaseProps = {
  text: string;
  as?: AllowedTags;
  className?: string;
  delay?: number;
  stagger?: number;
  duration?: number;
};

type AnimatedSplitTextProps<T extends AllowedTags = 'h1'> =
  AnimatedSplitTextBaseProps &
  React.ComponentPropsWithoutRef<T>;

type ElementFor<T extends AllowedTags> =
  T extends 'h1' ? HTMLHeadingElement :
  T extends 'h2' ? HTMLHeadingElement :
  T extends 'div' ? HTMLDivElement :
  T extends 'span' ? HTMLSpanElement :
  HTMLElement;

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: (custom: { delay: number; stagger: number }) => ({
    opacity: 1,
    transition: {
      opacity: { delay: custom.delay, duration: 0.2 },
      staggerChildren: custom.stagger,
    },
  }),
};

const charVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  show: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 220, damping: 24 },
  },
};

function _AnimatedSplitText<T extends AllowedTags = 'h1'>(
  {
    text,
    as,
    className,
    delay = 0.1,
    stagger = 0.035,
    ...rest
  }: AnimatedSplitTextProps<T>,
  ref: React.Ref<ElementFor<T>>
) {
  const Tag = (as ?? 'h1') as T;
  const chars = Array.from(text);

  return (
    <Tag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(rest as any)}
      className={className}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
    >
      <span className="sr-only">{text}</span>
      <motion.span
        aria-hidden
        initial="hidden"
        animate="show"
        variants={containerVariants}
        custom={{ delay, stagger }}
        className="inline-block"
      >
        {chars.map((ch, idx) => (
          <motion.span
            key={`${ch}-${idx}`}
            variants={charVariants}
            className="inline-block will-change-transform"
            style={{ whiteSpace: ch === ' ' ? 'pre' : 'normal' }}
          >
            {ch}
          </motion.span>
        ))}
      </motion.span>
    </Tag>
  );
}

export const AnimatedSplitText = React.forwardRef(_AnimatedSplitText) as <
  T extends AllowedTags = 'h1'
>(
  props: AnimatedSplitTextProps<T> & { ref?: React.Ref<ElementFor<T>> }
) => React.ReactElement | null;
