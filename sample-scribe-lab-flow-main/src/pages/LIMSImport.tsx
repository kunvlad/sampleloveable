
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

// Fake LIMS sample data
const FAKE_LIMS_SAMPLES = [
  {
    id: "lims-1",
    barcode: "LIMS101",
    name: "LIMS Sample 1",
    sampleType: "control",
    volume: 600,
    concentration: 7.0,
    createdAt: new Date().toISOString(),
  },
  {
    id: "lims-2",
    barcode: "LIMS102",
    name: "LIMS Sample 2",
    sampleType: "calibration",
    volume: 300,
    concentration: 4.3,
    createdAt: new Date().toISOString(),
  },
  {
    id: "lims-3",
    barcode: "LIMS103",
    name: "LIMS Sample 3",
    sampleType: "system-suitability",
    volume: 400,
    concentration: 2.5,
    createdAt: new Date().toISOString(),
  }
];

const LIMSImport = () => {
  const [selected, setSelected] = useState<{ [id: string]: boolean }>({});
  const navigate = useNavigate();

  const handleImport = () => {
    const selectedSamples = FAKE_LIMS_SAMPLES.filter(s => selected[s.id]);
    localStorage.setItem(
      "lims-imported-samples",
      JSON.stringify(selectedSamples)
    );
    window.close(); // closes tab, user should go back to Sample Tracker to see imported samples
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader>
          <CardTitle>Import from LIMS</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <p className="text-gray-600 text-sm mb-2">
              Select samples to import to your tracker:
            </p>
            <ul className="space-y-4">
              {FAKE_LIMS_SAMPLES.map(sample => (
                <li key={sample.id} className="flex items-center gap-3 border p-3 rounded">
                  <input
                    type="checkbox"
                    checked={!!selected[sample.id]}
                    onChange={() =>
                      setSelected(sel => ({
                        ...sel,
                        [sample.id]: !sel[sample.id],
                      }))
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
              className="mt-5 w-full"
              onClick={handleImport}
              disabled={Object.values(selected).every(val => !val)}
            >
              Import Selected Samples
            </Button>
            <div className="text-xs mt-4 text-gray-400">
              After import this window will close automatically. Go back to the main Sample Tracker to see imported samples appear.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LIMSImport;
