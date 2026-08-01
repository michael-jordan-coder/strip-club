"use client";

import { useEffect, useState } from "react";
import {
  motion,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";

const SPRING = { stiffness: 60, damping: 20 };

let particleId = 0;

type Particle = {
  id: number;
  pct: number;
  dx: number;
};

export function AnimatedPercent({ progress }: { progress: number }) {
  const spring = useSpring(0, SPRING);
  useEffect(() => {
    spring.set(progress);
  }, [progress, spring]);
  const text = useTransform(spring, (v) => String(Math.floor(v * 100)));
  return <motion.span>{text}</motion.span>;
}

/** Spring-driven bar with a glowing leading edge shedding particles. */
export function ProgressBar({ progress }: { progress: number }) {
  const reduced = useReducedMotion();
  const spring = useSpring(0, SPRING);
  useEffect(() => {
    spring.set(progress);
  }, [progress, spring]);
  const leftPct = useTransform(spring, (v) => `${v * 100}%`);

  const [particles, setParticles] = useState<Particle[]>([]);
  useEffect(() => {
    if (reduced) return;
    const timer = setInterval(() => {
      setParticles((prev) => {
        particleId += 1;
        const next = [
          ...prev,
          { id: particleId, pct: spring.get(), dx: (Math.random() - 0.5) * 20 },
        ];
        return next.slice(-8);
      });
    }, 260);
    return () => clearInterval(timer);
  }, [reduced, spring]);

  return (
    <div className="relative">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          initial={{ opacity: 0.9, y: 0, x: 0, scale: 1 }}
          animate={{ opacity: 0, y: -18, x: p.dx, scale: 0.4 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          onAnimationComplete={() =>
            setParticles((prev) => prev.filter((x) => x.id !== p.id))
          }
          className="pointer-events-none absolute -top-0.5 h-1 w-1 rounded-full bg-zinc-300"
          style={{ left: `${p.pct * 100}%` }}
        />
      ))}
      <div className="h-1 rounded-full bg-zinc-800">
        <motion.div
          className="h-full origin-left rounded-full bg-zinc-100"
          style={{ scaleX: spring }}
        />
      </div>
      {!reduced && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -top-1 h-3 w-3 -translate-x-1/2 rounded-full bg-zinc-100 blur-[6px]"
          style={{ left: leftPct }}
          animate={{ opacity: [0.25, 0.6, 0.25] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </div>
  );
}
