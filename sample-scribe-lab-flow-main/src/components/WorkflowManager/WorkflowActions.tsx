
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, CopyCheck, Copy, Download, Upload, RotateCcw } from "lucide-react";
import { CSVDownloader } from "@/components/CSVDownloader";

interface WorkflowActionsProps {
  workflowSteps: any[];
  copyStatus: string;
  onCopy: (text: string) => void;
  onLoad: () => void;
  onImport: (json: object) => void;
  onClearForm: () => void;
}

export const WorkflowActions: React.FC<WorkflowActionsProps> = ({
  workflowSteps,
  copyStatus,
  onCopy,
  onLoad,
  onImport,
  onClearForm,
}) => {
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event: any) => {
        try {
          const json = JSON.parse(event.target.result);
          onImport(json);
        } catch {
          // Up to parent to show toast
          onImport(null as any);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="flex flex-wrap gap-4">
      <Button onClick={onLoad} disabled={workflowSteps.length === 0}>
        <Play className="h-4 w-4 mr-2" />
        Load Workflow
      </Button>
      <Button variant="secondary" onClick={() => onCopy(JSON.stringify(workflowSteps, null, 2))} disabled={workflowSteps.length === 0}>
        {copyStatus === 'success' ? (
          <CopyCheck className="h-4 w-4 mr-2 text-green-500" />
        ) : (
          <Copy className="h-4 w-4 mr-2" />
        )}
        Copy Steps
      </Button>
      <CSVDownloader data={workflowSteps} filename="workflow_steps.csv">
        <Button variant="secondary" disabled={workflowSteps.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export to CSV
        </Button>
      </CSVDownloader>
      <div className="relative">
        <Button variant="secondary" asChild>
          <Label htmlFor="importWorkflow" className="cursor-pointer flex items-center m-0">
            <Upload className="h-4 w-4 mr-2" />
            Import Workflow
          </Label>
        </Button>
        <Input
          type="file"
          id="importWorkflow"
          accept=".json, .csv"
          className="hidden"
          onChange={handleImport}
        />
      </div>
      <Button variant="ghost" onClick={onClearForm}>
        <RotateCcw className="h-4 w-4 mr-2" />
        Clear Form
      </Button>
    </div>
  );
};
