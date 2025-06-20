
import React from "react";
import { InstrumentAvailabilityMiniCalendar } from "../InstrumentAvailabilityMiniCalendar";
import type { InstrumentBooking } from "../InstrumentBookingCalendar";

type Props = {
  instrument: string;
  bookings: InstrumentBooking[];
  date: Date | undefined;
  setDate: (dt: Date) => void;
};
export const AvailabilityCalendarStep: React.FC<Props> = ({
  instrument,
  bookings,
  date,
  setDate,
}) => (
  <div>
    <div className="font-semibold text-sm mb-2 mt-2">2. Available Days (Next 7)</div>
    <InstrumentAvailabilityMiniCalendar
      instrumentId={instrument}
      bookings={bookings}
      selectedDate={date}
      onDateSelect={setDate}
    />
  </div>
);
