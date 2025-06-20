import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ActivityLogEntry } from '@/types/sample';
import { Download, Upload, FileText, Play, RefreshCw, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { NameWorkflowModal } from './NameWorkflowModal';

interface WorkflowManagerProps {
  activityLog: ActivityLogEntry[];
  onLoadWorkflow: (workflow: any) => void;
  onContinueWorkflow: (workflow: any, mode: string) => void;
  showNewWorkflowButton?: boolean;
}

export const WorkflowManager: React.FC<WorkflowManagerProps> = ({
  activityLog,
  onLoadWorkflow,
  onContinueWorkflow,
  showNewWorkflowButton = true
}) => {
  const [workflowYaml, setWorkflowYaml] = useState('');
  const { toast } = useToast();
  const [parsedWorkflow, setParsedWorkflow] = useState<any>(null);

  const convertActivityLogToYaml = () => {
    const workflow = {
      workflow_name: `Lab_Workflow_${new Date().toISOString().split('T')[0]}`,
      created_at: new Date().toISOString(),
      description: "Laboratory sample preparation workflow",
      steps: activityLog.map((entry, index) => ({
        step: index + 1,
        timestamp: entry.timestamp.toISOString(),
        action: entry.action,
        sample_id: entry.sampleId,
        sample_barcode: entry.sampleBarcode,
        details: entry.details,
        metadata: entry.metadata || {}
      }))
    };

    // Convert to YAML-like format (simplified)
    let yamlContent = `workflow_name: "${workflow.workflow_name}"\n`;
    yamlContent += `created_at: "${workflow.created_at}"\n`;
    yamlContent += `description: "${workflow.description}"\n`;
    yamlContent += `steps:\n`;
    
    workflow.steps.forEach(step => {
      yamlContent += `  - step: ${step.step}\n`;
      yamlContent += `    timestamp: "${step.timestamp}"\n`;
      yamlContent += `    action: "${step.action}"\n`;
      yamlContent += `    sample_id: "${step.sample_id}"\n`;
      yamlContent += `    sample_barcode: "${step.sample_barcode}"\n`;
      yamlContent += `    details: "${step.details}"\n`;
      if (Object.keys(step.metadata).length > 0) {
        yamlContent += `    metadata:\n`;
        Object.entries(step.metadata).forEach(([key, value]) => {
          yamlContent += `      ${key}: "${value}"\n`;
        });
      }
    });

    return yamlContent;
  };

  const downloadWorkflow = () => {
    const yamlContent = convertActivityLogToYaml();
    const blob = new Blob([yamlContent], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lab_workflow_${new Date().toISOString().split('T')[0]}.yaml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Workflow Downloaded",
      description: "Activity log has been saved as YAML file.",
    });
  };

  const parseYamlWorkflow = (yamlContent: string) => {
    try {
      // Simple YAML parser for our specific format
      const lines = yamlContent.split('\n');
      const workflow: any = { steps: [] };
      let currentStep: any = null;
      let inMetadata = false;

      lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;

        if (trimmed.startsWith('workflow_name:')) {
          workflow.workflow_name = trimmed.split(': ')[1]?.replace(/"/g, '');
        } else if (trimmed.startsWith('created_at:')) {
          workflow.created_at = trimmed.split(': ')[1]?.replace(/"/g, '');
        } else if (trimmed.startsWith('description:')) {
          workflow.description = trimmed.split(': ')[1]?.replace(/"/g, '');
        } else if (trimmed.startsWith('- step:')) {
          if (currentStep) {
            workflow.steps.push(currentStep);
          }
          currentStep = { step: parseInt(trimmed.split(': ')[1]), metadata: {} };
          inMetadata = false;
        } else if (currentStep) {
          if (trimmed.startsWith('metadata:')) {
            inMetadata = true;
          } else if (inMetadata && trimmed.includes(': ')) {
            const [key, value] = trimmed.split(': ');
            currentStep.metadata[key.trim()] = value?.replace(/"/g, '') || '';
          } else if (trimmed.includes(': ')) {
            const [key, value] = trimmed.split(': ');
            const cleanKey = key.trim();
            const cleanValue = value?.replace(/"/g, '') || '';
            
            if (cleanKey === 'timestamp') {
              currentStep.timestamp = cleanValue;
            } else if (cleanKey === 'action') {
              currentStep.action = cleanValue;
            } else if (cleanKey === 'sample_id') {
              currentStep.sample_id = cleanValue;
            } else if (cleanKey === 'sample_barcode') {
              currentStep.sample_barcode = cleanValue;
            } else if (cleanKey === 'details') {
              currentStep.details = cleanValue;
            }
          }
        }
      });

      if (currentStep) {
        workflow.steps.push(currentStep);
      }

      return workflow;
    } catch (error) {
      throw new Error('Invalid YAML format');
    }
  };

  const handlePreviewWorkflow = () => {
    try {
      const workflowData = parseYamlWorkflow(workflowYaml);
      setParsedWorkflow(workflowData);
      toast({
        title: "Workflow Parsed",
        description: `${workflowData.steps.length} steps detected. Choose an action below.`,
      });
    } catch (error) {
      toast({
        title: "Invalid Workflow",
        description: "Failed to parse YAML workflow. Please check the format.",
        variant: "destructive"
      });
      setParsedWorkflow(null);
    }
  };

  const handleLoadWorkflow = () => {
    try {
      const workflow = parseYamlWorkflow(workflowYaml);
      setParsedWorkflow(workflow);
      // FIX: only pass 1 argument here, onLoadWorkflow expects only 'workflow'
      onLoadWorkflow(workflow);
      toast({
        title: "Workflow Loaded (Replay Mode)",
        description: `Loaded workflow with ${workflow.steps.length} steps. Ready for guided execution.`,
      });
    } catch (error) {
      toast({
        title: "Invalid Workflow",
        description: "Failed to parse YAML workflow. Please check the format.",
        variant: "destructive"
      });
    }
  };

  const handleContinueWorkflow = () => {
    try {
      const workflow = parseYamlWorkflow(workflowYaml);
      setParsedWorkflow(workflow);
      onContinueWorkflow(workflow, "continue");
      toast({
        title: "Workflow Loaded to Continue",
        description: `Workflow "${workflow.workflow_name}" loaded. You can continue adding samples and progress.`,
      });
    } catch (error) {
      toast({
        title: "Invalid Workflow",
        description: "Failed to parse YAML workflow. Please check the format.",
        variant: "destructive"
      });
    }
  };

  const loadFromFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setWorkflowYaml(content);
      // Optionally auto-preview the workflow
      handlePreviewWorkflow();
    };
    reader.readAsText(file);
  };

  // Move New Workflow handler/context from page to here:
  const startNewWorkflow = () => {
    localStorage.removeItem('current-workflow');
    localStorage.removeItem('guided-workflow');
    localStorage.removeItem('lab-activity-log');
    localStorage.removeItem('lab-samples');
    localStorage.removeItem('lab-selected-samples');
    localStorage.removeItem('workflow-mode');
    toast({
      title: "New Workflow Started",
      description: "All data has been cleared. You can now start a fresh workflow.",
    });
    window.dispatchEvent(new CustomEvent('workflow-reset'));
  };

  return (
    <Card className="h-fit">
      <CardHeader className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Workflow Manager
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Show New Workflow Button INSIDE workflow manager ONLY if allowed by prop */}
        {showNewWorkflowButton && (
          <div className="mb-1 flex justify-end">
            <Button
              onClick={() => window.dispatchEvent(new CustomEvent("open-new-workflow-modal"))}
              variant="outline"
              className="border-green-200 text-green-700 hover:bg-green-50"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              New Workflow
            </Button>
          </div>
        )}
        {/* Download Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Export Current Workflow</h3>
          <p className="text-sm text-gray-600">
            Download your current activity log as a YAML file for reproducible workflows.
          </p>
          <Button 
            onClick={downloadWorkflow} 
            disabled={activityLog.length === 0}
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Workflow ({activityLog.length} steps)
          </Button>
        </div>

        <hr className="border-gray-200" />

        {/* Upload Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Load Workflow</h3>
          <p className="text-sm text-gray-600">
            Load a previously saved workflow to reproduce the exact same steps, or continue where you left off.
          </p>
          
          <div>
            <Label htmlFor="workflow-file">Upload YAML File</Label>
            <Input
              id="workflow-file"
              type="file"
              accept=".yaml,.yml"
              onChange={loadFromFile}
              className="mt-1"
            />
          </div>
          <div className="flex flex-col gap-2 mt-3">
            <Button 
              onClick={handleLoadWorkflow} 
              disabled={!workflowYaml.trim()}
              className="w-full"
              variant="outline"
            >
              <Play className="h-4 w-4 mr-2" />
              Replay Workflow (Guided)
            </Button>
            <Button 
              onClick={handleContinueWorkflow} 
              disabled={!workflowYaml.trim()}
              className="w-full"
              variant="secondary"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Continue Workflow (Work from Last Step)
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
