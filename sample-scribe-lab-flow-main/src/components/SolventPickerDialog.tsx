
import React, { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Choose solvents from localStorage solvent-db
function getSolvents() {
  const saved = localStorage.getItem("solvent-db");
  if (!saved) return [];
  try { return JSON.parse(saved); } catch { return []; }
}

type Solvent = {
  id: number;
  name: string;
  volume: string;
  location: string;
  barcode?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (solvent: Solvent) => void;
};

export function SolventPickerDialog({ open, onClose, onSelect }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const solvents = getSolvents();

  return (
    <Dialog open={open} onOpenChange={open => !open ? onClose() : undefined}>
      <DialogContent className="max-w-xs">
        <DialogTitle>Select a Solvent</DialogTitle>
        <DialogDescription>Pick a solvent to create a blank sample.</DialogDescription>
        <div className="mb-2">
          <select
            value={selected ?? ""}
            onChange={e => setSelected(Number(e.target.value))}
            className="w-full border rounded py-1 px-2"
          >
            <option value="">-- Choose --</option>
            {solvents.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.volume} mL, {s.location}){s.barcode ? ` [${s.barcode}]` : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            onClick={() => {
              if (selected != null) {
                const solvent = solvents.find(s => s.id === selected);
                if (solvent) onSelect(solvent);
                onClose();
              }
            }}
            disabled={selected == null}
          >
            Select
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
