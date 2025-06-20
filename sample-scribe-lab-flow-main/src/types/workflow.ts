
// Minimal workflow type used in WorkflowManager

export interface Workflow {
  id: string;
  workflow_name: string;
  workflow_description?: string;
  workflow_steps: any[];
  user_id?: string;
}
