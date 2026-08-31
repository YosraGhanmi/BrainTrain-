'use client';

import { motion } from 'framer-motion';
import type { CurriculumPhase } from '@/lib/coursesData';

export default function CurriculumTimeline({
  curriculum,
  color,
  heading,
  phaseLabels,
}: {
  curriculum: CurriculumPhase[];
  color: string;
  heading: string;
  phaseLabels: string[];
}) {
  return (
    <motion.div
      className="mt-16 max-w-3xl"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">{heading}</h2>

      <ol className="relative mt-8 space-y-10 pl-8">
        <motion.span
          aria-hidden
          className="absolute bottom-0 left-0 top-0 w-[2px] origin-top bg-ink/10"
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />

        {curriculum.map((phase, i) => (
          <motion.li
            key={phase.title}
            className="relative"
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.45, ease: 'easeOut', delay: i * 0.15 }}
          >
            <motion.span
              className="absolute -left-[calc(2rem+7px)] top-1 h-3.5 w-3.5 rounded-full border-2 border-white"
              style={{ backgroundColor: color }}
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.35, ease: 'easeOut', delay: i * 0.15 + 0.2 }}
            />
            <p className="text-xs font-bold uppercase tracking-wide text-stone">{phaseLabels[i]}</p>
            <h3 className="mt-1 font-display text-xl font-semibold text-ink">{phase.title}</h3>
            <ul className="mt-3 space-y-2">
              {phase.points.map((point, j) => (
                <motion.li
                  key={point}
                  className="flex items-start gap-2.5 text-sm leading-relaxed text-stone"
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.35, ease: 'easeOut', delay: i * 0.15 + 0.3 + j * 0.06 }}
                >
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                  {point}
                </motion.li>
              ))}
            </ul>
          </motion.li>
        ))}
      </ol>
    </motion.div>
  );
}
