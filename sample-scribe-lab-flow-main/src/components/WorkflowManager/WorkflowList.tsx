
import React from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Workflow } from "@/types/workflow";

interface WorkflowListProps {
  workflows: Workflow[];
  onSelect: (workflowId: string) => void;
}

export const WorkflowList: React.FC<WorkflowListProps> = ({ workflows, onSelect }) => (
  <div>
    <h2 className="text-xl font-semibold mb-2">Existing Workflows</h2>
    <div className="space-y-2">
      {workflows && workflows.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workflows.map((workflow) => (
              <TableRow key={workflow.id}>
                <TableCell>{workflow.workflow_name}</TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSelect(workflow.id)}
                  >
                    Select
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p>No workflows created yet.</p>
      )}
    </div>
  </div>
);

