"use client";

import { Calendar } from 'lucide-react';
import { useState } from 'react';
import { ScheduleModal } from './ScheduleModal';

export function CalendarFAB() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 flex min-h-14 flex-col items-center justify-center gap-1 px-3 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_25px_rgba(37,99,235,0.6)] transition-all z-40 group hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-500"
        aria-label="経済指標スケジュールを開く"
      >
        <Calendar aria-hidden="true" className="h-[22px] w-[22px] sm:h-6 sm:w-6 group-hover:scale-110 transition-transform" />
        <span className="whitespace-nowrap text-[11px] font-semibold leading-4">スケジュール</span>
      </button>
      
      <ScheduleModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
