
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function WorkflowExportUploader({
  activityLog,
  onUploadPreview,
  uploadedYaml,
  parsedWorkflow,
  onFileChange,
  onPreview,
  onSaveToLibrary,
}: {
  activityLog: any[];
  onUploadPreview?: (content: string) => void;
  uploadedYaml: string;
  parsedWorkflow: any;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPreview: () => void;
  onSaveToLibrary: () => void;
}) {
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // YAML converter logic
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

  const handleUploadButtonClick = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      {/* Download Button */}
      <div>
        <p className="text-sm text-gray-600 mb-4">
          Download your current activity log as a YAML file for backup or sharing.
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
      {/* Upload Button with preview */}
      <div>
        <div className="mt-8 flex flex-col gap-2">
          <label className="font-semibold text-md mb-1 flex items-center gap-1">
            <Upload className="h-4 w-4" />
            Upload Analysis Workflow
          </label>
          <p className="text-xs text-gray-500 mb-1">
            Import a workflow from a YAML file. Preview before saving.
          </p>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleUploadButtonClick}
              className="w-full"
              variant="secondary"
              type="button"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Workflow
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".yaml,.yml"
              className="hidden"
              onChange={onFileChange}
            />
          </div>
          {uploadedYaml && (
            <div className="mt-2 flex flex-col gap-2">
              <Button onClick={onPreview} variant="outline">Preview</Button>
              {parsedWorkflow && (
                <div className="p-2 bg-gray-100 rounded border border-gray-200">
                  <p className="text-xs text-gray-700 mb-1">
                    Name: <span className="font-semibold">{parsedWorkflow.workflow_name}</span>
                  </p>
                  <p className="text-xs text-gray-700 mb-1">
                    Steps: {parsedWorkflow.steps?.length || 0}
                  </p>
                  <Button size="sm" onClick={onSaveToLibrary} className="mt-1">
                    Save to Analysis Workflows
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
