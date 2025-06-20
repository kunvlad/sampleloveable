import React, { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, addWeeks, addMonths, isSameDay, isSameWeek, isSameMonth, differenceInMinutes, addMinutes } from "date-fns";
import { getFakeUserForBooking } from "@/utils/fakeUsers";
import { Calendar as CalendarIcon } from "lucide-react";

const HOURS = Array.from({ length: 24 }, (_, i) => i); // 00:00 - 23:00, for 24h
const WEEKDAYS = Array.from({ length: 7 }, (_, i) => i);

const COLORS = [
  "bg-green-200 border-green-400 text-green-800", // Analysis (was yellow)
  "bg-lime-200 border-lime-500 text-lime-900",
  "bg-blue-200 border-blue-500 text-blue-900",
  "bg-pink-200 border-pink-400 text-pink-800"
];

const PREP_BLOCK_CLASS = "bg-yellow-200 border-yellow-400 text-yellow-800"; // Update PREP_BLOCK_CLASS to yellow
const STANDBY_BLOCK_CLASS = "bg-purple-200 border-purple-400 text-purple-900";

const MAINT_BLOCK_CLASS = "bg-red-200 border-red-400 text-red-900";
const MAINT_PROJECT_LABEL = "Maintenance";

export type InstrumentBooking = {
  instrumentId: string;
  project: string;
  start: Date;
  end: Date;
};

type InstrumentBookingCalendarProps = {
  instrumentBookings: InstrumentBooking[];
  instruments: { id: string; name: string }[];
  defaultCalendarMode?: "per-instrument" | "whole-lab";
};

// --- Insert user to booking type override (only for local use)
type BookingWithUser = InstrumentBooking & { user?: string };

export const InstrumentBookingCalendar: React.FC<InstrumentBookingCalendarProps & {
  viewMode?: InstrumentBookingCalendarViewMode;
  onViewModeChange?: (mode: InstrumentBookingCalendarViewMode) => void;
  refDate?: Date;
  onRefDateChange?: (date: Date) => void;
}> = ({
  instrumentBookings,
  instruments,
  defaultCalendarMode = "per-instrument",
  viewMode: controlledViewMode,
  onViewModeChange,
  refDate: controlledRefDate,
  onRefDateChange,
}) => {
  // Fix: Only filter for Agilent instruments, do NOT require LC in name
  const agilentInstruments = React.useMemo(
    () => instruments.filter(instr =>
      instr.name.toLowerCase().includes("agilent")
    ),
    [instruments]
  );

  // Local state for user-created maintenance bookings (in-memory, doesn't use localStorage for now)
  const [maintenanceBookings, setMaintenanceBookings] = useState<InstrumentBooking[]>([]);

  // Maintenance Modal state
  const [isMaintModalOpen, setIsMaintModalOpen] = useState(false);
  const [maintStart, setMaintStart] = useState<string>("");
  const [maintEnd, setMaintEnd] = useState<string>("");
  const [maintError, setMaintError] = useState<string>("");

  // Helper to generate prep/standby "pseudo-bookings"
  function addPrepAndStandbyBlocks(bookings: InstrumentBooking[]): InstrumentBooking[] {
    // Add: - prep 20 minutes before each booking, project: "Make Ready (HPLC Prep)"
    //      - standby 10 minutes after each booking, project: "Stand By (HPLC)"
    // Mark special color by using instrumentId with "_prep" and "_standby" suffix (these don't clash with real instruments!)
    const all: InstrumentBooking[] = [...bookings];
    bookings.forEach(orig => {
      // Prep block: 20min before
      all.push({
        instrumentId: orig.instrumentId + "_prep",
        project: "Make Ready (HPLC Prep)",
        start: addMinutes(orig.start, -20),
        end: orig.start
      });
      // Standby block: 10min after
      all.push({
        instrumentId: orig.instrumentId + "_standby",
        project: "Stand By (HPLC)",
        start: orig.end,
        end: addMinutes(orig.end, 10)
      });
    });
    return all;
  }

  // Calendar view: day, week, month
  const [viewMode, setViewModeState] = useState<InstrumentBookingCalendarViewMode>(controlledViewMode || "day");
  // Show all instruments or per instrument
  const [calendarMode, setCalendarMode] = useState<"per-instrument" | "whole-lab">(defaultCalendarMode);
  // Which instrument to show (for per-instrument mode)
  const [selectedInstrument, setSelectedInstrument] = useState<string>(agilentInstruments[0]?.id || "");
  // Current reference date
  const [refDate, setRefDateState] = useState<Date>(controlledRefDate || startOfDay(new Date()));

  // Derived date ranges
  const currentRange = useMemo(() => {
    if (viewMode === "day") {
      return { start: startOfDay(refDate), end: endOfDay(refDate) };
    }
    if (viewMode === "week") {
      return { start: startOfWeek(refDate, { weekStartsOn: 1 }), end: endOfWeek(refDate, { weekStartsOn: 1 }) };
    }
    return { start: startOfMonth(refDate), end: endOfMonth(refDate) };
  }, [viewMode, refDate]);

  // Bookings + assign a random user to each analysis/project (not for prep/standby/maintenance)
  const bookingsToShow = useMemo(() => {
    let relevant: BookingWithUser[] = instrumentBookings.filter(
      b => b.start <= currentRange.end && b.end >= currentRange.start
    ).map(b => {
      // If analysis/project, add user
      if (!b.instrumentId.endsWith("_prep") && !b.instrumentId.endsWith("_standby") && b.project !== MAINT_PROJECT_LABEL) {
        return { ...b, user: getFakeUserForBooking(b.instrumentId, b.project) };
      }
      return b;
    });
    if (calendarMode === "per-instrument") {
      relevant = relevant.filter(b => b.instrumentId === selectedInstrument);
    }
    // Only Agilent
    relevant = relevant.filter(b =>
      agilentInstruments.some(ai => ai.id === b.instrumentId)
    );
    // ADD maintenance bookings (in mem only)
    if (calendarMode === "per-instrument") {
      relevant = [...relevant, ...maintenanceBookings.filter(
        m => m.instrumentId === selectedInstrument &&
             m.start <= currentRange.end && m.end >= currentRange.start
      )];
    } else {
      relevant = [...relevant, ...maintenanceBookings.filter(
        m => agilentInstruments.some(ai => ai.id === m.instrumentId) &&
             m.start <= currentRange.end && m.end >= currentRange.start
      )];
    }

    // Filter out prep/standby for week/month view
    if (viewMode === "week" || viewMode === "month") {
      relevant = relevant.filter(b => 
        !b.instrumentId.endsWith("_prep") &&
        !b.instrumentId.endsWith("_standby")
      );
    } else {
      // In day view, add HPLC prep/standby blocks for all non-maintenance bookings
      const notMaint = relevant.filter(b => b.project !== MAINT_PROJECT_LABEL);
      const withPrepStandby = addPrepAndStandbyBlocks(notMaint);
      // All maintenance bookings are left as is; merge arrays
      relevant = [
        ...withPrepStandby,
        ...relevant.filter(b => b.project === MAINT_PROJECT_LABEL),
      ];
    }
    return relevant;
  }, [instrumentBookings, currentRange, calendarMode, selectedInstrument, agilentInstruments, maintenanceBookings, viewMode]);

  // Instruments list logic
  React.useEffect(() => {
    if (controlledViewMode && controlledViewMode !== viewMode) setViewModeState(controlledViewMode);
  }, [controlledViewMode]);
  React.useEffect(() => {
    if (controlledRefDate && controlledRefDate.getTime() !== refDate.getTime()) setRefDateState(controlledRefDate);
  }, [controlledRefDate]);

  // When local state changes, notify parent
  React.useEffect(() => {
    if (onViewModeChange) onViewModeChange(viewMode);
  }, [viewMode]);
  React.useEffect(() => {
    if (onRefDateChange) onRefDateChange(refDate);
  }, [refDate]);

  // Replace setViewMode/setRefDate with local setters
  function handlePrev() {
    if (viewMode === "day") setRefDateState(addDays(refDate, -1));
    else if (viewMode === "week") setRefDateState(addWeeks(refDate, -1));
    else setRefDateState(addMonths(refDate, -1));
  }
  function handleNext() {
    if (viewMode === "day") setRefDateState(addDays(refDate, 1));
    else if (viewMode === "week") setRefDateState(addWeeks(refDate, 1));
    else setRefDateState(addMonths(refDate, 1));
  }
  function handleToday() {
    setRefDateState(startOfDay(new Date()));
  }

  // Modal handlers
  function openMaintModal() {
    setMaintError("");
    setMaintStart("");
    setMaintEnd("");
    setIsMaintModalOpen(true);
  }

  function handleMaintSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMaintError("");
    if (!maintStart || !maintEnd) {
      setMaintError("Please select both start and end time.");
      return;
    }
    const startDate = new Date(maintStart);
    const endDate = new Date(maintEnd);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || startDate >= endDate) {
      setMaintError("Invalid date or time range.");
      return;
    }
    // Check for overlap
    const hasConflict = bookingsToShow.some(b =>
      b.instrumentId === selectedInstrument &&
      b.end > startDate && b.start < endDate
    );
    if (hasConflict) {
      setMaintError("Maintenance conflicts with existing bookings.");
      return;
    }
    // Add maintenance booking (in memory only)
    setMaintenanceBookings((prev) => [
      ...prev,
      {
        instrumentId: selectedInstrument,
        project: MAINT_PROJECT_LABEL,
        start: startDate,
        end: endDate,
      }
    ]);
    setIsMaintModalOpen(false);
  }

  // NEW: Place date prominently for the user (visible and modern design)
  function ProminentDateCard() {
    // For week and month, show reference range, for day, show the date.
    let mainText = "";
    let subText = "";
    if (viewMode === "day") {
      mainText = format(refDate, "EEEE");
      subText = format(refDate, "PPP");
    } else if (viewMode === "week") {
      mainText = `${format(currentRange.start, "MMM d")} - ${format(currentRange.end, "MMM d, yyyy")}`;
      subText = format(refDate, "yyyy");
    } else {
      mainText = format(refDate, "LLLL yyyy");
      subText = ""; // month view, just show month+year
    }
    return (
      <div className="inline-block mb-2 mr-4">
        <div className='px-4 py-2 rounded-xl shadow-md bg-blue-100 border border-blue-300'>
          <span className="block text-lg font-bold text-blue-900">{mainText}</span>
          <span className="block text-xs text-blue-500">{subText}</span>
        </div>
      </div>
    );
  }

  // --- REUSABLE: HPLC Booking Type Legend ---
  function BookingTypeLegend() {
    return (
      <div className="flex flex-col mb-2 gap-1">
        {/* Booking Types */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1">
            <span className={`w-4 h-4 rounded bg-green-200 border-green-400 text-green-800 border mr-1`} />
            <span className="text-xs">Analysis</span>
          </div>
          {(viewMode === "day") && (
            <>
              <div className="flex items-center gap-1">
                <span className={`w-4 h-4 rounded ${PREP_BLOCK_CLASS} border mr-1`} />
                <span className="text-xs">HPLC Prep</span>
              </div>
              <div className="flex items-center gap-1">
                <span className={`w-4 h-4 rounded ${STANDBY_BLOCK_CLASS} border mr-1`} />
                <span className="text-xs">Stand By</span>
              </div>
            </>
          )}
          <div className="flex items-center gap-1">
            <span className={`w-4 h-4 rounded ${MAINT_BLOCK_CLASS} border mr-1`} />
            <span className="text-xs">Maintenance</span>
          </div>
        </div>
        {/* Instruments list (distinguish by icon) */}
        <div className="flex flex-wrap gap-3 mt-1">
          {agilentInstruments.map((instr, idx) => (
            <div key={instr.id} className="flex items-center gap-2 px-2 py-1 rounded bg-gray-100 border border-gray-200 text-xs shadow-sm">
              <CalendarIcon size={14} className="text-blue-600" />
              <span className="font-semibold">{instr.name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- CALENDAR VIEWS ---

  // DAY VIEW: Remove all label text, keep only block and show info on hover
  function renderDayView(instrIdList: string[]) {
    // Night time is considered: 0-5 and 20-23
    const NIGHT_HOURS = new Set([0,1,2,3,4,5,20,21,22,23]);
    return (
      <div className="overflow-x-auto max-w-full">
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="w-36 p-2 border-b bg-gray-50 text-left text-[11px] font-bold text-gray-500">Instrument</th>
              {HOURS.map(h => (
                <th
                  key={h}
                  className={
                    `px-1 py-1 border-b text-xs font-normal bg-gray-50 whitespace-nowrap` +
                    (NIGHT_HOURS.has(h) ? " bg-gray-200 text-gray-400" : "")
                  }
                >
                  {format(new Date().setHours(h, 0, 0, 0), "HH:mm")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {instrIdList.map(instrId => {
              const instr = agilentInstruments.find(i => i.id === instrId);
              const instrBookings = bookingsToShow.filter(b => {
                return (b.instrumentId === instrId ||
                  b.instrumentId === instrId + "_prep" ||
                  b.instrumentId === instrId + "_standby")
                  && isSameDay(b.start, refDate);
              });
              return (
                <tr key={instrId} className="border-b">
                  <td className="p-2 text-[11px] font-medium min-w-[130px] max-w-[180px] truncate flex items-center gap-2">
                    {/* Instrument icon + name for clarity */}
                    <CalendarIcon size={14} className="text-blue-600 mr-1" />
                    <span className="font-semibold">{instr?.name}</span>
                  </td>
                  {/* Change here: render a background for each hour cell by stacking absolute divs, or by using a grid of divs, but easiest is to do a single absolute night bg behind */}
                  <td colSpan={HOURS.length} className="relative h-8 px-0">
                    {/* Add timed backgrounds for night hours */}
                    <div className="absolute inset-0 flex items-stretch z-0">
                      {HOURS.map(h => (
                        <div
                          key={h}
                          className={`${NIGHT_HOURS.has(h) ? "bg-gray-200/80" : "bg-transparent"} h-full`}
                          style={{
                            width: `calc(100%/${HOURS.length})`
                          }}
                        />
                      ))}
                    </div>
                    <div className="absolute inset-0 flex items-stretch z-10">
                      {instrBookings.map((b, i) => {
                        const startHourDecimal = b.start.getHours() + b.start.getMinutes() / 60;
                        const endHourDecimal = b.end.getHours() + b.end.getMinutes() / 60;
                        const pLeft = Math.max(0, (startHourDecimal) / HOURS.length * 100);
                        const pWidth = Math.max(0.5, ((endHourDecimal - startHourDecimal) / HOURS.length) * 100);
                        // Tooltip label still available
                        let label = b.project;
                        if (b.project === MAINT_PROJECT_LABEL) label = "Maintenance";
                        else if (b.instrumentId.endsWith("_prep")) label = "Make Ready (HPLC Prep)";
                        else if (b.instrumentId.endsWith("_standby")) label = "Stand By (HPLC)";
                        // Add username if main analysis
                        let tooltip = `${label}: ${format(b.start, "HH:mm")}-${format(b.end, "HH:mm")}`;
                        if (!b.instrumentId.endsWith("_prep") && !b.instrumentId.endsWith("_standby") && b.project !== MAINT_PROJECT_LABEL && (b as BookingWithUser).user) {
                          tooltip += `\nUser: ${(b as BookingWithUser).user}`;
                        }

                        return (
                          <div
                            key={i}
                            className={`absolute top-0 h-7 ${instrColor(b.instrumentId, b.project)} border rounded-md px-0 text-xs leading-7 flex items-center`}
                            style={{
                              left: `${pLeft}%`,
                              width: `${pWidth}%`,
                              minWidth: 24,
                              zIndex: 1 + i,
                              boxShadow: "0 2px 8px rgba(0,0,0,0.13)"
                            }}
                            title={tooltip}
                          >
                            {/* NO LABEL VISIBLE */}
                          </div>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // WEEK and MONTH: Add username to tooltip as well
  function renderWeekView(instrIdList: string[]) {
    const days = Array.from({ length: 7 }, (_, i) => addDays(currentRange.start, i));
    return (
      <div className="overflow-x-auto max-w-full">
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="w-36 p-2 border-b bg-gray-50 text-left text-[11px] font-bold text-gray-500">Instrument</th>
              {days.map(d => (
                <th key={+d} className="px-2 py-1 border-b text-xs font-normal bg-gray-50">
                  {format(d, "EEE d/M")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {instrIdList.map(instrId => {
              const instr = agilentInstruments.find(i => i.id === instrId);
              return (
                <tr key={instrId} className="border-b">
                  <td className="p-2 text-[11px] font-medium min-w-[130px] max-w-[180px] truncate flex items-center gap-2">
                    {/* Instrument icon + name for clarity */}
                    <CalendarIcon size={14} className="text-blue-600 mr-1" />
                    <span className="font-semibold">{instr?.name}</span>
                  </td>
                  {days.map(day => {
                    const blocks = bookingsToShow.filter(b =>
                      (b.instrumentId === instrId || b.instrumentId === instrId + "_prep" || b.instrumentId === instrId + "_standby") &&
                      isSameDay(b.start, day)
                    );
                    return (
                      <td key={+day} className="relative h-8 px-0 bg-white">
                        {blocks.map((b, i) => {
                          let label = b.project;
                          if (b.project === MAINT_PROJECT_LABEL) label = "Maintenance";
                          else if (b.instrumentId.endsWith("_prep")) label = "Make Ready (HPLC Prep)";
                          else if (b.instrumentId.endsWith("_standby")) label = "Stand By (HPLC)";
                          let tooltip = `${label}: ${format(b.start, "HH:mm")}-${format(b.end, "HH:mm")}`;
                          if (!b.instrumentId.endsWith("_prep") && !b.instrumentId.endsWith("_standby") && b.project !== MAINT_PROJECT_LABEL && (b as BookingWithUser).user) {
                            tooltip += `\nUser: ${(b as BookingWithUser).user}`;
                          }
                          return (
                            <div
                              key={i}
                              className={`inline-block ${instrColor(b.instrumentId, b.project)} border rounded-md px-0 py-0 m-0.5 w-5 h-5 align-middle`}
                              title={tooltip}
                            />
                          )
                        })}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  function renderMonthView(instrIdList: string[]) {
    const daysInMonth: Date[] = [];
    let d = startOfMonth(currentRange.start);
    while (d <= endOfMonth(currentRange.start)) {
      daysInMonth.push(d);
      d = addDays(d, 1);
    }
    return (
      <div className="grid grid-cols-7 gap-px bg-gray-200 max-w-full">
        {daysInMonth.map(day => (
          <div key={+day} className="bg-white min-h-[48px] border p-1">
            <div className="text-xs font-bold text-gray-700">{format(day, "d")}</div>
            {instrIdList.map(instrId => (
              bookingsToShow
                .filter(b => b.instrumentId === instrId && isSameDay(b.start, day))
                .map((b, i) => {
                  let label = b.project;
                  if (b.project === MAINT_PROJECT_LABEL) label = "Maintenance";
                  else if (b.instrumentId.endsWith("_prep")) label = "Make Ready (HPLC Prep)";
                  else if (b.instrumentId.endsWith("_standby")) label = "Stand By (HPLC)";
                  let tooltip = `${label}: ${format(b.start, "HH:mm")}-${format(b.end, "HH:mm")}`;
                  if (!b.instrumentId.endsWith("_prep") && !b.instrumentId.endsWith("_standby") && b.project !== MAINT_PROJECT_LABEL && (b as BookingWithUser).user) {
                    tooltip += `\nUser: ${(b as BookingWithUser).user}`;
                  }
                  return (
                    <span
                      key={instrId + i}
                      className={`w-3 h-3 mt-1 rounded-full inline-block mr-1 ${instrColor(instrId, b.project)}`}
                      title={tooltip}
                    />
                  )
                })
            ))}
          </div>
        ))}
      </div>
    );
  }

  // Instrument groups: either per-instrument (one at a time) or all instruments together
  const instrGroups = useMemo(() => {
    if (calendarMode === "per-instrument") return [selectedInstrument];
    return agilentInstruments.map(i => i.id);
  }, [calendarMode, agilentInstruments, selectedInstrument]);

  // Render calendar header and navigation
  function CalendarToolbar() {
    return (
      <div className="flex flex-wrap gap-2 items-center mb-2">
        <Tabs value={viewMode} onValueChange={v => setViewModeState(v as any)}>
          <TabsList>
            <TabsTrigger value="day">Day</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <Button size="sm" variant="outline" onClick={handlePrev}>{"<"}</Button>
        <Button size="sm" variant="outline" onClick={handleToday}>Today</Button>
        <Button size="sm" variant="outline" onClick={handleNext}>{">"}</Button>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <Tabs value={calendarMode} onValueChange={v => setCalendarMode(v as any)}>
          <TabsList>
            <TabsTrigger value="per-instrument">Per Instrument</TabsTrigger>
            <TabsTrigger value="whole-lab">Whole Lab</TabsTrigger>
          </TabsList>
        </Tabs>
        {calendarMode === "per-instrument" &&
          <>
          <select
            className="ml-2 px-2 py-1 rounded border text-sm"
            value={selectedInstrument}
            onChange={e => setSelectedInstrument(e.target.value)}
          >
            {agilentInstruments.map(instr =>
              <option value={instr.id} key={instr.id}>{instr.name}</option>
            )}
          </select>
          <Button size="sm" className="ml-2" onClick={openMaintModal} variant="destructive">
            Book Maintenance
          </Button>
          </>
        }
        <span className="ml-auto text-sm font-semibold">
          {viewMode === "day" && format(refDate, "EEEE, PPP")}
          {viewMode === "week" && `${format(currentRange.start, "MMM d")} - ${format(currentRange.end, "MMM d, yyyy")}`}
          {viewMode === "month" && format(refDate, "LLLL yyyy")}
        </span>
        {/* Maintenance booking modal */}
        <Dialog open={isMaintModalOpen} onOpenChange={setIsMaintModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Book Maintenance for Instrument</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleMaintSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1" htmlFor="maint-start">Maintenance Start</label>
                <input
                  id="maint-start"
                  type="datetime-local"
                  className="border px-2 py-1 rounded text-xs w-full"
                  value={maintStart}
                  onChange={e => setMaintStart(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" htmlFor="maint-end">Maintenance End</label>
                <input
                  id="maint-end"
                  type="datetime-local"
                  className="border px-2 py-1 rounded text-xs w-full"
                  value={maintEnd}
                  onChange={e => setMaintEnd(e.target.value)}
                  required
                />
              </div>
              {maintError && (
                <div className="text-xs text-red-600">{maintError}</div>
              )}
              <DialogFooter>
                <Button type="submit" variant="destructive" size="sm">Add Maintenance</Button>
                <DialogClose asChild>
                  <Button type="button" variant="outline" size="sm">Cancel</Button>
                </DialogClose>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Color for an instrument (improve: special for _prep and _standby and MAINT_PROJECT_LABEL)
  function instrColor(instrumentId: string, project?: string) {
    if (project === MAINT_PROJECT_LABEL || instrumentId.endsWith("_maint")) return MAINT_BLOCK_CLASS;
    if (instrumentId.endsWith("_prep")) return PREP_BLOCK_CLASS; // yellow for HPLC Prep
    if (instrumentId.endsWith("_standby")) return STANDBY_BLOCK_CLASS;
    const cleanedId = instrumentId.replace(/(_prep|_standby)$/, "");
    const idx = agilentInstruments.findIndex(i => i.id === cleanedId);
    return COLORS[idx % COLORS.length]; // Analysis: green
  }

  //
  // MAIN calendar view rendering functions, with 24h day view
  //

  // MAIN UI
  return (
    <div className="border rounded-lg p-3 mb-4 bg-gray-50">
      {/* NEW: Show the chosen date block in the top-left corner */}
      <div className="flex gap-4 items-start mb-2">
        <ProminentDateCard />
        <div className="flex-1">
          {/* Show the legend and calendar toolbar in a row on large screens */}
          <BookingTypeLegend />
        </div>
      </div>
      <CalendarToolbar />
      <div className="mt-2">
        {viewMode === "day" && renderDayView(instrGroups)}
        {viewMode === "week" && renderWeekView(instrGroups)}
        {viewMode === "month" && renderMonthView(instrGroups)}
      </div>
    </div>
  );
};

// Add export for syncing
export type InstrumentBookingCalendarViewMode = "day" | "week" | "month";
