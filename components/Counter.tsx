"use client";

import { useEffect, useRef, useState } from "react";

type CounterProps = {
  start?: number;
  end: number;
  duration?: number; // in ms
  className?: string;
};

export default function Counter({
  start = 0,
  end,
  duration = 2000,
  className,
}: CounterProps) {
  const [count, setCount] = useState(start);
  const ref = useRef<HTMLSpanElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce), (pointer: coarse)");
    const update = (event?: MediaQueryListEvent) => setShouldAnimate(event ? !event.matches : !query.matches);
    update();

    if (query.addEventListener) {
      query.addEventListener("change", update);
      return () => query.removeEventListener("change", update);
    }

    query.addListener(update);
    return () => query.removeListener(update);
  }, []);

  useEffect(() => {
    const currentRef = ref.current;
    if (!currentRef) return;
    if (typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setIsVisible(true);
            obs.unobserve(currentRef);
          }
        });
      },
      { threshold: 0.1 }
    );

    obs.observe(currentRef);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    if (!shouldAnimate) {
      setCount(end);
      return;
    }

    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const timePassed = now - startTime;
      const progress = Math.min(timePassed / duration, 1);

      // Easing function for smoother animation (easeOutExpo)
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      const currentCount = Math.floor(start + (end - start) * ease);
      setCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    requestAnimationFrame(animate);
  }, [isVisible, shouldAnimate, start, end, duration]);

  return (
    <span ref={ref} className={className}>
      {count.toLocaleString("de-DE")}
    </span>
  );
}
