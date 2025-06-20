
import React, { useMemo } from "react";
import { format, startOfDay, addDays, isSameDay } from "date-fns";
import type { InstrumentBooking } from "./InstrumentBookingCalendar";

// A compact calendar strip to show availability for one instrument.
// Shows current week + optional selected date, colors busy slots.
type MiniProps = {
  instrumentId: string;
  bookings: InstrumentBooking[];
  selectedDate: Date | undefined;
  onDateSelect: (date: Date) => void;
};

export const InstrumentAvailabilityMiniCalendar: React.FC<MiniProps> = ({
  instrumentId,
  bookings,
  selectedDate,
  onDateSelect
}) => {
  // Show 7 days (Mon-Sun) from today
  const start = startOfDay(new Date());
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));

  // Find which days have busy bookings for this instrument
  const busyRange: Record<string, boolean> = {};
  bookings.forEach(b => {
    if (b.instrumentId === instrumentId) {
      for (const d of days) {
        if (isSameDay(b.start, d)) busyRange[format(d, "yyyy-MM-dd")] = true;
      }
    }
  });

  return (
    <div className="flex gap-1 items-center justify-between mt-3 mb-2">
      {days.map(d => {
        const busy = busyRange[format(d, "yyyy-MM-dd")];
        const selected = selectedDate && isSameDay(d, selectedDate);
        return (
          <button
            type="button"
            key={format(d, "yyyy-MM-dd")}
            onClick={() => onDateSelect(d)}
            className={`flex flex-col items-center justify-center w-10 p-1 rounded-md border transition-all
              ${selected ? "bg-blue-500 text-white border-blue-600" : busy ? "bg-gray-300 text-gray-600 border-gray-400 opacity-60" : "bg-white border-gray-200 hover:bg-blue-100"}
              `}
            disabled={busy}
          >
            <span className="text-xs font-medium">{format(d, "EE")}</span>
            <span className="font-bold">{format(d, "d")}</span>
          </button>
        );
      })}
    </div>
  );
};
