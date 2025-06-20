import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { addMinutes, isBefore, isAfter, isEqual, addDays, format } from 'date-fns';
import { InstrumentAndProjectStep } from "./SendToOpenLab/InstrumentAndProjectStep";
import { AvailabilityCalendarStep } from "./SendToOpenLab/AvailabilityCalendarStep";
import { StartTimeStep } from "./SendToOpenLab/StartTimeStep";
import { InstrumentBookingCalendar } from "./InstrumentBookingCalendar";
import { CalendarDays, Wrench, Play, Power } from "lucide-react";

// Extend props for timing for Make Ready, analysis, standby (all in minutes)
type SendToOpenLabDialogProps = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  sequenceLength: number;
  minPerSample?: number;
  onBlockInstrument: (info: {
    instrumentId: string;
    project: string;
    start: Date;
    end: Date;
  }) => void;
  existingBookings: any[];
  makeReadyDuration?: number;
  analysisDuration?: number;
  standbyDuration?: number;
};

const AGILENT_INSTRUMENTS = [
  { id: 'instr1', name: 'Agilent 1290 Infinity II' },
  { id: 'instr2', name: 'Agilent 1260 Infinity' },
  { id: 'instr3', name: 'Agilent 1100 Series' },
];

const ALL_PROJECTS = [
  'Metabolites Study',
  'Peptide QC',
  'Method Validation',
  'Protein Quantification',
  'Routine Sample Tracking',
];

function getUnavailableRanges(bookings: any[], instrumentId: string) {
  return bookings
    .filter(b => b.instrumentId === instrumentId)
    .map(b => ({ start: b.start, end: b.end }));
}

function isSlotAvailable(
  candidateStart: Date,
  candidateEnd: Date,
  unavailable: { start: Date; end: Date }[],
) {
  return !unavailable.some(({ start, end }) =>
    (isBefore(candidateStart, end) && isAfter(candidateEnd, start)) || isEqual(candidateStart, start)
  );
}

// Visualization bar helper - returns timing blocks for calendar display
function getScheduleBlocks({ start, makeReady, analysis, standby }: 
  { start: Date; makeReady: number; analysis: number; standby: number }) {
  const result: { label: string; color: string; start: Date; end: Date; icon: React.ReactNode }[] = [];
  let cursor = new Date(start);

  // Add Make Ready if >0
  if (makeReady > 0) {
    const end = addMinutes(cursor, makeReady);
    result.push({
      label: "Make Ready",
      color: "bg-blue-200 text-blue-800",
      start: new Date(cursor), end,
      icon: <Wrench className="inline-block w-4 h-4 mr-1" />
    });
    cursor = end;
  }
  // Add Analysis (always)
  if (analysis > 0) {
    const end = addMinutes(cursor, analysis);
    result.push({
      label: "Analysis",
      color: "bg-green-200 text-green-800",
      start: new Date(cursor), end,
      icon: <Play className="inline-block w-4 h-4 mr-1" />
    });
    cursor = end;
  }
  // Add Standby if >0
  if (standby > 0) {
    const end = addMinutes(cursor, standby);
    result.push({
      label: "Standby",
      color: "bg-gray-300 text-gray-900",
      start: new Date(cursor), end,
      icon: <Power className="inline-block w-4 h-4 mr-1" />
    });
    cursor = end;
  }
  return result;
}

export const SendToOpenLabDialog: React.FC<SendToOpenLabDialogProps> = ({
  open,
  onOpenChange,
  sequenceLength,
  minPerSample = 5,
  onBlockInstrument,
  existingBookings = [],
  makeReadyDuration = 0,
  analysisDuration = 0,
  standbyDuration = 0,
}) => {
  const [instrument, setInstrument] = useState<string>('');
  const [project, setProject] = useState<string>('');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string>('09:00');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const instruments = AGILENT_INSTRUMENTS;
  const fromDate = new Date();
  const toDate = addDays(fromDate, 7);

  const unavailable = useMemo(
    () => instrument ? getUnavailableRanges(existingBookings, instrument) : [],
    [existingBookings, instrument]
  );

  // Sequence time is just what's passed in as analysisDuration

  let startDt: Date | undefined;
  let endDt: Date | undefined;
  if (date && time) {
    const [h, m] = time.split(':').map(Number);
    startDt = new Date(date);
    startDt.setHours(h, m, 0, 0);
    let cursor = new Date(startDt);
    // Total plan duration = makeReady + analysis + standby
    endDt = addMinutes(cursor, makeReadyDuration + analysisDuration + standbyDuration);
  }

  function onDialogSend() {
    if (!instrument || !project || !startDt || !endDt) return;
    if (!isSlotAvailable(startDt, endDt, unavailable)) {
      setError('Selected time slot overlaps with an existing sequence on this instrument.');
      return;
    }
    setPending(true);
    setTimeout(() => {
      setPending(false);
      setError(null);
      onBlockInstrument({
        instrumentId: instrument,
        project,
        start: startDt!,
        end: endDt!,
      });
      setInstrument('');
      setProject('');
      setDate(undefined);
      setTime("09:00");
      onOpenChange(false);
    }, 700);
  }

  const selectedInstrumentArr = instrument
    ? instruments.filter(i => i.id === instrument)
    : [];

  // --- Calendar bar blocks for schedule preview ---
  const scheduleBlocks = (startDt && (makeReadyDuration + analysisDuration + standbyDuration > 0))
    ? getScheduleBlocks({
        start: startDt,
        makeReady: makeReadyDuration,
        analysis: analysisDuration,
        standby: standbyDuration
      })
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-5xl w-full min-h-[700px] max-h-[95vh] flex flex-col"
        style={{ minHeight: 700, maxHeight: "95vh" }}
      >
        <DialogHeader>
          <DialogTitle>
            <CalendarDays className="inline align-text-top w-6 h-6 mr-2 text-green-700" />
            Plan analysis
          </DialogTitle>
          <DialogDescription>
            Assign your sequence to an Agilent LC instrument. Fill out each section below and review bookings to select your timeslot.
          </DialogDescription>
        </DialogHeader>
        {/* Start scrollable content section */}
        <div className="flex-1 overflow-y-auto px-1 mt-2" style={{ minHeight: 0 }}>
          <form
            onSubmit={e => {
              e.preventDefault();
              onDialogSend();
            }}
            className="flex flex-col gap-6"
          >
            {/* Step 1: Instrument & Project */}
            <InstrumentAndProjectStep
              instrument={instrument}
              setInstrument={setInstrument}
              project={project}
              setProject={setProject}
              instruments={instruments}
              allProjects={ALL_PROJECTS}
            />

            {/* Step 2: Availability Calendar */}
            {!!instrument && (
              <AvailabilityCalendarStep
                instrument={instrument}
                bookings={existingBookings}
                date={date}
                setDate={setDate}
              />
            )}

            {/* Step 3: Start Time */}
            {!!instrument && !!date && (
              <StartTimeStep
                time={time}
                setTime={setTime}
                disabled={!date || !instrument}
                error={error}
              />
            )}

            {/* Submit */}
            <DialogFooter>
              <Button
                type="submit"
                disabled={!(instrument && project && startDt && endDt && isSlotAvailable(startDt, endDt, unavailable)) || pending}
              >
                {pending ? 'Planning...' : 'Plan analysis'}
              </Button>
            </DialogFooter>
          </form>
          {/* Step 6: Full Instrument Booking Calendar WITH PLAN VISUALIZATION */}
          <div className="mt-8">
            <div className="font-bold text-sm mb-2 text-blue-700 text-center">
              Instrument Bookings{instrument ? `: ${instruments.find(i => i.id === instrument)?.name}` : ''}
            </div>
            {/* Schedule Visualization Bar */}
            {(!!startDt && !!endDt && instrument) && (
              <div className="mb-4 flex justify-center">
                <div className="flex flex-row max-w-2xl w-full rounded-lg overflow-hidden border border-blue-200 bg-blue-50 h-12 shadow-sm divide-x">
                  {scheduleBlocks.map(({ label, color, start, end, icon }, idx) => (
                    <div
                      key={label}
                      className={`flex items-center justify-center flex-1 text-xs font-semibold ${color} px-2`}
                    >
                      {icon}
                      <span>
                        {label}
                        <span className="block font-mono text-xs font-normal">
                          {format(start, "HH:mm")}-{format(end, "HH:mm")}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <InstrumentBookingCalendar
                instrumentBookings={existingBookings}
                instruments={instrument ? selectedInstrumentArr : instruments}
              />
            </div>
          </div>
        </div>
        {/* End scrollable section */}
      </DialogContent>
    </Dialog>
  );
};
