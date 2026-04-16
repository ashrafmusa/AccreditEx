/**
 * Tooltip Component - Contextual Help System
 *
 * Uses @floating-ui/react for smart positioning.
 * Provides accessible, responsive tooltips across the app.
 *
 * @author AccreditEx Team
 * @version 1.0.0
 */

import {
  arrow,
  autoUpdate,
  flip,
  offset,
  Placement,
  shift,
  useFloating,
} from "@floating-ui/react";
import React, { useEffect, useRef, useState } from "react";

export interface TooltipProps {
  /** Tooltip content text */
  text: string;
  /** Tooltip placement (default: 'top') */
  placement?: Placement;
  /** Delay before showing tooltip in ms (default: 200) */
  delay?: number;
  /** Children to wrap */
  children: React.ReactNode;
  /** Disable tooltip */
  disabled?: boolean;
  /** Max width in pixels (default: 320) */
  maxWidth?: number;
  /** Show arrow pointing to target */
  showArrow?: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({
  text,
  placement = "top",
  delay = 200,
  children,
  disabled = false,
  maxWidth = 320,
  showArrow = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const arrowRef = useRef<HTMLDivElement>(null);

  const {
    refs,
    floatingStyles,
    context,
    placement: finalPlacement,
  } = useFloating({
    placement,
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [
      offset(showArrow ? 12 : 8),
      flip(),
      shift({ padding: 8 }),
      arrow({ element: arrowRef }),
    ],
    whileElementsMounted: autoUpdate,
  });

  const handleMouseEnter = () => {
    if (disabled || !text) return;
    timeoutRef.current = setTimeout(() => {
      setIsOpen(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsOpen(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Arrow positioning
  const arrowSide = finalPlacement.split("-")[0] as
    | "top"
    | "right"
    | "bottom"
    | "left";
  const staticSide = {
    top: "bottom",
    right: "left",
    bottom: "top",
    left: "right",
  }[arrowSide];

  return (
    <>
      <div
        ref={refs.setReference}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
        className="inline-block"
      >
        {children}
      </div>

      {isOpen && !disabled && text && (
        <div
          ref={refs.setFloating}
          style={{
            ...floatingStyles,
            maxWidth: `${maxWidth}px`,
            zIndex: 9999,
          }}
          className="px-3 py-2 text-xs font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-lg shadow-xl pointer-events-none"
          role="tooltip"
        >
          {text}
          {showArrow && (
            <div
              ref={arrowRef}
              style={{
                position: "absolute",
                [staticSide]: "-4px",
              }}
              className="w-2 h-2 rotate-45 bg-gray-900 dark:bg-white"
            />
          )}
        </div>
      )}
    </>
  );
};

export default Tooltip;
