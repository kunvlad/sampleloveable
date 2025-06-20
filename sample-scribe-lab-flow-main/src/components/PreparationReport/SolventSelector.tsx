
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { Scan } from "lucide-react";

const LOCATIONS = ["LC-1", "LC-2", "LC-3", "Storage", "Fridge", "Warehouse"];

type Solvent = {
  id: number;
  name: string;
  volume: string;
  location: string;
  barcode?: string;
};

type Props = {
  onApply: (solvent: Solvent, lcChannel: string, location: string) => void;
};

const getSolvents = (): Solvent[] => {
  const saved = localStorage.getItem("solvent-db");
  if (!saved) return [];
  return JSON.parse(saved);
};

export const SolventSelector: React.FC<Props> = ({ onApply }) => {
  const [show, setShow] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [channel, setChannel] = useState("A");
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [barcodeDialog, setBarcodeDialog] = useState(false);

  const solvents = getSolvents();

  // Barcode scan callback now checks name AND barcode
  const handleBarcodeScan = (barcode: string) => {
    setBarcodeDialog(false);
    const match = solvents.find(s =>
      s.barcode?.toLowerCase() === barcode.toLowerCase() ||
      s.name?.toLowerCase() === barcode.toLowerCase()
    );
    if (match) setSelected(match.id);
  };

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setShow(true)}>
        Use Solvent from Database
      </Button>
      <Dialog open={show} onOpenChange={setShow}>
        <DialogContent className="w-96">
          <DialogTitle>Use Solvent from Database</DialogTitle>
          <DialogDescription>Select and apply a solvent from your solvent database.</DialogDescription>
          <div className="mb-2 flex items-center justify-between">
            <b>Select Solvent:</b>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => setBarcodeDialog(true)}
              title="Scan barcode to select"
            >
              <Scan className="w-5 h-5 text-blue-600" />
            </Button>
          </div>
          <select
            className="border rounded px-2 py-1 w-full mt-1 mb-2"
            value={selected ?? ""}
            onChange={(e) => setSelected(Number(e.target.value))}
          >
            <option value="">-- Choose --</option>
            {solvents.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.volume} mL, {s.location}){s.barcode ? ` [${s.barcode}]` : ""}
              </option>
            ))}
          </select>
          <div className="mb-2">
            <b>Assign to LC Channel:</b>
            <select
              className="border rounded px-2 py-1 w-full mt-1"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
            >
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
          </div>
          <div className="mb-2">
            <b>Location:</b>
            <select
              className="border rounded px-2 py-1 w-full mt-1"
              value={location}
              onChange={e => setLocation(e.target.value)}
            >
              {LOCATIONS.map(i => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <Button size="sm" variant="outline" onClick={() => setShow(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (!selected) return;
                const solvent = solvents.find((s) => s.id === selected);
                if (solvent) {
                  onApply(solvent, channel, location);
                  setShow(false);
                }
              }}
              disabled={selected == null}
            >
              Apply
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <BarcodeScanner
        isOpen={barcodeDialog}
        onClose={() => setBarcodeDialog(false)}
        onScan={handleBarcodeScan}
      />
    </>
  );
};
