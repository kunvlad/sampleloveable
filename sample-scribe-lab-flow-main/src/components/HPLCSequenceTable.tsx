import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sample } from '@/types/sample';
import { Download, Play, RotateCcw, Copy, Delete } from 'lucide-react';
import { Circle, Droplet, Square, Tag, Tags } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SendToOpenLabDialog } from './SendToOpenLabDialog';
import { Calendar as LucideCalendar } from 'lucide-react';
import { InstrumentBookingCalendar } from './InstrumentBookingCalendar';
import { InstrumentAvailabilityMiniCalendar } from './InstrumentAvailabilityMiniCalendar';
import { Wrench, Power } from 'lucide-react';

interface HPLCSequenceTableProps {
  samples: Sample[];
  selectedSamples: string[];
}

export const HPLCSequenceTable: React.FC<HPLCSequenceTableProps> = ({
  samples,
  selectedSamples
}) => {
  const [assignedPositions, setAssignedPositions] = useState<{ [sampleId: string]: number }>({});
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);
  const [editBookingIdx, setEditBookingIdx] = useState<number|null>(null);
  const [editBookingTime, setEditBookingTime] = useState<string>("09:00");
  const [editBookingDate, setEditBookingDate] = useState<Date|undefined>(undefined);
  const [showMakeReadyDialog, setShowMakeReadyDialog] = useState(false);
  const [makeReadyNote, setMakeReadyNote] = useState('');
  const [isMakeReadyAdded, setIsMakeReadyAdded] = useState(false);
  const [makeReadyDuration, setMakeReadyDuration] = useState(20); // minutes, default 20
  const [isStandby, setIsStandby] = useState(false);
  const [standbyDuration, setStandbyDuration] = useState(10); // minutes, default 10
  const { toast } = useToast();

  // Memo: full objects for selected samples that are eligible
  const selectedSampleObjects = useMemo(() => {
    return samples.filter(s => 
      selectedSamples.includes(s.id) && 
      (s.status === 'created') // CHANGED "received" => "created"
    );
  }, [samples, selectedSamples]);

  // Icons and distinct color classes for each sampleType
  const getSampleTypeIcon = (sampleType: Sample['sampleType']) => {
    switch (sampleType) {
      case 'blank': return <Square className="w-3.5 h-3.5 mr-1 text-gray-400" />;
      case 'system-suitability': return <Tag className="w-3.5 h-3.5 mr-1 text-blue-500" />;
      case 'control': return <Tags className="w-3.5 h-3.5 mr-1 text-green-600" />;
      case 'calibration': return <Droplet className="w-3.5 h-3.5 mr-1 text-purple-600" />;
      case 'unknown': return <Circle className="w-3.5 h-3.5 mr-1 text-orange-400" />;
      case 'sample': return <Tag className="w-3.5 h-3.5 mr-1 text-pink-500" />;
      default: return <Square className="w-3.5 h-3.5 mr-1 text-gray-400" />;
    }
  };

  const getSampleTypeColor = (sampleType: Sample['sampleType']) => {
    // Brighten and differentiate the background/text for table badges
    switch (sampleType) {
      case 'blank': return 'bg-gray-100 text-gray-900 border-gray-300';
      case 'system-suitability': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'control': return 'bg-green-100 text-green-800 border-green-200';
      case 'calibration': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'unknown': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'sample': return 'bg-pink-100 text-pink-800 border-pink-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatSampleType = (sampleType: Sample['sampleType']) => {
    return sampleType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Helper function: format number to have up to 1 decimal place if needed, otherwise show as integer.
  const formatNumber = (value: number | string | undefined | null) => {
    if (typeof value !== 'number' || isNaN(value)) return value ?? '-';
    if (Math.abs(value % 1) < 1e-6) return value.toString(); // integer
    return value.toFixed(1);
  };

  // --- Sequence rows state (for assigned positions) ---
  // Sequence is only updated when "Assign Selected" is pressed.
  type SampleSeqRow = { sampleId: string; key: string };
  const [seqRows, setSeqRows] = useState<SampleSeqRow[]>([]);

  // When "Assign Selected" is clicked, (re-)initialize seqRows with currently selected samples:
  const assignPositions = () => {
    // Build a sequence with one injection per selected sample, key "{id}-0"
    const newRows = selectedSampleObjects.map((s) => ({ sampleId: s.id, key: `${s.id}-0` }));
    setSeqRows(newRows);
    // Persist sequence to localStorage for global access
    localStorage.setItem('lab-hplc-sequence', JSON.stringify(selectedSampleObjects.map(s => s.id)));
    toast({
      title: "Positions Assigned",
      description: `${selectedSampleObjects.length} selected samples assigned to HPLC positions.`,
    });
  };

  // Always initialize seqRows from selectedSamples whenever they change
  useEffect(() => {
    if (selectedSamples.length > 0) {
      const initialRows = samples
        .filter(s => selectedSamples.includes(s.id) && s.status === 'created')
        .map(s => ({ sampleId: s.id, key: `${s.id}-0` }));
      setSeqRows(initialRows);
    } else {
      setSeqRows([]);
    }
  }, [selectedSamples, samples]);

  // --- Position indexes (derived from seqRows) ---
  useEffect(() => {
    const newPositions: { [k: string]: number } = {};
    seqRows.forEach((r, i) => { newPositions[r.key] = i + 1; });
    setAssignedPositions(newPositions);
  }, [seqRows]);

  const hasAssignedPositions = seqRows.length > 0;

  // Copy row (duplicate an injection)
  const handleCopyRow = (rowIdx: number) => {
    setSeqRows((rows) => {
      const rowToCopy = rows[rowIdx];
      const prevInstances = rows.filter(r => r.sampleId === rowToCopy.sampleId);
      const nextInstanceNum = prevInstances.length;
      const newKey = `${rowToCopy.sampleId}-${nextInstanceNum}`;
      const newRow = { sampleId: rowToCopy.sampleId, key: newKey };
      const newRows = [...rows];
      newRows.splice(rowIdx + 1, 0, newRow);
      return newRows;
    });
    toast({
      title: "Sample Copied",
      description: "Sample injection duplicated in sequence.",
    });
  };

  // Delete row (removes only that injection)
  const handleDeleteRow = (rowIdx: number) => {
    setSeqRows((rows) => {
      const removed = rows[rowIdx];
      const newRows = rows.slice(0, rowIdx).concat(rows.slice(rowIdx + 1));
      return newRows;
    });
    toast({
      title: "Sample Removed",
      description: "Sample injection removed from sequence.",
    });
  };

  // Move injection up or down
  const moveSample = (rowIdx: number, direction: "up" | "down") => {
    setSeqRows((rows) => {
      const idx = rowIdx;
      if (idx === -1) return rows;
      const newRows = [...rows];
      if (direction === "up" && idx > 0) {
        [newRows[idx - 1], newRows[idx]] = [newRows[idx], newRows[idx - 1]];
      }
      if (direction === "down" && idx < newRows.length - 1) {
        [newRows[idx + 1], newRows[idx]] = [newRows[idx], newRows[idx + 1]];
      }
      return newRows;
    });
  };

  // Drag and drop
  const handleDragStart = (index: number) => setDraggedIndex(index);
  const handleDragOver = (event: React.DragEvent<HTMLTableRowElement>) => event.preventDefault();
  const handleDrop = (toIndex: number) => {
    if (draggedIndex === null || draggedIndex === toIndex) return;
    setSeqRows((rows) => {
      const updatedOrder = [...rows];
      const [removed] = updatedOrder.splice(draggedIndex, 1);
      updatedOrder.splice(toIndex, 0, removed);
      return updatedOrder;
    });
    setDraggedIndex(null);
  };

  // Clear all
  const clearPositions = () => {
    setSeqRows([]);
    setAssignedPositions({});
    setIsMakeReadyAdded(false);
    setMakeReadyNote('');
    setIsStandby(false);
    toast({
      title: "Positions Cleared",
      description: "All HPLC position assignments have been cleared.",
    });
  };

  // Export CSV
  const exportSequence = () => {
    const sequenceData = seqRows
      .map((row, idx) => {
        const sample = samples.find(s => s.id === row.sampleId);
        return sample ? {
          Position: idx + 1,
          SampleName: sample.name,
          Barcode: sample.barcode,
          SampleType: sample.sampleType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          Volume: formatNumber(sample.volume),
          Concentration: sample.concentration != null
            ? formatNumber(sample.concentration)
            : 'Unknown',
          InjectionVolume: '10',
          Method: 'Standard_Method.met'
        } : null;
      })
      .filter(Boolean);

    const csvContent = [
      Object.keys(sequenceData[0] || {}).join(','),
      ...sequenceData.map(row => Object.values(row as any).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `HPLC_Sequence_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Sequence Exported",
      description: "HPLC sequence table has been downloaded as CSV.",
    });
  };

  // ADD: OpenLab Send dialog state & instrument bookings
  const [showCdsDialog, setShowCdsDialog] = useState(false);
  const [instrumentBookings, setInstrumentBookings] = useState<
    {
      instrumentId: string;
      project: string;
      start: Date;
      end: Date;
    }[]
  >([]);

  // Only Agilent
  const INSTRUMENTS = [
    { id: "instr1", name: "Agilent 1290 A" },
    // Add more Agilent instruments here as needed
  ];

  // ADD: handler for booking instrument from dialog
  const LOCAL_STORAGE_KEY = "instrument-bookings";
  function handleCdsBooking(info: { instrumentId: string; project: string; start: Date; end: Date; }) {
    setInstrumentBookings(prev => {
      const updated = [...prev, info];
      // Update localStorage so bookings are visible to booking calendar
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
    toast({
      title: "Sequence Sent",
      description: "Sequence scheduled on " + FAKE_INSTRUMENT_NAMES[info.instrumentId] + " in OpenLab CDS.",
      duration: 5000,
    });
  }
  useEffect(() => {
    // On mount: load from localStorage if bookings exist
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      setInstrumentBookings(JSON.parse(saved).map((b: any) => ({
        ...b,
        start: new Date(b.start),
        end: new Date(b.end)
      })));
    }
  }, []);

  // FAKE instrument name lookup for toast
  const FAKE_INSTRUMENT_NAMES: Record<string, string> = {
    'instr1': 'Agilent 1290 A',
    // Add more Agilent instrument mappings as needed
  };

  // --- Sequence Table calculations for timing ---
  // Assume each injection takes 10 min (this could be made dynamic later)
  const SEQUENCE_INJECTION_DURATION = 10;

  // Auto-calc for Make Ready: Base 10 + 2 min per sample, between 10-60 min
  const autoCalcMakeReadyDuration = React.useCallback(() => {
    const min = 10;
    const max = 60;
    const autoValue = Math.min(Math.max(min, 10 + 2 * selectedSampleObjects.length), max);
    setMakeReadyDuration(autoValue);
    toast({
      title: "Auto Make Ready Duration",
      description: `Suggested: ${autoValue} min (10 min + 2 min per sample)`,
    });
  }, [selectedSampleObjects.length, toast]);

  // Compute timing summary
  const sequenceTime = seqRows.length * SEQUENCE_INJECTION_DURATION; // in minutes
  const makeReadyTime = isMakeReadyAdded ? makeReadyDuration : 0;
  const standbyTime = isStandby ? standbyDuration : 0;
  const totalTime = makeReadyTime + sequenceTime + standbyTime;

  // For progress bar calculations
  const getStepPercent = (val: number) =>
    totalTime === 0 ? 0 : Math.round((val / totalTime) * 100);

  return (
    <Card className="h-fit">
      <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white">
        <CardTitle className="flex items-center gap-2">
          <Play className="h-6 w-6" />
          Analysis Scheduler
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {/* --- VISIBLE Make Ready and Standby Blocks --- */}
        {(isMakeReadyAdded || isStandby) && (
          <div className="flex flex-col gap-2 mb-6">
            {isMakeReadyAdded && (
              <div className="flex items-center gap-4 px-4 py-3 rounded-lg bg-blue-50 border border-blue-200">
                <Wrench className="h-5 w-5 text-blue-400 mr-2" />
                <div>
                  <div className="text-sm font-semibold text-blue-800 mb-1">Make Ready Task</div>
                  <div className="text-xs text-blue-700">{makeReadyNote || "Instrument preparation step added."}</div>
                  <div className="mt-1 text-xs text-gray-500">Duration: {makeReadyDuration} min</div>
                </div>
              </div>
            )}
            {isStandby && (
              <div className="flex items-center gap-4 px-4 py-3 rounded-lg bg-gray-100 border border-gray-200">
                <Power className="h-5 w-5 text-gray-700 mr-2" />
                <div>
                  <div className="text-sm font-semibold text-gray-900 mb-1">Instrument Standby</div>
                  <div className="text-xs text-gray-700">Instrument is in standby mode after sequence.</div>
                  <div className="mt-1 text-xs text-gray-500">Duration: {standbyDuration} min</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- PRE-TABLE: Make Ready & Standby Actions --- */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          {/* Make Ready Task */}
          <Button
            variant="outline"
            className="border-blue-400 text-blue-800 hover:bg-blue-50"
            onClick={() => setShowMakeReadyDialog(true)}
            disabled={isMakeReadyAdded}
          >
            <Wrench className="h-4 w-4 mr-1" />
            {isMakeReadyAdded ? "Make Ready Added" : "Add Make Ready Task"}
          </Button>
          {/* Standby Action */}
          <Button
            variant={isStandby ? "secondary" : "outline"}
            className={`${isStandby ? "bg-gray-300 text-gray-700" : "border-gray-400 text-gray-800 hover:bg-gray-50"} `}
            onClick={() => {
              setIsStandby(true);
              toast({
                title: "Instrument Set to Standby Mode",
                description: "The instrument is now in standby mode and will preserve resources.",
                duration: 3500,
              });
            }}
            disabled={isStandby}
          >
            <Power className="h-4 w-4 mr-1" />
            {isStandby ? "Instrument in Standby" : "Push Instrument to Standby"}
          </Button>
        </div>

        {/* --- Dialog: Make Ready Task --- */}
        {showMakeReadyDialog && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 min-w-[320px]">
              <h2 className="text-lg font-semibold mb-3 flex items-center">
                <Wrench className="h-5 w-5 mr-2 text-blue-700" />
                Make Ready Task
              </h2>
              <div className="mb-2 text-gray-700">
                Log a note or checklist for prepping the HPLC instrument.
              </div>
              <textarea
                value={makeReadyNote}
                onChange={e => setMakeReadyNote(e.target.value)}
                className="border rounded w-full p-2 mb-4 min-h-[64px]"
                placeholder="E.g., Prime system, check solvents, flush column, etc."
              />
              <label className="block text-xs text-gray-700 mb-1">Duration (minutes):</label>
              <div className="flex gap-2 items-center mb-2">
                <input
                  type="number"
                  min={1}
                  max={120}
                  className="border rounded px-2 py-1 w-24"
                  value={makeReadyDuration}
                  onChange={e => setMakeReadyDuration(Number(e.target.value))}
                />
                <Button 
                  size="sm"
                  className="border-blue-600 text-blue-700" 
                  type="button"
                  variant="outline"
                  onClick={autoCalcMakeReadyDuration}
                >
                  Auto-calc
                </Button>
                <span className="text-xs text-gray-400">(10 + 2min/sample)</span>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="secondary" onClick={() => setShowMakeReadyDialog(false)}>
                  Cancel
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => {
                    setShowMakeReadyDialog(false);
                    setIsMakeReadyAdded(true);
                    toast({
                      title: "Make Ready Task Added",
                      description: "Task recorded. Please ensure instrument preparation is complete.",
                      duration: 4000,
                    });
                  }}
                  disabled={isMakeReadyAdded}
                >
                  Save Task
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* --- EXISTING: Action Buttons --- */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button 
            onClick={assignPositions}
            disabled={selectedSampleObjects.length === 0}
            size="sm"
            className="bg-green-600 hover:bg-green-700"
          >
            <Play className="h-4 w-4 mr-1" />
            Assign Selected
          </Button>
          <Button 
            onClick={clearPositions}
            disabled={!hasAssignedPositions && !isMakeReadyAdded && !isStandby}
            variant="outline"
            size="sm"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Clear
          </Button>
          <Button 
            onClick={exportSequence}
            disabled={!hasAssignedPositions}
            variant="outline"
            size="sm"
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          {/* ADD: Plan Analysis button */}
          <Button
            type="button"
            className="bg-yellow-400 hover:bg-yellow-500 text-black"
            disabled={seqRows.length === 0}
            onClick={() => setShowCdsDialog(true)}
            size="sm"
          >
            <LucideCalendar className="h-4 w-4 mr-1" />
            Plan analysis
          </Button>
        </div>

        {/* --- TIMING SUMMARY VISUAL TABLE --- */}
        <div className="mt-8 mb-4">
          <h3 className="text-base font-bold mb-3 flex items-center gap-2">
            <span>Sequence Timing Summary</span>
            <span className="ml-2 text-xs text-gray-500">Total: {totalTime} min</span>
          </h3>
          <div className="w-full bg-gray-100 rounded-lg overflow-hidden mb-2 flex text-sm h-8">
            {isMakeReadyAdded && makeReadyDuration > 0 && (
              <div
                className="flex items-center justify-center bg-blue-200 text-blue-800 font-medium transition-all"
                style={{ width: `${getStepPercent(makeReadyDuration)}%`, minWidth: 56 }}
              >
                <Wrench className="h-4 w-4 mr-1" />
                {makeReadyDuration} min
              </div>
            )}
            {sequenceTime > 0 && (
              <div
                className="flex items-center justify-center bg-green-200 text-green-800 font-medium transition-all"
                style={{ width: `${getStepPercent(sequenceTime)}%`, minWidth: 56 }}
              >
                <Play className="h-4 w-4 mr-1" />
                {sequenceTime} min
              </div>
            )}
            {isStandby && standbyDuration > 0 && (
              <div
                className="flex items-center justify-center bg-gray-300 text-gray-900 font-medium transition-all"
                style={{ width: `${getStepPercent(standbyDuration)}%`, minWidth: 56 }}
              >
                <Power className="h-4 w-4 mr-1" />
                {standbyDuration} min
              </div>
            )}
          </div>
          {/* Detail table with icons */}
          <table className="w-full text-sm border rounded overflow-hidden bg-white">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="py-2 px-4 text-left">Step</th>
                <th className="py-2 px-4 text-right">Duration (min)</th>
              </tr>
            </thead>
            <tbody>
              {isMakeReadyAdded && (
                <tr>
                  <td className="py-2 px-4 flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-blue-600" />
                    Make Ready Task
                  </td>
                  <td className="py-2 px-4 text-right">{makeReadyDuration}</td>
                </tr>
              )}
              <tr>
                <td className="py-2 px-4 flex items-center gap-2">
                  <Play className="h-4 w-4 text-green-600" />
                  Sequence ({seqRows.length} injections @ {SEQUENCE_INJECTION_DURATION} min)
                </td>
                <td className="py-2 px-4 text-right">{sequenceTime}</td>
              </tr>
              {isStandby && (
                <tr>
                  <td className="py-2 px-4 flex items-center gap-2">
                    <Power className="h-4 w-4 text-gray-700" />
                    Instrument Standby
                  </td>
                  <td className="py-2 px-4 text-right">{standbyDuration}</td>
                </tr>
              )}
              <tr className="font-semibold border-t">
                <td className="py-2 px-4">Total Time</td>
                <td className="py-2 px-4 text-right">{totalTime}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span>Selected samples:</span>
              <Badge variant="outline" className="text-green-700 border-green-300">
                {selectedSampleObjects.length}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Assigned positions:</span>
              <Badge variant="outline" className="text-green-700 border-green-300">
                {seqRows.length}
              </Badge>
            </div>
          </div>
        </div>

        {/* REMOVED: Outlook calendar for instrument bookings to avoid duplication. */}
        {/* <InstrumentBookingCalendar
          instrumentBookings={instrumentBookings}
          instruments={INSTRUMENTS}
        /> */}

        {/* Sequence Table */}
        {hasAssignedPositions ? (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-16">Pos</TableHead>
                  <TableHead>Sample</TableHead>
                  <TableHead>Barcode</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="w-20">Vol (μL)</TableHead>
                  <TableHead className="w-24">Conc (mg/mL)</TableHead>
                  <TableHead className="w-28 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {seqRows.map((row, index) => {
                  const sample = samples.find(s => s.id === row.sampleId);
                  if (!sample) return null;
                  // Find any existing booking for this sequence position
                  const booking = instrumentBookings[index];

                  return (
                    <TableRow
                      key={row.key}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(index)}
                      style={{
                        opacity: draggedIndex === index ? 0.5 : 1,
                        cursor: 'move',
                        border: draggedIndex === index ? '2px dashed #10b981' : undefined
                      }}
                    >
                      <TableCell className="font-mono font-medium">
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{sample.name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-xs text-gray-500">{sample.barcode}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getSampleTypeColor(sample.sampleType) + " flex items-center gap-1"}>
                          {getSampleTypeIcon(sample.sampleType)}
                          {formatSampleType(sample.sampleType)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatNumber(sample.volume)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {sample.concentration != null
                          ? formatNumber(sample.concentration)
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button size="icon" variant="ghost" onClick={() => handleCopyRow(index)} title="Copy (Duplicate)">
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDeleteRow(index)} title="Delete">
                            <Delete className="h-4 w-4" />
                          </Button>
                          {booking && (
                            <Button size="icon" variant="outline"
                              onClick={() => {
                                setEditBookingIdx(index);
                                setEditBookingDate(new Date(booking.start));
                                setEditBookingTime(
                                  booking.start.getHours().toString().padStart(2, '0') + ':' +
                                  booking.start.getMinutes().toString().padStart(2, '0')
                                );
                              }}
                              title="Edit start"
                              className="ml-1"
                            >🕑</Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            {/* Edit Booking Time Dialog - very simple modal style */}
            {editBookingIdx !== null && (
              <div className="fixed inset-0 flex items-center justify-center z-40 bg-black/40">
                <div className="bg-white p-6 rounded shadow-xl flex flex-col gap-4 min-w-[330px]">
                  <h2 className="text-lg font-semibold">Edit Assigned Sequence Start Time</h2>
                  <label className="block mb-1">Date</label>
                  <input type="date" className="border rounded px-2 py-1 mb-2"
                    value={editBookingDate ? editBookingDate.toISOString().slice(0,10) : ""}
                    onChange={e => setEditBookingDate(new Date(e.target.value + "T" + (editBookingTime || "09:00")))}
                  />
                  <label className="block mb-1">Time</label>
                  <input type="time" className="border rounded px-2 py-1"
                    value={editBookingTime}
                    onChange={e => setEditBookingTime(e.target.value)}
                    step={900}
                  />
                  <div className="flex gap-2 justify-end mt-2">
                    <Button variant="secondary" onClick={() => setEditBookingIdx(null)}>Cancel</Button>
                    <Button
                      onClick={() => {
                        // Change booking for this sequence position
                        setInstrumentBookings(prev => prev.map((b, i) => {
                          if (i !== editBookingIdx || !editBookingDate || !editBookingTime) return b;
                          const [h, m] = editBookingTime.split(':').map(Number);
                          const newDate = new Date(editBookingDate);
                          newDate.setHours(h, m, 0, 0);
                          const duration = (b.end.getTime() - b.start.getTime()); // keep original duration
                          const newEnd = new Date(newDate.getTime() + duration);
                          return { ...b, start: newDate, end: newEnd };
                        }));
                        setEditBookingIdx(null);
                      }}
                    >Save</Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">No sequence generated</p>
            <p className="text-sm">
              {selectedSampleObjects.length === 0 
                ? 'Select samples and click "Assign Selected" to generate HPLC sequence' 
                : 'Click "Assign Selected" to generate HPLC sequence'
              }
            </p>
          </div>
        )}

        <SendToOpenLabDialog
          open={showCdsDialog}
          onOpenChange={setShowCdsDialog}
          sequenceLength={seqRows.length}
          onBlockInstrument={handleCdsBooking}
          existingBookings={instrumentBookings} // Pass bookings here
          // We will pass MakeReady and Standby durations and flags:
          makeReadyDuration={isMakeReadyAdded ? makeReadyDuration : 0}
          analysisDuration={seqRows.length * SEQUENCE_INJECTION_DURATION}
          standbyDuration={isStandby ? standbyDuration : 0}
        />
      </CardContent>
    </Card>
  );
};

export default HPLCSequenceTable;
