import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sample } from '@/types/sample';
import { useToast } from '@/hooks/use-toast';

type MergeMode = 'volume' | 'volume-ratio' | 'concentration-ratio';

interface MergeDialogProps {
  samplesToMerge: Sample[];
  onMergeSamples: (sampleIds: string[], newBarcode: string, sampleType: Sample['sampleType'], partialMerge: boolean, sampleVolumes?: { [sampleId: string]: number }, customName?: string) => void;
  children: React.ReactNode;
}

export const MergeDialog: React.FC<MergeDialogProps> = ({ samplesToMerge, onMergeSamples, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newBarcode, setNewBarcode] = useState('');
  const [customName, setCustomName] = useState('');
  const [sampleType, setSampleType] = useState<Sample['sampleType']>('sample');
  const [partialMerge, setPartialMerge] = useState(true);
  const [sampleVolumes, setSampleVolumes] = useState<{ [sampleId: string]: number }>({});
  const [mergeMode, setMergeMode] = useState<MergeMode>('volume');
  const [volumeRatios, setVolumeRatios] = useState<{ [sampleId: string]: number }>({});
  const [concentrationRatios, setConcentrationRatios] = useState<{ [sampleId: string]: number }>({});
  const { toast } = useToast();

  // Enhanced compound key logic: supports multiple single-concentration samples as unique independent compounds.
  const compoundKeys = React.useMemo(() => {
    const cmpds = new Set<string>();

    let hasConcentrationsObj = false;
    let hasSingleConcentration = false;

    samplesToMerge.forEach((sample) => {
      if (sample.concentrations && Object.keys(sample.concentrations).length > 0) {
        hasConcentrationsObj = true;
        Object.keys(sample.concentrations).forEach((k) => cmpds.add(k));
      } else if (typeof sample.concentration === 'number') {
        hasSingleConcentration = true;
      }
    });

    // All samples have only .concentration: treat as multiple independent compounds
    if (!hasConcentrationsObj && hasSingleConcentration) {
      return samplesToMerge.map((_, idx) => `Compound ${idx + 1}`);
    }

    // Otherwise: compounds from concentrations key, or fallback
    if (cmpds.size === 0) return ['Compound1', 'Compound2'];
    return Array.from(cmpds);
  }, [samplesToMerge]);

  // Mapping from compoundKey to sample index (for the multiple single-concentration scenario)
  const compoundSampleMap = React.useMemo(() => {
    if (
      samplesToMerge.length > 1 &&
      samplesToMerge.every(
        (s) => !s.concentrations || Object.keys(s.concentrations).length === 0
      )
    ) {
      // Map 'Compound N' to sample index N-1
      const mapping: { [cmpd: string]: number } = {};
      samplesToMerge.forEach((_, idx) => {
        mapping[`Compound ${idx + 1}`] = idx;
      });
      return mapping;
    }
    return {};
  }, [samplesToMerge]);

  useEffect(() => {
    if (isOpen) {
      setNewBarcode(`MERGED-${Date.now()}`);
      setCustomName(`Merged from ${samplesToMerge.length} samples`);
      const initialVolumes = samplesToMerge.reduce((acc, sample) => {
        acc[sample.id] = sample.volume;
        return acc;
      }, {} as { [sampleId: string]: number });
      setSampleVolumes(initialVolumes);

      const initialRatios = samplesToMerge.reduce((acc, sample) => {
        acc[sample.id] = 1;
        return acc;
      }, {} as { [sampleId: string]: number });
      setVolumeRatios(initialRatios);
      setConcentrationRatios(initialRatios);
    }
  }, [isOpen, samplesToMerge]);

  const mergedTotalVolume = (() => {
    if (mergeMode === 'volume') {
      return Object.values(sampleVolumes).reduce((acc, v) => acc + (v || 0), 0);
    } else if (mergeMode === 'volume-ratio') {
      return 100;
    } else if (mergeMode === 'concentration-ratio') {
      return 100;
    }
    return 0;
  })();

  // Enhanced: handle all cases for preview
  const calculateMergedConcentrations = (): { [compound: string]: number } => {
    let sums: { [compound: string]: number } = {};
    let totalVolume: number | { [compound: string]: number } = 0;

    if (
      Object.keys(compoundSampleMap).length > 0
    ) {
      // Case: multiple single-concentration samples, each is an independent compound
      const result: { [compound: string]: number } = {};
      Object.entries(compoundSampleMap).forEach(([cmpd, idx]) => {
        const sample = samplesToMerge[idx];
        let vol = 0;
        if (mergeMode === 'volume') {
          vol = sampleVolumes[sample.id] || 0;
        } else if (mergeMode === 'volume-ratio') {
          const totalRatio = Object.values(volumeRatios).reduce((acc, v) => acc + (v || 0), 0) || 1;
          const ratio = volumeRatios[sample.id] || 0;
          vol = (ratio / totalRatio) * 100;
        } else if (mergeMode === 'concentration-ratio') {
          const totalRatio = Object.values(concentrationRatios).reduce((acc, v) => acc + (v || 0), 0) || 1;
          const ratio = concentrationRatios[sample.id] || 0;
          vol = (ratio / totalRatio) * 100;
        }
        const c = typeof sample.concentration === 'number' ? sample.concentration : 0;
        result[cmpd] = vol > 0 ? c : 0;
      });
      return result;
    }

    // Keep legacy: mixture, weighted average per-compound
    if (mergeMode === 'volume') {
      samplesToMerge.forEach((sample) => {
        const vol = sampleVolumes[sample.id] || 0;
        totalVolume = +totalVolume + vol;
        for (const cmpd of compoundKeys) {
          let c = 0;
          if (sample.concentrations && sample.concentrations[cmpd] !== undefined) {
            c = sample.concentrations[cmpd] || 0;
          } else if (
            (cmpd === 'Compound' || cmpd === 'Compound1') &&
            typeof sample.concentration === 'number'
          ) {
            c = sample.concentration;
          }
          sums[cmpd] = (sums[cmpd] || 0) + c * vol;
        }
      });
    } else if (mergeMode === 'volume-ratio') {
      const totalRatio = Object.values(volumeRatios).reduce((acc, v) => acc + (v || 0), 0) || 1;
      samplesToMerge.forEach((sample) => {
        const ratio = volumeRatios[sample.id] || 0;
        const vol = (ratio / totalRatio) * 100;
        totalVolume = +totalVolume + vol;
        for (const cmpd of compoundKeys) {
          let c = 0;
          if (sample.concentrations && sample.concentrations[cmpd] !== undefined) {
            c = sample.concentrations[cmpd] || 0;
          } else if (
            (cmpd === 'Compound' || cmpd === 'Compound1') &&
            typeof sample.concentration === 'number'
          ) {
            c = sample.concentration;
          }
          sums[cmpd] = (sums[cmpd] || 0) + c * vol;
        }
      });
    } else if (mergeMode === 'concentration-ratio') {
      const totalRatio = Object.values(concentrationRatios).reduce((acc, v) => acc + (v || 0), 0) || 1;
      samplesToMerge.forEach((sample) => {
        const ratio = concentrationRatios[sample.id] || 0;
        const vol = (ratio / totalRatio) * 100;
        totalVolume = +totalVolume + vol;
        for (const cmpd of compoundKeys) {
          let c = 0;
          if (sample.concentrations && sample.concentrations[cmpd] !== undefined) {
            c = sample.concentrations[cmpd] || 0;
          } else if (
            (cmpd === 'Compound' || cmpd === 'Compound1') &&
            typeof sample.concentration === 'number'
          ) {
            c = sample.concentration;
          }
          sums[cmpd] = (sums[cmpd] || 0) + c * vol;
        }
      });
    }

    const concentrations: { [compound: string]: number } = {};
    for (const cmpd of compoundKeys) {
      concentrations[cmpd] = +totalVolume ? sums[cmpd] / (+totalVolume) : 0;
    }
    return concentrations;
  };

  const mergedConcentrations = calculateMergedConcentrations();

  const handleMerge = () => {
    if (!newBarcode.trim() || !customName.trim()) {
      toast({ title: 'Error', description: 'Barcode and name are required.', variant: 'destructive' });
      return;
    }

    if (mergeMode === 'volume') {
      if (partialMerge) {
        for (const sample of samplesToMerge) {
          if ((sampleVolumes[sample.id] || 0) > sample.volume) {
            toast({ title: 'Error', description: `Volume for ${sample.barcode} exceeds available volume.`, variant: 'destructive' });
            return;
          }
        }
      }
      onMergeSamples(samplesToMerge.map(s => s.id), newBarcode, sampleType, partialMerge, sampleVolumes, customName);
    } else if (mergeMode === 'volume-ratio') {
      onMergeSamples(samplesToMerge.map(s => s.id), newBarcode, sampleType, partialMerge, volumeRatios, customName);
    } else if (mergeMode === 'concentration-ratio') {
      onMergeSamples(samplesToMerge.map(s => s.id), newBarcode, sampleType, partialMerge, concentrationRatios, customName);
    }
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Merge Samples</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <p>Merging {samplesToMerge.length} samples:</p>
          <ul className="list-disc list-inside text-sm text-gray-600">
            {samplesToMerge.map(s => (
              <li key={s.id}>{s.name} ({s.barcode})</li>
            ))}
          </ul>
          <div className="flex items-center gap-2 mb-2">
            <Label className="font-medium text-right w-36">Merge Method</Label>
            <select
              className="border rounded px-2 py-1"
              value={mergeMode}
              onChange={e => setMergeMode(e.target.value as MergeMode)}
            >
              <option value="volume">By Volume (μL)</option>
              <option value="volume-ratio">By Volume Ratio</option>
              <option value="concentration-ratio">By Conc. Ratio</option>
            </select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="barcode" className="text-right">New Barcode</Label>
            <Input id="barcode" value={newBarcode} onChange={(e) => setNewBarcode(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">New Name</Label>
            <Input id="name" value={customName} onChange={(e) => setCustomName(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">Sample Type</Label>
            <Select onValueChange={(v) => setSampleType(v as Sample['sampleType'])} defaultValue={sampleType}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a sample type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sample">Sample</SelectItem>
                <SelectItem value="control">Control</SelectItem>
                <SelectItem value="blank">Blank</SelectItem>
                <SelectItem value="calibration">Calibration</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
                <SelectItem value="system-suitability">System Suitability</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {mergeMode === 'volume' && (
            <div className="flex items-center space-x-2 mt-4">
              <input type="checkbox" id="partial" checked={partialMerge} onChange={(e) => setPartialMerge(e.target.checked)} />
              <Label htmlFor="partial">Partial Merge (specify volumes)</Label>
            </div>
          )}
          {mergeMode === 'volume' && partialMerge && (
            <div className="space-y-2 mt-2">
              <p className="text-sm font-medium">Volumes to merge (µL):</p>
              {samplesToMerge.map(sample => (
                <div key={sample.id} className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor={`vol-${sample.id}`} className="text-right text-sm">{sample.barcode}</Label>
                  <Input
                    id={`vol-${sample.id}`}
                    type="number"
                    value={sampleVolumes[sample.id] || ''}
                    onChange={(e) => setSampleVolumes(prev => ({ ...prev, [sample.id]: parseFloat(e.target.value) || 0 }))}
                    className="col-span-2"
                  />
                  <span className="text-xs text-gray-500">of {sample.volume} µL</span>
                </div>
              ))}
            </div>
          )}
          {mergeMode === 'volume-ratio' && (
            <div className="space-y-2 mt-2">
              <p className="text-sm font-medium">Set volume ratios:</p>
              {samplesToMerge.map(sample => (
                <div key={sample.id} className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor={`vol-ratio-${sample.id}`} className="text-right text-sm">{sample.barcode}</Label>
                  <Input
                    id={`vol-ratio-${sample.id}`}
                    type="number"
                    value={volumeRatios[sample.id] || ''}
                    onChange={(e) => setVolumeRatios(prev => ({ ...prev, [sample.id]: parseFloat(e.target.value) || 0 }))}
                    className="col-span-2"
                  />
                  <span className="text-xs text-gray-500">relative</span>
                </div>
              ))}
            </div>
          )}
          {mergeMode === 'concentration-ratio' && (
            <div className="space-y-2 mt-2">
              <p className="text-sm font-medium">Set concentration ratios:</p>
              {samplesToMerge.map(sample => (
                <div key={sample.id} className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor={`conc-ratio-${sample.id}`} className="text-right text-sm">{sample.barcode}</Label>
                  <Input
                    id={`conc-ratio-${sample.id}`}
                    type="number"
                    value={concentrationRatios[sample.id] || ''}
                    onChange={(e) => setConcentrationRatios(prev => ({ ...prev, [sample.id]: parseFloat(e.target.value) || 0 }))}
                    className="col-span-2"
                  />
                  <span className="text-xs text-gray-500">relative</span>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4">
            <p className="font-medium text-sm mb-1">Target Concentration after Merge (mg/mL):</p>
            <ul className="list-disc pl-5 text-sm">
              {compoundKeys.map(cmpd => (
                <li key={cmpd}>
                  {cmpd}: <span className="font-mono">{mergedConcentrations[cmpd]?.toFixed(3)}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-gray-500 mt-1">Estimates based on proportions, two compounds supported independently.</p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleMerge}>Merge</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
