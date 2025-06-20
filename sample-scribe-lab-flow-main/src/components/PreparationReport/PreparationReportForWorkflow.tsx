
import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays } from "lucide-react";
import SamplePreparationSection from "./SamplePreparationSection";
import SequencesSection from "./SequencesSection";
import InstrumentPrepSection from "./InstrumentPrepSection";
import SectionCard from "./SectionCard";
import { Columns, FlaskConical } from "lucide-react";
import { ActivityLogEntry } from "@/types/sample";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { SolventSelector } from "./SolventSelector";
import { ColumnSelector } from "./ColumnSelector";
import { SOPSelector } from "./SOPSelector";

// Helper to map workflow.steps[] to ActivityLog[]
function stepsToLog(steps: any[]): ActivityLogEntry[] {
  return (steps || []).map((step: any, i: number) => ({
    id: step.id || `step-${i}`,
    timestamp: new Date(step.timestamp),
    action: step.action,
    sampleId: step.sample_id,
    sampleBarcode: step.sample_barcode,
    details: step.details,
    metadata: step.metadata || {},
  }));
}

const PreparationReportForWorkflow = ({ workflow }: { workflow: any }) => {
  // Update on workflow or workflow changes in localStorage
  const [updateKey, setUpdateKey] = useState(0);

  React.useEffect(() => {
    const handler = () => setUpdateKey(k => k + 1);
    window.addEventListener('lab-activity-log', handler);
    window.addEventListener('workflow-continued', handler);
    window.addEventListener('workflow-loaded', handler);
    return () => {
      window.removeEventListener('lab-activity-log', handler);
      window.removeEventListener('workflow-continued', handler);
      window.removeEventListener('workflow-loaded', handler);
    };
  }, []);

  const [sopUrl, setSopUrl] = useState<string | null>(() => {
    const wfId = workflow.id || workflow.workflow_name;
    const sop = localStorage.getItem(`workflow-sop:${wfId}`);
    if (!sop) return null;
    try {
      return JSON.parse(sop).dataUrl || null;
    } catch {
      return sop;
    }
  });

  const log = React.useMemo(() => stepsToLog(workflow.steps || []), [workflow, updateKey]);

  // Save solvent selection to workflow as metadata step
  const handleSolventApply = (solvent, lcChannel, instrument) => {
    if (!workflow.steps) workflow.steps = [];
    workflow.steps.push({
      id: `solvent-${solvent.id}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: "Solvent Assigned",
      details: `Assigned ${solvent.name} (${solvent.volume}mL) to channel ${lcChannel} on ${instrument}`,
      metadata: { solventId: solvent.id, name: solvent.name, channel: lcChannel, volume: solvent.volume, instrument },
    });
    // store change for audit
    localStorage.setItem("current-workflow", JSON.stringify(workflow));
    window.dispatchEvent(new CustomEvent("workflow-continued"));
    setUpdateKey(k => k + 1);
  };

  const handleColumnApply = (column, instrument) => {
    if (!workflow.steps) workflow.steps = [];
    workflow.steps.push({
      id: `column-${column.id}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: "Column Assigned",
      details: `Assigned column ${column.name} (${column.type}) on ${instrument}`,
      metadata: { columnId: column.id, name: column.name, type: column.type, instrument },
    });
    localStorage.setItem("current-workflow", JSON.stringify(workflow));
    window.dispatchEvent(new CustomEvent("workflow-continued"));
    setUpdateKey(k => k + 1);
  };

  const workflowId = workflow.id || workflow.workflow_name; // fallback if needed

  return (
    <div className="max-w-3xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              Analysis Workflow Report <Badge variant="outline" className="ml-1">Audit-Ready</Badge>
            </span>
            <div className="mt-3">
              <SOPSelector workflowId={workflowId} onSOPSelected={(url) => setSopUrl(url as string)} />
            </div>
            {sopUrl && (
              <div className="mt-1">
                <a
                  href={sopUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  View SOP PDF
                </a>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <p>
              <CalendarDays className="inline-block w-5 h-5 mr-1 text-blue-500 align-middle" />
              Below is a detailed overview of this workflow’s process and steps.
            </p>
          </div>
          {/* Section: Solvent Preparation */}
          <SectionCard title="Solvent Management" icon={<FlaskConical className="w-6 h-6 text-cyan-700" />}>
            <div className="mb-3 text-gray-500">
              <b>Solvent preparation records are not yet available.</b> Please record solvent details in the Analysis Workflow.
            </div>
            <div className="mb-2">
              <SolventSelector onApply={handleSolventApply} />
            </div>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="solvent-protocol">
                <AccordionTrigger>Standard Solvent Preparation Protocol</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc ml-5 text-sm text-gray-700">
                    <li>Record lot numbers and expiration dates of each solvent used.</li>
                    <li>Check and document pH if needed.</li>
                    <li>Log responsible technician and date of preparation.</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </SectionCard>
          {/* Section: Column Preparation */}
          <SectionCard title="Column Management" icon={<Columns className="w-6 h-6 text-indigo-700" />}>
            <div className="mb-3 text-gray-500">
              <b>Column preparation actions not yet recorded.</b> Use the Analysis Workflow to add steps.
            </div>
            <div className="mb-2">
              <ColumnSelector onApply={handleColumnApply} />
            </div>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="column-protocol">
                <AccordionTrigger>Standard Column Prep Steps</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc ml-5 text-sm text-gray-700">
                    <li>Document column equilibration and conditioning times.</li>
                    <li>Record serial and batch numbers of columns.</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </SectionCard>
          {/* Section: Instrument Preparation */}
          <InstrumentPrepSection log={log} />
          {/* Section: Sample Preparation */}
          <SamplePreparationSection log={log} />
          {/* Section: Sequences and Analysis */}
          <SequencesSection log={log} />
        </CardContent>
      </Card>
    </div>
  );
};

export default PreparationReportForWorkflow;
