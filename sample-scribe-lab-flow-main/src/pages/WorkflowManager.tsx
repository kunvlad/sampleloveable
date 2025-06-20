import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { v4 as uuidv4 } from 'uuid';
import { Workflow } from '@/types/workflow';
import { useSupabase } from '@/providers/SupabaseProvider';
import { DeleteDialog } from '@/components/DeleteDialog';
import { WorkflowList } from '@/components/WorkflowManager/WorkflowList';
import { WorkflowForm } from '@/components/WorkflowManager/WorkflowForm';
import { WorkflowActions } from '@/components/WorkflowManager/WorkflowActions';
import { getWorkflows, createWorkflow, updateWorkflow, deleteWorkflow } from '@/lib/api/workflows';

const WorkflowManager = () => {
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [workflowSteps, setWorkflowSteps] = useState<any[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [copyStatus, copyToClipboard] = useCopyToClipboard();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, supabase } = useSupabase();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);

  // Load workflows from Supabase on mount
  React.useEffect(() => {
    if (!user?.id) return;
    getWorkflows(supabase, user.id).then(setWorkflows);
  }, [user, supabase]);

  const handleCopyToClipboard = (text: string) => {
    copyToClipboard(text);
    if (copyStatus === 'success') {
      toast({
        title: "Copied!",
        description: "Workflow steps copied to clipboard.",
      });
    } else if (copyStatus === 'error') {
      toast({
        title: "Error",
        description: "Failed to copy workflow steps to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleWorkflowSelect = useCallback((workflowId: string) => {
    setSelectedWorkflow(workflowId);
    setIsEditing(true);
    const workflow = workflows.find((w) => w.id === workflowId);
    if (workflow) {
      setWorkflowName(workflow.workflow_name);
      setWorkflowDescription(workflow.workflow_description || '');
      setWorkflowSteps(workflow.workflow_steps || []);
    } else {
      toast({
        title: "Workflow Not Found",
        description: "The selected workflow could not be found locally.",
        variant: "destructive",
      });
    }
  }, [workflows, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const workflowData: Workflow = {
      id: isEditing && selectedWorkflow ? selectedWorkflow : uuidv4(),
      workflow_name: workflowName,
      workflow_description: workflowDescription,
      workflow_steps: workflowSteps,
      user_id: user?.id,
    };
    try {
      if (isEditing && selectedWorkflow) {
        await updateWorkflow({ id: selectedWorkflow, updates: workflowData, supabase });
        toast({ title: "Workflow Updated", description: "Workflow has been updated in Supabase." });
      } else {
        await createWorkflow({ workflow: { ...workflowData, id: undefined }, supabase });
        toast({ title: "Workflow Created", description: "Workflow has been saved to Supabase." });
      }
      // Refresh workflows
      if (user?.id) getWorkflows(supabase, user.id).then(setWorkflows);
      setIsEditing(false);
      clearForm();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (selectedWorkflow) {
      try {
        await deleteWorkflow({ id: selectedWorkflow, supabase });
        toast({ title: "Workflow Deleted", description: "Workflow deleted from Supabase." });
        if (user?.id) getWorkflows(supabase, user.id).then(setWorkflows);
        setIsDeleteOpen(false);
        clearForm();
      } catch (err: any) {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    }
  };

  const handleStepAdd = () => {
    const newSample = {
      id: uuidv4(),
      name: `Sample ${workflowSteps.length + 1}`,
      barcode: `SAMPLE${Date.now().toString(36).toUpperCase()}`,
      sampleType: "unknown" as "unknown",
      volume: 0,
      concentration: null,
      position: null,
      parentId: null,
      isParent: true,
      weight: null,
      status: "created" as "created",
    };
    setWorkflowSteps([...workflowSteps, newSample]);
  };

  const handleStepUpdate = (id: string, updates: any) => {
    const updatedSteps = workflowSteps.map(step =>
      step.id === id ? { ...step, ...updates } : step
    );
    setWorkflowSteps(updatedSteps);
  };

  const handleStepDelete = (id: string) => {
    const updatedSteps = workflowSteps.filter(step => step.id !== id);
    setWorkflowSteps(updatedSteps);
  };

  const handleWorkflowLoad = () => {
    if (workflowSteps.length === 0) {
      toast({
        title: "No Samples",
        description: "Please add samples to the workflow.",
        variant: "destructive",
      });
      return;
    }

    localStorage.setItem('workflow-samples', JSON.stringify(workflowSteps));
    const event = new CustomEvent('workflow-loaded');
    window.dispatchEvent(event);
    navigate('/');
  };

  const handleImport = (imported: any) => {
    if (!imported) {
      toast({
        title: "Error Importing Workflow",
        description: "Failed to import workflow. Invalid JSON format.",
        variant: "destructive",
      });
      return;
    }
    setWorkflowSteps(imported);
    toast({
      title: "Workflow Imported",
      description: "Workflow has been successfully imported.",
    });
  };

  // Handler to delete all steps in the current workflow
  const handleDeleteAllSteps = async () => {
    if (!selectedWorkflow) {
      toast({
        title: "No Workflow Selected",
        description: "Please select a workflow to clear its steps.",
        variant: "destructive",
      });
      return;
    }
    try {
      // Update in Supabase
      await updateWorkflow({ id: selectedWorkflow, updates: { workflow_steps: [] }, supabase });
      // Update local state
      setWorkflowSteps([]);
      // Refresh workflows
      if (user?.id) getWorkflows(supabase, user.id).then(setWorkflows);
      toast({ title: "All Steps Deleted", description: "All steps have been deleted from the current workflow." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const clearForm = () => {
    setWorkflowName('');
    setWorkflowDescription('');
    setWorkflowSteps([]);
    setSelectedWorkflow(null);
    setIsEditing(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Workflow Manager</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <WorkflowList
            workflows={workflows}
            onSelect={handleWorkflowSelect}
          />
        </div>
        <div>
          <WorkflowForm
            workflowName={workflowName}
            workflowDescription={workflowDescription}
            workflowSteps={workflowSteps}
            isEditing={isEditing}
            onNameChange={setWorkflowName}
            onDescriptionChange={setWorkflowDescription}
            onAddStep={handleStepAdd}
            onUpdateStep={handleStepUpdate}
            onDeleteStep={handleStepDelete}
            onSubmit={handleSubmit}
            onDeleteWorkflow={() => setIsDeleteOpen(true)}
            onClearForm={clearForm}
          />
        </div>
      </div>
      <div className="border-t pt-4">
        <h2 className="text-xl font-semibold mb-2">Workflow Actions</h2>
        <div className="flex flex-wrap gap-2 mb-2">
          <button
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded shadow"
            onClick={handleDeleteAllSteps}
            disabled={!selectedWorkflow || workflowSteps.length === 0}
            type="button"
          >
            Delete All Steps
          </button>
        </div>
        <WorkflowActions
          workflowSteps={workflowSteps}
          copyStatus={copyStatus}
          onCopy={handleCopyToClipboard}
          onLoad={handleWorkflowLoad}
          onImport={handleImport}
          onClearForm={clearForm}
        />
      </div>
      <DeleteDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onDelete={handleDelete}
        itemName="workflow"
      />
    </div>
  );
};

export default WorkflowManager;
