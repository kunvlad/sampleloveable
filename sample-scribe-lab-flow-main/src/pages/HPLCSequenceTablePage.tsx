
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { HPLCSequenceTable } from '@/components/HPLCSequenceTable';
import { Sample } from '@/types/sample';

// Helper to get assigned sequence from localStorage (list of sample IDs in order)
function getAssignedSequence(): string[] {
  const saved = localStorage.getItem('lab-hplc-sequence');
  return saved ? JSON.parse(saved) : [];
}

const HPLCSequenceTablePage: React.FC = () => {
  // Load samples from localStorage, same as Index.tsx
  const [samples, setSamples] = React.useState<Sample[]>(() => {
    const saved = localStorage.getItem('lab-samples');
    if (saved) {
      return JSON.parse(saved).map((s: any) => ({ ...s, createdAt: new Date(s.createdAt) }));
    }
    return [];
  });

  // Use the last assigned sequence for initial state
  const [selectedSamples, setSelectedSamples] = React.useState<string[]>(getAssignedSequence);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link to="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tracker
            </Button>
          </Link>
        </div>
        {/* Renamed for clarity */}
        {/* COMMENT: No direct page title here, all title is inside HPLCSequenceTable now */}
        <HPLCSequenceTable samples={samples} selectedSamples={selectedSamples} />
      </div>
    </div>
  );
};
export default HPLCSequenceTablePage;
