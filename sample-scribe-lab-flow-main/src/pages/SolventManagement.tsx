import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const INSTRUMENTS = ["LC-1", "LC-2", "LC-3"];

// 10 unique default solvents
const LOCATIONS = ["LC-1", "LC-2", "LC-3", "Storage", "Fridge", "Warehouse"];

// More standard solvents, some with barcodes and new locations
const STANDARD_SOLVENTS = [
  { id: 1, name: "Water", volume: "1000", location: "LC-1", barcode: "SOLV-H2O-001" },
  { id: 2, name: "Methanol", volume: "900", location: "LC-2", barcode: "SOLV-MET-002" },
  { id: 3, name: "Acetonitrile", volume: "850", location: "LC-3", barcode: "SOLV-ACN-003" },
  { id: 4, name: "Isopropanol", volume: "750", location: "Storage", barcode: "SOLV-IPA-004" },
  { id: 5, name: "Hexane", volume: "500", location: "Fridge", barcode: "SOLV-HEX-005" },
  { id: 6, name: "Dichloromethane", volume: "300", location: "Warehouse", barcode: "SOLV-DCM-006" },
  { id: 7, name: "Formic Acid", volume: "250", location: "Storage", barcode: "SOLV-FA-007" },
  { id: 8, name: "Tetrahydrofuran", volume: "200", location: "Fridge", barcode: "SOLV-THF-008" },
  { id: 9, name: "Diethyl Ether", volume: "100", location: "Warehouse" },
  { id: 10, name: "Buffer B", volume: "950", location: "LC-1", barcode: "SOLV-BUF-B-010" }
];

interface Solvent {
  id: number;
  name: string;
  volume: string;
  location: string;
  barcode?: string;
}

const STORAGE_KEY = "solvent-db";
const SolventManagement: React.FC = () => {
  const [solvents, setSolvents] = useState<Solvent[]>([]);
  const [name, setName] = useState("");
  const [volume, setVolume] = useState("");
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [barcode, setBarcode] = useState("");

  useEffect(() => {
    // Load from localStorage, populate with standards if empty
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setSolvents(parsed);
      } else {
        setSolvents(STANDARD_SOLVENTS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(STANDARD_SOLVENTS));
      }
    } else {
      setSolvents(STANDARD_SOLVENTS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(STANDARD_SOLVENTS));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(solvents));
  }, [solvents]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !volume.trim() || !location.trim()) return;
    const newSolvent: Solvent = {
      id: Date.now(), name, volume, location, ...(barcode.trim() ? { barcode } : {})
    };
    setSolvents([newSolvent, ...solvents]);
    setName("");
    setVolume("");
    setLocation(LOCATIONS[0]);
    setBarcode("");
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Solvent Management</h1>
      <form onSubmit={handleAdd} className="mb-6 flex flex-col md:flex-row items-end gap-4">
        <div className="flex-1">
          <Label htmlFor="solvent-name">Solvent Name</Label>
          <Input
            id="solvent-name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Methanol"
            className="mt-1"
            required
          />
        </div>
        <div className="flex-1">
          <Label htmlFor="solvent-volume">Volume (mL)</Label>
          <Input
            id="solvent-volume"
            type="number"
            min={0}
            value={volume}
            onChange={e => setVolume(e.target.value)}
            placeholder="e.g. 500"
            className="mt-1"
            required
          />
        </div>
        <div className="flex-1">
          <Label htmlFor="solvent-location">Location</Label>
          <select
            id="solvent-location"
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
          <Label htmlFor="solvent-barcode">Barcode (optional)</Label>
          <Input
            id="solvent-barcode"
            value={barcode}
            onChange={e => setBarcode(e.target.value)}
            placeholder="e.g. SOLV-HEX-001"
            className="mt-1"
          />
        </div>
        <Button type="submit" className="h-10">Add Solvent</Button>
      </form>
      <div className="bg-card rounded-lg border shadow-md p-4">
        <h2 className="text-xl font-semibold mb-2">Session Solvents</h2>
        {solvents.length === 0 ? (
          <p className="text-muted-foreground italic">No solvents added yet.</p>
        ) : (
          <table className="min-w-full border-separate border-spacing-y-1">
            <thead>
              <tr>
                <th className="text-left px-2 py-1">Name</th>
                <th className="text-left px-2 py-1">Volume (mL)</th>
                <th className="text-left px-2 py-1">Location</th>
                <th className="text-left px-2 py-1">Barcode</th>
              </tr>
            </thead>
            <tbody>
              {solvents.map(solvent => (
                <tr key={solvent.id} className="bg-secondary rounded">
                  <td className="px-2 py-1">{solvent.name}</td>
                  <td className="px-2 py-1">{solvent.volume}</td>
                  <td className="px-2 py-1">{solvent.location}</td>
                  <td className="px-2 py-1">{solvent.barcode ?? <span className="text-gray-400 italic">–</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default SolventManagement;
