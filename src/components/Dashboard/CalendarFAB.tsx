"use client";

import { Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ScheduleModal } from './ScheduleModal';

export function CalendarFAB() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const open = () => setIsOpen(true);
    window.addEventListener('ichi-open-schedule', open);
    return () => window.removeEventListener('ichi-open-schedule', open);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const main = document.querySelector('main');
    const previous = main?.style.overflow ?? '';
    if (main) main.style.overflow = 'hidden';
    return () => { if (main) main.style.overflow = previous; };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="schedule-button fixed right-3 sm:right-6 flex h-10 items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_25px_rgba(37,99,235,0.6)] transition-all z-40 group focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-500"
        aria-label="経済指標スケジュールを開く"
      >
        <Calendar aria-hidden="true" className="h-5 w-5 group-hover:scale-110 transition-transform" />
        <span className="whitespace-nowrap text-[11px] font-semibold leading-4">スケジュール</span>
      </button>
      
      <ScheduleModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
