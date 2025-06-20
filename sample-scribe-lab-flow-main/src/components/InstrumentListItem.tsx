
import React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings, ExternalLink } from "lucide-react";
import { InstrumentConfig } from "./InstrumentConfigurationDialog";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";

type Workload = {
  pending: number;
  queued: number;
  done: number;
  inError: number;
};

type InstrumentListItemProps = {
  instrument: InstrumentConfig;
  selected: boolean;
  onSelect: (instrumentId: string) => void;
  getWorkload: (instrumentId: string) => Workload;
  onEdit: (instrument: InstrumentConfig) => void;
  onOpenLabAssist: (instrument: InstrumentConfig) => void;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'online': return 'bg-green-100 text-green-800';
    case 'offline': return 'bg-gray-100 text-gray-800';
    case 'maintenance': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

// Helper to get percent
function getPercent(count: number, total: number) {
  if (total === 0) return 0;
  return Math.round((count / total) * 100);
}

export const InstrumentListItem: React.FC<InstrumentListItemProps> = ({
  instrument,
  selected,
  onSelect,
  getWorkload,
  onEdit,
  onOpenLabAssist,
}) => {
  const navigate = useNavigate();
  const workload = getWorkload(instrument.id);

  const total =
    workload.pending + workload.queued + workload.done + workload.inError;

  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg hover:shadow-sm hover:bg-gray-50 animate-fade-in transition-shadow">
      <Checkbox
        checked={selected}
        onCheckedChange={() => onSelect(instrument.id)}
      />
      <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
          <div className="font-semibold">{instrument.name}</div>
          <div className="text-sm text-gray-500">{instrument.model}</div>
        </div>
        <div>
          <div className="text-sm font-medium">IP: {instrument.ipAddress}:{instrument.port}</div>
          <div className="text-sm text-gray-500">SN: {instrument.serialNumber}</div>
        </div>
        <div>
          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(instrument.status)}`}>
            {instrument.status.charAt(0).toUpperCase() + instrument.status.slice(1)}
          </span>
        </div>
        {/* Modern Progress/Workload Section */}
        <div className="flex flex-col gap-2 justify-center md:justify-start">
          <div className="font-semibold text-xs text-gray-900 mb-1">Analysis Workload</div>
          <div className="flex flex-col gap-1">
            <div className="relative h-5 rounded bg-gray-100 flex overflow-hidden shadow-inner">
              {total === 0 ? (
                <div className="flex-1 h-full bg-gray-200 flex items-center justify-center text-xs text-gray-400">
                  No workload
                </div>
              ) : (
                <>
                  {workload.pending > 0 && (
                    <div
                      className="h-full bg-yellow-400 transition-all duration-200"
                      style={{ width: `${getPercent(workload.pending, total)}%` }}
                      title="Pending"
                    />
                  )}
                  {workload.queued > 0 && (
                    <div
                      className="h-full bg-blue-400 transition-all duration-200"
                      style={{ width: `${getPercent(workload.queued, total)}%` }}
                      title="Queued"
                    />
                  )}
                  {workload.done > 0 && (
                    <div
                      className="h-full bg-green-400 transition-all duration-200"
                      style={{ width: `${getPercent(workload.done, total)}%` }}
                      title="Done"
                    />
                  )}
                  {workload.inError > 0 && (
                    <div
                      className="h-full bg-red-400 transition-all duration-200"
                      style={{ width: `${getPercent(workload.inError, total)}%` }}
                      title="In Error"
                    />
                  )}
                </>
              )}
            </div>
            <div className="flex flex-wrap gap-2 pt-1 text-xs">
              <span className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-sm bg-yellow-400" /> <span className="font-semibold">{workload.pending}</span> Pending
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-sm bg-blue-400" /> <span className="font-semibold">{workload.queued}</span> Queued
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-sm bg-green-400" /> <span className="font-semibold">{workload.done}</span> Done
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-sm bg-red-400" /> <span className="font-semibold">{workload.inError}</span> Error
              </span>
              <span className="hidden md:inline-block text-gray-400 px-2">|</span>
              <span className="text-xs text-gray-600 italic">Total: {total}</span>
            </div>
          </div>
        </div>
        {/* Reworked Actions Section: Responsive & Compact */}
        <div className="flex flex-wrap gap-2 items-center justify-end">
          {/* Modern: show icon-only on xs/sm, label+icon on md+ */}
          <Button
            size="icon"
            variant="ghost"
            className="md:hidden"
            onClick={() => onEdit(instrument)}
            title="Configure"
          >
            <Settings className="w-5 h-5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="md:hidden"
            onClick={() => onOpenLabAssist(instrument)}
            title="Lab Assist"
          >
            <ExternalLink className="w-5 h-5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="md:hidden"
            onClick={() => navigate(`/hplc-sequence-table?instrumentId=${encodeURIComponent(instrument.id)}`)}
            title="Sequence Table"
          >
            <span className="text-lg">🧪</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="hidden md:flex"
            onClick={() => onEdit(instrument)}
          >
            <Settings className="w-4 h-4 mr-1" />
            Configure
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="hidden md:flex"
            onClick={() => onOpenLabAssist(instrument)}
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            Lab Assist
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="hidden md:flex"
            onClick={() => navigate(`/hplc-sequence-table?instrumentId=${encodeURIComponent(instrument.id)}`)}
            title="Go to Analysis Scheduler"
          >
            <span className="mr-1">🧪</span>
            Analysis Scheduler
          </Button>
        </div>
      </div>
    </div>
  );
};
