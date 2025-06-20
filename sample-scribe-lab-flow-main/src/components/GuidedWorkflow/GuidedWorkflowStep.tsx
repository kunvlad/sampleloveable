
import React from "react";
// The shape of a single step (should match workflow.steps[i])
type Step = {
  step?: number;
  timestamp?: string;
  action?: string;
  sample_id?: string;
  sample_barcode?: string;
  details?: string;
  metadata?: Record<string, any>;
};

type Props = {
  stepData: Step;
  currentStep: number;
  totalSteps: number;
  onPrev: () => void;
  onNext: () => void;
  showPrev: boolean;
  showNext: boolean;
};

const GuidedWorkflowStep: React.FC<Props> = ({
  stepData,
  currentStep,
  totalSteps,
  onPrev,
  onNext,
  showPrev,
  showNext,
}) => {
  return (
    <div className="max-w-2xl mx-auto mt-8">
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <div className="mb-3 flex justify-between items-center">
          <div className="text-lg font-semibold">
            Step {currentStep + 1} of {totalSteps}
          </div>
          <div className="text-xs text-gray-400">
            {stepData.timestamp && (
              <span>{new Date(stepData.timestamp).toLocaleString()}</span>
            )}
          </div>
        </div>
        <div className="mb-2">
          <span className="font-bold text-emerald-700">Action:</span>{" "}
          {stepData.action}
        </div>
        {stepData.sample_barcode && (
          <div>
            <span className="font-bold text-blue-700">Sample Barcode:</span>{" "}
            {stepData.sample_barcode}
          </div>
        )}
        {stepData.sample_id && (
          <div>
            <span className="font-bold text-gray-700">Sample ID:</span>{" "}
            {stepData.sample_id}
          </div>
        )}
        {stepData.details && (
          <div className="mt-2">
            <span className="font-bold text-gray-500">Details:</span>{" "}
            {stepData.details}
          </div>
        )}
        {stepData.metadata && Object.keys(stepData.metadata).length > 0 && (
          <div className="mt-2">
            <span className="font-bold text-gray-500">Metadata:</span>{" "}
            <span>
              {Object.entries(stepData.metadata).map(([k, v]) => (
                <span key={k} className="inline-block bg-gray-100 rounded px-2 py-0.5 mr-2">
                  {k}: <strong>{String(v)}</strong>
                </span>
              ))}
            </span>
          </div>
        )}
        <div className="flex gap-4 mt-6">
          <button
            onClick={onPrev}
            disabled={!showPrev}
            className={`px-4 py-2 rounded bg-slate-200 text-slate-700 font-semibold hover:bg-slate-300 transition ${
              !showPrev && "opacity-40 pointer-events-none"
            }`}
          >
            Previous
          </button>
          <button
            onClick={onNext}
            disabled={!showNext}
            className={`px-4 py-2 rounded bg-blue-500 text-white font-semibold hover:bg-blue-600 transition ${
              !showNext && "opacity-40 pointer-events-none"
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuidedWorkflowStep;
