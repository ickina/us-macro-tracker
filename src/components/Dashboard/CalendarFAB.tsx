"use client";

import { Calendar } from 'lucide-react';
import { useState } from 'react';
import { ScheduleModal } from './ScheduleModal';

export function CalendarFAB() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_25px_rgba(37,99,235,0.6)] transition-all z-40 group hover:-translate-y-1"
        aria-label="経済指標スケジュールを開く"
      >
        <Calendar className="w-6 h-6 sm:w-7 sm:h-7 group-hover:scale-110 transition-transform" />
      </button>
      
      <ScheduleModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
