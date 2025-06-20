import React, { useEffect, useState } from "react";
import { InstrumentBookingCalendar, InstrumentBooking } from "@/components/InstrumentBookingCalendar";
import { InstrumentManagementPanel } from "@/components/InstrumentManagementPanel";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

// AGILENT instrument info (adjust as needed)
const AGILENT_INSTRUMENTS = [
  { id: 'instr1', name: 'Agilent 1290 Infinity II' },
  { id: 'instr2', name: 'Agilent 1260 Infinity' },
  { id: 'instr3', name: 'Agilent 1100 Series' },
];

const LOCAL_STORAGE_KEY = "instrument-bookings";
const DEMO_BOOKINGS: InstrumentBooking[] = [
  {
    instrumentId: "instr1",
    project: "Example Project 1",
    start: new Date(new Date().setHours(9, 30, 0, 0)),
    end: new Date(new Date().setHours(13, 0, 0, 0))
  },
  {
    instrumentId: "instr2",
    project: "Example Project 2",
    start: new Date(new Date().setHours(14, 0, 0, 0)),
    end: new Date(new Date().setHours(18, 0, 0, 0))
  },
];

const InstrumentBookings: React.FC = () => {
  const [bookings, setBookings] = useState<InstrumentBooking[]>([]);

  useEffect(() => {
    // Fetch from localStorage and convert date strings to Date objects
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    let loaded = DEMO_BOOKINGS;
    if (saved) {
      loaded = JSON.parse(saved).map((b: any) => ({
        ...b,
        start: new Date(b.start),
        end: new Date(b.end)
      }));
    }
    setBookings(loaded);

    // Set up a window event for any bookings change (listen across tabs/pages)
    const syncBookings = () => {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        setBookings(JSON.parse(saved).map((b: any) => ({
          ...b,
          start: new Date(b.start),
          end: new Date(b.end)
        })));
      }
    };
    window.addEventListener('storage', syncBookings);
    return () => window.removeEventListener('storage', syncBookings);
  }, []);

  return (
    <div className="container mx-auto py-8 px-2">
      {/* Instrument Management at the top */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Instrument Management</CardTitle>
          <div className="mt-1 mb-2 text-sm text-muted-foreground">
            Manage and view current and upcoming bookings for all Agilent instruments in the laboratory.
          </div>
        </CardHeader>
        <CardContent>
          <InstrumentManagementPanel />
        </CardContent>
      </Card>
      {/* Booking Calendar below */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <InstrumentBookingCalendar
            instrumentBookings={bookings}
            instruments={AGILENT_INSTRUMENTS}
            defaultCalendarMode="whole-lab"
          />
        </CardContent>
      </Card>
      <div className="mt-6 flex justify-center">
        <Link to="/">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
};

export default InstrumentBookings;
