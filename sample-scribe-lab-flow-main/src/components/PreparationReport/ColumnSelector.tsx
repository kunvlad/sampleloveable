
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { Scan } from "lucide-react";

const LOCATIONS = ["LC-1", "LC-2", "LC-3", "Storage", "Fridge", "Warehouse"];

type Column = {
  id: number;
  name: string;
  type: string;
  location: string;
  barcode?: string;
};

type Props = {
  onApply: (column: Column, location: string) => void;
};

const getColumns = (): Column[] => {
  const saved = localStorage.getItem("column-db");
  if (!saved) return [];
  return JSON.parse(saved);
};

export const ColumnSelector: React.FC<Props> = ({ onApply }) => {
  const [show, setShow] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [barcodeDialog, setBarcodeDialog] = useState(false);

  const columns = getColumns();

  // Barcode scan handler for columns
  const handleBarcodeScan = (barcode: string) => {
    setBarcodeDialog(false);
    const match = columns.find(c =>
      c.barcode?.toLowerCase() === barcode.toLowerCase() ||
      c.name?.toLowerCase() === barcode.toLowerCase()
    );
    if (match) setSelected(match.id);
  };

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setShow(true)}>
        Use Column from Database
      </Button>
      <Dialog open={show} onOpenChange={(o) => setShow(o)}>
        <DialogContent className="w-96">
          <DialogTitle>Use Column from Database</DialogTitle>
          <DialogDescription>Select and apply a column from your column database.</DialogDescription>
          <div className="mb-2 flex items-center justify-between">
            <b>Select Column:</b>
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
            onChange={e => setSelected(Number(e.target.value))}
          >
            <option value="">-- Choose --</option>
            {columns.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.type}, {c.location}){c.barcode ? ` [${c.barcode}]` : ""}
              </option>
            ))}
          </select>
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
                const column = columns.find(c => c.id === selected);
                if (column) {
                  onApply(column, location);
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
