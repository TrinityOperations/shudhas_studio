"use client";
import { motion, MotionConfig } from "framer-motion";
import type { ReactNode } from "react";
import { useHeaderCollapsed } from "./header-chrome";

/**
 * The logo mark inside the header's brand. When the header collapses the name leaves the
 * brand's layout, so the brand shrinks to the mark and centres; Framer Motion's `layout`
 * animates the mark from where it was to the centre (a transform, 300 ms, the header's easing).
 * `layoutDependency` re-measures on the collapsed state, which reaches this component through
 * context. Reduced motion makes the move instant (MotionConfig `user`).
 */
export function HeaderMark({ className, children }: { className: string; children: ReactNode }) {
  const collapsed = useHeaderCollapsed();
  return (
    <MotionConfig reducedMotion="user">
      <motion.span
        layout="position"
        layoutDependency={collapsed}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        aria-hidden
        data-placeholder="logo"
        data-artwork-mark
        className={className}
      >
        {children}
      </motion.span>
    </MotionConfig>
  );
}
