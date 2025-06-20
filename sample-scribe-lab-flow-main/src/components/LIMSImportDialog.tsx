
import React, { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const FAKE_LIMS_SAMPLES = [
  {
    id: "lims-1",
    barcode: "LIMS101",
    name: "LIMS Sample 1",
    sampleType: "control",
    volume: 600,
    concentration: 7.0,
  },
  {
    id: "lims-2",
    barcode: "LIMS102",
    name: "LIMS Sample 2",
    sampleType: "calibration",
    volume: 300,
    concentration: 4.3,
  },
  {
    id: "lims-3",
    barcode: "LIMS103",
    name: "LIMS Sample 3",
    sampleType: "system-suitability",
    volume: 400,
    concentration: 2.5,
  }
];

type LIMSImportDialogProps = {
  open: boolean;
  onClose: () => void;
  onImport: (samples: any[]) => void;
};

export const LIMSImportDialog: React.FC<LIMSImportDialogProps> = ({ open, onClose, onImport }) => {
  const [selected, setSelected] = useState<{ [id: string]: boolean }>({});

  const handleImport = () => {
    const selectedSamples = FAKE_LIMS_SAMPLES.filter(s => selected[s.id]);
    onImport(selectedSamples);
    setSelected({});
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v ? onClose() : undefined}>
      <DialogContent className="w-full max-w-lg">
        <DialogTitle>Import from LIMS</DialogTitle>
        <DialogDescription>
          Select samples to import to your tracker.
        </DialogDescription>
        <ul className="space-y-4 my-3">
          {FAKE_LIMS_SAMPLES.map(sample => (
            <li key={sample.id} className="flex items-center gap-3 border p-3 rounded">
              <input
                type="checkbox"
                checked={!!selected[sample.id]}
                onChange={() =>
                  setSelected(sel => ({ ...sel, [sample.id]: !sel[sample.id] }))
                }
              />
              <div>
                <span className="font-semibold">{sample.name}</span>
                <div className="text-xs text-gray-400">
                  Barcode: {sample.barcode} — {sample.sampleType}
                </div>
                <div className="text-xs">
                  Volume: {sample.volume}μL | Conc: {sample.concentration} mg/mL
                </div>
              </div>
            </li>
          ))}
        </ul>
        <Button
          className="mt-2 w-full"
          onClick={handleImport}
          disabled={Object.values(selected).every(val => !val)}
        >
          Import Selected Samples
        </Button>
      </DialogContent>
    </Dialog>
  );
};
