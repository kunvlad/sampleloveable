
import React from "react";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';

type Instrument = { id: string; name: string };
type Props = {
  instrument: string;
  setInstrument: (val: string) => void;
  project: string;
  setProject: (val: string) => void;
  instruments: Instrument[];
  allProjects: string[];
};
export const InstrumentAndProjectStep: React.FC<Props> = ({
  instrument,
  setInstrument,
  project,
  setProject,
  instruments,
  allProjects,
}) => (
  <div>
    <div className="font-semibold text-sm mb-1">1. Instrument & Project</div>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex-1">
        <label className="block text-xs font-medium mb-1">Instrument</label>
        <Select value={instrument} onValueChange={setInstrument}>
          <SelectTrigger>
            <SelectValue placeholder="Choose Agilent LC instrument..." />
          </SelectTrigger>
          <SelectContent>
            {instruments.map(instr => (
              <SelectItem key={instr.id} value={instr.id}>{instr.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex-1">
        <label className="block text-xs font-medium mb-1">Project</label>
        <Select value={project} onValueChange={setProject}>
          <SelectTrigger>
            <SelectValue placeholder="Choose project..." />
          </SelectTrigger>
          <SelectContent>
            {allProjects.map(proj => (
              <SelectItem key={proj} value={proj}>{proj}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  </div>
);
