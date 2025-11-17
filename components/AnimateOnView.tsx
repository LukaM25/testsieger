"use client";
import { useEffect, useRef, useState } from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
  once?: boolean;
  stagger?: number; // ms between children
};

export default function AnimateOnView({ children, className = "", once = true, stagger = 80 }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true);
            if (once && ref.current) obs.unobserve(ref.current);
          }
        });
      },
      { threshold: 0.12 }
    );

    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [once]);

  // If children is a series, we add inline styles for stagger via CSS vars
  return (
    <div
      ref={ref}
      className={className}
      style={visible ? { ['--reveal-stagger' as any]: `${stagger}ms` } : undefined}
      data-revealed={visible ? 'true' : 'false'}
    >
      {children}
    </div>
  );
}
