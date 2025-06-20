import React, { useState } from "react";

const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8am to 8pm
const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  instrumentId?: string;
  project?: string;
  isMaintenance?: boolean;
}

export interface WeekCalendarProps {
  weekStart?: Date; // Defaults to current week
  events?: CalendarEvent[];
  instruments?: { id: string; name: string }[];
  onAddBooking?: (date: Date, instrumentId?: string) => void;
  onEditBooking?: (event: CalendarEvent) => void;
  onDeleteBooking?: (event: CalendarEvent) => void;
  onAddMaintenance?: (date: Date, instrumentId?: string) => void;
  onDragBooking?: (event: CalendarEvent, newDate: Date) => void;
  onDropBooking?: (event: CalendarEvent, newDate: Date) => void;
  // Optionally pass selected instrument, view mode, etc. for context
  selectedInstrumentId?: string;
}

export const WeekCalendar: React.FC<WeekCalendarProps> = ({
  weekStart,
  events = [],
  instruments = [],
  onAddBooking,
  onEditBooking,
  onDeleteBooking,
  onAddMaintenance,
  onDragBooking,
  onDropBooking,
  selectedInstrumentId,
}) => {
  // Calculate start of week (Sunday)
  const today = weekStart ? new Date(weekStart) : new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  // Build days for the week
  const weekDays = days.map((_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  // Drag state (for drag-and-drop bookings)
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);

  // Helper: handle slot click for adding booking
  const handleSlotClick = (date: Date, instrumentId?: string) => {
    if (onAddBooking) onAddBooking(date, instrumentId);
  };

  // Helper: handle event click for edit
  const handleEventClick = (ev: CalendarEvent) => {
    if (onEditBooking) onEditBooking(ev);
  };

  // Helper: handle event right-click for delete/context menu
  const handleEventContextMenu = (ev: React.MouseEvent, event: CalendarEvent) => {
    ev.preventDefault();
    if (onDeleteBooking) onDeleteBooking(event);
  };

  // Helper: handle drag start
  const handleDragStart = (event: React.DragEvent, ev: CalendarEvent) => {
    setDraggedEventId(ev.id);
    event.dataTransfer.effectAllowed = "move";
  };

  // Helper: handle drop
  const handleDrop = (event: React.DragEvent, date: Date, instrumentId?: string) => {
    event.preventDefault();
    if (draggedEventId) {
      const draggedEvent = events.find(e => e.id === draggedEventId);
      if (draggedEvent && onDropBooking) {
        onDropBooking(draggedEvent, date);
      }
    }
    setDraggedEventId(null);
  };

  // Helper: allow drop
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  return (
    <div className="overflow-x-auto">
      <div className="grid grid-cols-8 min-w-[900px] border rounded-lg shadow bg-white">
        {/* Header Row */}
        <div className="bg-gray-100 border-b p-2 text-xs font-bold text-center">Time</div>
        {weekDays.map((date, i) => (
          <div key={i} className="bg-gray-100 border-b p-2 text-xs font-bold text-center">
            {days[date.getDay()]}<br />
            <span className="text-xs font-normal">{date.toLocaleDateString()}</span>
          </div>
        ))}
        {/* Time slots */}
        {hours.map((hour) => (
          <React.Fragment key={hour}>
            {/* Time label */}
            <div className="border-b border-r p-2 text-xs text-right bg-gray-50">
              {hour}:00
            </div>
            {/* Day columns */}
            {weekDays.map((date, dayIdx) => {
              // Compose slot date
              const slotDate = new Date(date);
              slotDate.setHours(hour, 0, 0, 0);
              return (
                <div
                  key={dayIdx}
                  className="border-b border-r h-16 relative hover:bg-blue-50 transition-colors cursor-pointer"
                  onClick={() => handleSlotClick(slotDate, selectedInstrumentId)}
                  onDrop={e => handleDrop(e, slotDate, selectedInstrumentId)}
                  onDragOver={handleDragOver}
                >
                  {/* Render events for this slot */}
                  {events
                    .filter(
                      (ev) =>
                        ev.start.getDay() === date.getDay() &&
                        ev.start.getHours() === hour
                    )
                    .map((ev) => (
                      <div
                        key={ev.id}
                        className="absolute left-1 right-1 top-1 bottom-1 bg-blue-500 text-white text-xs rounded p-1 shadow cursor-move"
                        draggable
                        onClick={e => { e.stopPropagation(); handleEventClick(ev); }}
                        onContextMenu={e => handleEventContextMenu(e, ev)}
                        onDragStart={e => handleDragStart(e, ev)}
                      >
                        {ev.title}
                      </div>
                    ))}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default WeekCalendar;
