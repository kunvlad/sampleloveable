
import React from "react";
import { format } from "date-fns";

type Props = {
  sequenceLength: number;
  minPerSample: number;
  estimateMinutes: number;
  startDt: Date | undefined;
  endDt: Date | undefined;
  showConflict: boolean;
};

export const SequenceEstimateStep: React.FC<Props> = ({
  sequenceLength, minPerSample, estimateMinutes, startDt, endDt, showConflict
}) => (
  <div>
    <div className="font-semibold text-sm mb-2 mt-1">4. Sequence Time Estimate</div>
    <div className="bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm space-y-1">
      <span>
        Injects: <strong>{sequenceLength}</strong> × <strong>{minPerSample} min</strong> = <strong>{estimateMinutes} min</strong>
      </span>
      {startDt && endDt && (
        <div>
          Slot: <strong>{format(startDt, 'PPPp')}</strong> <span className="mx-1">-</span> <strong>{format(endDt, 'p')}</strong>
        </div>
      )}
      {showConflict && (
        <div className="text-xs text-red-500 mt-2">Selected interval overlaps with existing booking.</div>
      )}
    </div>
  </div>
);
