import React, { useEffect, useState } from "react";
import { InstrumentBookingCalendar, InstrumentBooking, InstrumentBookingCalendarViewMode } from "@/components/InstrumentBookingCalendar";
import { InstrumentManagementPanel } from "@/components/InstrumentManagementPanel";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { WeekCalendar, CalendarEvent } from "@/components/ui/WeekCalendar";

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
  const [calendarViewMode, setCalendarViewMode] = useState<InstrumentBookingCalendarViewMode>("week");
  const [calendarRefDate, setCalendarRefDate] = useState<Date>(new Date());
  const [selectedInstrumentId, setSelectedInstrumentId] = useState<string | undefined>(undefined);
  const [modalState, setModalState] = useState<{ type: 'add' | 'edit' | 'delete' | 'maintenance' | null, event?: CalendarEvent, date?: Date }>({ type: null });

  // Map instrument bookings to calendar events for demo
  const calendarEvents: CalendarEvent[] = bookings.map((b, i) => ({
    id: `${b.instrumentId}-${i}`,
    title: `${b.project} (${AGILENT_INSTRUMENTS.find(instr => instr.id === b.instrumentId)?.name || b.instrumentId})`,
    start: new Date(b.start),
    end: new Date(b.end),
    instrumentId: b.instrumentId,
    project: b.project,
    isMaintenance: b.project === 'Maintenance',
  }));

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

  // --- Booking Management Handlers ---
  const saveBookings = (updated: InstrumentBooking[]) => {
    setBookings(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
  };

  const handleAddBooking = (date: Date, instrumentId?: string) => {
    setModalState({ type: 'add', date, event: undefined });
  };

  const handleEditBooking = (event: CalendarEvent) => {
    setModalState({ type: 'edit', event });
  };

  const handleDeleteBooking = (event: CalendarEvent) => {
    setModalState({ type: 'delete', event });
  };

  const handleAddMaintenance = (date: Date, instrumentId?: string) => {
    setModalState({ type: 'maintenance', date, event: undefined });
  };

  const handleDropBooking = (event: CalendarEvent, newDate: Date) => {
    // Move booking to new date/time
    const idx = bookings.findIndex(b => `${b.instrumentId}-${idx}` === event.id);
    if (idx !== -1) {
      const updated = [...bookings];
      const duration = updated[idx].end.getTime() - updated[idx].start.getTime();
      updated[idx] = {
        ...updated[idx],
        start: newDate,
        end: new Date(newDate.getTime() + duration),
      };
      saveBookings(updated);
    }
  };

  // --- Modal Dialog Logic (pseudo, for demonstration) ---
  // You would implement actual dialogs for add/edit/delete/maintenance here
  // For now, just auto-handle and close modalState
  useEffect(() => {
    if (modalState.type === 'add' && modalState.date) {
      // Add a new booking (demo: 2h block)
      const newBooking: InstrumentBooking = {
        instrumentId: selectedInstrumentId || AGILENT_INSTRUMENTS[0].id,
        project: 'New Booking',
        start: modalState.date,
        end: new Date(modalState.date.getTime() + 2 * 60 * 60 * 1000),
      };
      saveBookings([...bookings, newBooking]);
      setModalState({ type: null });
    } else if (modalState.type === 'delete' && modalState.event) {
      const updated = bookings.filter((b, i) => `${b.instrumentId}-${i}` !== modalState.event!.id);
      saveBookings(updated);
      setModalState({ type: null });
    } else if (modalState.type === 'edit' && modalState.event) {
      // For demo, just update project name
      const idx = bookings.findIndex((b, i) => `${b.instrumentId}-${i}` === modalState.event!.id);
      if (idx !== -1) {
        const updated = [...bookings];
        updated[idx] = { ...updated[idx], project: updated[idx].project + ' (Edited)' };
        saveBookings(updated);
      }
      setModalState({ type: null });
    } else if (modalState.type === 'maintenance' && modalState.date) {
      const newBooking: InstrumentBooking = {
        instrumentId: selectedInstrumentId || AGILENT_INSTRUMENTS[0].id,
        project: 'Maintenance',
        start: modalState.date,
        end: new Date(modalState.date.getTime() + 2 * 60 * 60 * 1000),
      };
      saveBookings([...bookings, newBooking]);
      setModalState({ type: null });
    }
  }, [modalState]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Instrument Bookings</h1>
      <div className="mb-8">
        <InstrumentManagementPanel instruments={AGILENT_INSTRUMENTS} />
      </div>
      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Week Calendar (Modern Outlook Style)</CardTitle>
          </CardHeader>
          <CardContent>
            <WeekCalendar
              events={calendarEvents}
              weekStart={calendarRefDate}
              instruments={AGILENT_INSTRUMENTS}
              selectedInstrumentId={selectedInstrumentId}
              onAddBooking={handleAddBooking}
              onEditBooking={handleEditBooking}
              onDeleteBooking={handleDeleteBooking}
              onAddMaintenance={handleAddMaintenance}
              onDropBooking={handleDropBooking}
            />
          </CardContent>
        </Card>
      </div>
      <div className="mb-8">
        <InstrumentBookingCalendar
          instrumentBookings={bookings}
          instruments={AGILENT_INSTRUMENTS}
          defaultCalendarMode="whole-lab"
          viewMode={calendarViewMode}
          onViewModeChange={setCalendarViewMode}
          refDate={calendarRefDate}
          onRefDateChange={setCalendarRefDate}
        />
      </div>
      <div className="mt-6 flex justify-center">
        <Link to="/">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
};

export default InstrumentBookings;
