
import React, { useEffect, useState } from 'react';
import GuidedWorkflowStep from '@/components/GuidedWorkflow/GuidedWorkflowStep';

const GuidedWorkflowPage: React.FC = () => {
  const [workflow, setWorkflow] = useState<any | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [sopUrl, setSopUrl] = useState<string | null>(null);

  useEffect(() => {
    const loaded = localStorage.getItem('current-workflow');
    if (loaded) {
      const wf = JSON.parse(loaded);
      setWorkflow(wf);
      // Load SOP if available
      const wfId = wf.id || wf.workflow_name;
      const sop = localStorage.getItem(`workflow-sop:${wfId}`);
      if (sop) {
        try {
          setSopUrl(JSON.parse(sop).dataUrl || null);
        } catch {
          setSopUrl(null);
        }
      }
    }
  }, []);

  if (!workflow || !Array.isArray(workflow.steps) || workflow.steps.length === 0) {
    return null;
  }

  const stepData = workflow.steps[currentStepIndex];

  const handlePrev = () => {
    setCurrentStepIndex(idx => Math.max(idx - 1, 0));
  };

  const handleNext = () => {
    setCurrentStepIndex(idx => Math.min(idx + 1, workflow.steps.length - 1));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {sopUrl && (
          <div className="mb-4">
            <div className="font-bold mb-1">Standard Operating Procedure (SOP):</div>
            <iframe
              src={sopUrl}
              className="w-full rounded border"
              style={{ minHeight: 480, height: "60vh" }}
              title="SOP"
            />
          </div>
        )}
        <GuidedWorkflowStep
          stepData={stepData}
          currentStep={currentStepIndex}
          totalSteps={workflow.steps.length}
          onPrev={handlePrev}
          onNext={handleNext}
          showPrev={currentStepIndex > 0}
          showNext={currentStepIndex < workflow.steps.length - 1}
        />
      </div>
    </div>
  );
};

export default GuidedWorkflowPage;
