import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Play, Trash } from 'lucide-react';

type StoredWorkflow = {
  id: string;
  workflow: any;
  name: string;
  createdAt: string;
};

interface WorkflowLibraryProps {
  savedWorkflows: StoredWorkflow[];
  selectedWorkflowId: string | null;
  onSelect: (id: string) => void;
  onLoad: () => void;
  onDelete: (id: string) => void;
  onWorkflowClicked: (wf: StoredWorkflow) => void;
}

export const WorkflowLibrary: React.FC<WorkflowLibraryProps> = ({
  savedWorkflows,
  selectedWorkflowId,
  onSelect,
  onLoad,
  onDelete,
  onWorkflowClicked,
}) => {
  // Get active workflow from localStorage for highlight
  let activeWorkflowId: string | null = null;
  try {
    const wf = localStorage.getItem('current-workflow');
    if (wf) {
      const wfParsed = JSON.parse(wf);
      // Try match by ID first, else by content equality
      if (wfParsed.id) {
        activeWorkflowId = wfParsed.id;
      } else {
        // Try to find by steps matching
        const match = savedWorkflows.find(sw =>
          JSON.stringify(sw.workflow) === JSON.stringify(wfParsed)
        );
        if (match) activeWorkflowId = match.id;
      }
    }
  } catch { /* ignore */ }

  return (
    <div>
      {savedWorkflows.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-2">No analysis workflows saved yet</p>
          <p className="text-sm">Create your first workflow to get started</p>
        </div>
      ) : (
        <form
          onSubmit={e => {
            e.preventDefault();
            onLoad();
          }}
        >
          <div className="space-y-3">
            {savedWorkflows.map(wf => {
              const isSelected = selectedWorkflowId === wf.id;
              const isActive = activeWorkflowId === wf.id;
              return (
                <div
                  key={wf.id}
                  className={`border rounded-lg flex items-center gap-3 transition-all py-3 px-4
                  ${isSelected ? 'border-blue-500 bg-blue-50'
                    : isActive ? 'border-green-600 bg-green-50 ring-2 ring-green-400'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }
                  relative`
                  }
                >
                  {/* "Active" badge */}
                  {isActive && (
                    <span className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow active:scale-105 select-none z-10">
                      ACTIVE
                    </span>
                  )}
                  <input
                    type="radio"
                    name="workflow"
                    className="form-radio h-5 w-5 text-blue-600"
                    checked={isSelected}
                    onChange={() => onSelect(wf.id)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-lg">{wf.name}</h3>
                      <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full font-medium">
                        {new Date(wf.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Steps: {wf.workflow.steps?.length || 0}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      type="button"
                      onClick={() => onWorkflowClicked(wf)}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Load
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      type="button"
                      onClick={() => onDelete(wf.id)}
                    >
                      <Trash className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-end mt-6">
            <Button
              type="submit"
              disabled={!selectedWorkflowId}
              className={!selectedWorkflowId ? "opacity-60" : ""}
            >
              <Play className="h-4 w-4 mr-2" />
              Start Guided Workflow
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
