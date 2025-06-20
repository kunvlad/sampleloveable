
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";
import { Sample } from "@/types/sample";

interface WorkflowStepsEditorProps {
  steps: any[];
  onAdd: () => void;
  onUpdate: (id: string, updates: Partial<Sample>) => void;
  onDelete: (id: string) => void;
}

export const WorkflowStepsEditor: React.FC<WorkflowStepsEditorProps> = ({
  steps,
  onAdd,
  onUpdate,
  onDelete
}) => (
  <div>
    <div className="flex justify-between items-center mb-2">
      <Label>Workflow Steps</Label>
      <Button type="button" variant="outline" size="sm" onClick={onAdd}>
        <Plus className="h-4 w-4 mr-2" />
        Add Step
      </Button>
    </div>
    <div className="space-y-2">
      {steps.map((step) => (
        <Card key={step.id}>
          <CardHeader>
            <CardTitle>Step: {step.name}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`stepName-${step.id}`}>Name</Label>
              <Input
                type="text"
                id={`stepName-${step.id}`}
                placeholder="Sample Name"
                value={step.name}
                onChange={(e) => onUpdate(step.id, { name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor={`stepBarcode-${step.id}`}>Barcode</Label>
              <Input
                type="text"
                id={`stepBarcode-${step.id}`}
                placeholder="Sample Barcode"
                value={step.barcode}
                onChange={(e) => onUpdate(step.id, { barcode: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor={`stepSampleType-${step.id}`}>Sample Type</Label>
              <Select value={step.sampleType} onValueChange={(value) => onUpdate(step.id, { sampleType: value as Sample["sampleType"] })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Sample Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blank">Blank</SelectItem>
                  <SelectItem value="system-suitability">System Suitability</SelectItem>
                  <SelectItem value="control">Control</SelectItem>
                  <SelectItem value="calibration">Calibration</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                  <SelectItem value="sample">Sample</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="button" variant="destructive" size="sm" onClick={() => onDelete(step.id)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Step
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

