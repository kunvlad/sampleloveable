import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { WorkflowStepsEditor } from "./WorkflowStepsEditor";

interface WorkflowFormProps {
  workflowName: string;
  workflowDescription: string;
  workflowSteps: any[];
  isEditing: boolean;
  onNameChange: (val: string) => void;
  onDescriptionChange: (val: string) => void;
  onAddStep: () => void;
  onUpdateStep: (id: string, updates: any) => void;
  onDeleteStep: (id: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onDeleteWorkflow: () => void;
  onClearForm: () => void;
}

export const WorkflowForm: React.FC<WorkflowFormProps> = ({
  workflowName,
  workflowDescription,
  workflowSteps,
  isEditing,
  onNameChange,
  onDescriptionChange,
  onAddStep,
  onUpdateStep,
  onDeleteStep,
  onSubmit,
  onDeleteWorkflow,
}) => (
  <div>
    <h2 className="text-xl font-semibold mb-2">{isEditing ? 'Edit Workflow' : 'Create New Workflow'}</h2>
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="workflowName">Workflow Name</Label>
        <Input
          type="text"
          id="workflowName"
          placeholder="Workflow Name"
          value={workflowName}
          onChange={(e) => onNameChange(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="workflowDescription">Workflow Description</Label>
        <Textarea
          id="workflowDescription"
          placeholder="Workflow Description"
          value={workflowDescription}
          onChange={(e) => onDescriptionChange(e.target.value)}
        />
      </div>
      {/* Only show sample tracking (steps editor) if editing an existing workflow */}
      {isEditing ? (
        <WorkflowStepsEditor
          steps={workflowSteps}
          onAdd={onAddStep}
          onUpdate={onUpdateStep}
          onDelete={onDeleteStep}
        />
      ) : (
        <div className="text-gray-500 text-center my-4">
          Please create and save a workflow before adding or tracking samples.
        </div>
      )}
      <div className="flex justify-between">
        <Button type="submit">{isEditing ? 'Update Workflow' : 'Create Workflow'}</Button>
        {isEditing && (
          <Button variant="destructive" onClick={onDeleteWorkflow} type="button">
            Delete Workflow
          </Button>
        )}
      </div>
    </form>
  </div>
);

