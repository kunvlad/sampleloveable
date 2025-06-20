
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type NameWorkflowModalProps = {
  open: boolean;
  onSubmit: (name: string) => void;
  onClose: () => void;
};

export const NameWorkflowModal: React.FC<NameWorkflowModalProps> = ({ open, onSubmit, onClose }) => {
  const [workflowName, setWorkflowName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (workflowName.trim()) {
      onSubmit(workflowName.trim());
      setWorkflowName("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Name your new workflow</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Input
            autoFocus
            placeholder="Enter workflow name"
            value={workflowName}
            onChange={e => setWorkflowName(e.target.value)}
            className="mb-4"
            required
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!workflowName.trim()} className="ml-2">
              Create Workflow
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
