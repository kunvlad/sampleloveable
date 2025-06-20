import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const LOCATIONS = ["LC-1", "LC-2", "LC-3", "Storage", "Fridge", "Warehouse"];

// 10 unique default columns
const STANDARD_COLUMNS = [
  { id: 1, name: "C18", type: "Reversed-phase", location: "LC-1", barcode: "COL-001" },
  { id: 2, name: "C8", type: "Reversed-phase", location: "LC-2", barcode: "COL-002" },
  { id: 3, name: "Phenyl", type: "Aromatic", location: "LC-3", barcode: "COL-003" },
  { id: 4, name: "Silica", type: "Normal-phase", location: "Storage", barcode: "COL-004" },
  { id: 5, name: "Amide", type: "HILIC", location: "Fridge", barcode: "COL-005" },
  { id: 6, name: "Cyano", type: "Normal-phase", location: "Warehouse", barcode: "COL-006" },
  { id: 7, name: "PFP", type: "Fluorinated", location: "Storage", barcode: "COL-007" },
  { id: 8, name: "Ion Exchange", type: "Ion-exchange", location: "LC-2", barcode: "COL-008" },
  { id: 9, name: "Size Exclusion", type: "GFC", location: "LC-3", barcode: "COL-009" },
  { id: 10, name: "Mixed-Mode", type: "Mixed-mode", location: "Fridge", barcode: "COL-010" }
];

interface Column {
  id: number;
  name: string;
  type: string;
  location: string;
  barcode?: string;
}

const STORAGE_KEY = "column-db";
const ColumnManagement: React.FC = () => {
  const [columns, setColumns] = useState<Column[]>([]);
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [barcode, setBarcode] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setColumns(parsed);
      } else {
        setColumns(STANDARD_COLUMNS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(STANDARD_COLUMNS));
      }
    } else {
      setColumns(STANDARD_COLUMNS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(STANDARD_COLUMNS));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(columns));
  }, [columns]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !type.trim() || !location.trim()) return;
    const newColumn: Column = {
      id: Date.now(), name, type, location, ...(barcode.trim() ? { barcode } : {})
    };
    setColumns([newColumn, ...columns]);
    setName("");
    setType("");
    setLocation(LOCATIONS[0]);
    setBarcode("");
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Column Management</h1>
      <form onSubmit={handleAdd} className="mb-6 flex flex-col md:flex-row items-end gap-4">
        <div className="flex-1">
          <Label htmlFor="column-name">Column Name</Label>
          <Input
            id="column-name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. C18"
            className="mt-1"
            required
          />
        </div>
        <div className="flex-1">
          <Label htmlFor="column-type">Column Type</Label>
          <Input
            id="column-type"
            value={type}
            onChange={e => setType(e.target.value)}
            placeholder="e.g. Reversed-phase"
            className="mt-1"
            required
          />
        </div>
        <div className="flex-1">
          <Label htmlFor="column-location">Location</Label>
          <select
            id="column-location"
            value={location}
            onChange={e => setLocation(e.target.value)}
            className="mt-1 border rounded w-full px-2 py-1"
            required
          >
            {LOCATIONS.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <Label htmlFor="column-barcode">Barcode (optional)</Label>
          <Input
            id="column-barcode"
            value={barcode}
            onChange={e => setBarcode(e.target.value)}
            placeholder="e.g. COL-00071"
            className="mt-1"
          />
        </div>
        <Button type="submit" className="h-10">Add Column</Button>
      </form>
      <div className="bg-card rounded-lg border shadow-md p-4">
        <h2 className="text-xl font-semibold mb-2">Session Columns</h2>
        {columns.length === 0 ? (
          <p className="text-muted-foreground italic">No columns added yet.</p>
        ) : (
          <table className="min-w-full border-separate border-spacing-y-1">
            <thead>
              <tr>
                <th className="text-left px-2 py-1">Name</th>
                <th className="text-left px-2 py-1">Type</th>
                <th className="text-left px-2 py-1">Location</th>
                <th className="text-left px-2 py-1">Barcode</th>
              </tr>
            </thead>
            <tbody>
              {columns.map(col => (
                <tr key={col.id} className="bg-secondary rounded">
                  <td className="px-2 py-1">{col.name}</td>
                  <td className="px-2 py-1">{col.type}</td>
                  <td className="px-2 py-1">{col.location}</td>
                  <td className="px-2 py-1">{col.barcode ?? <span className="text-gray-400 italic">–</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ColumnManagement;
