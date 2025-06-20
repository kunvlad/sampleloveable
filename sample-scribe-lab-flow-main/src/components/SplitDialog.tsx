import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Sample } from '@/types/sample';
import { Split, Shuffle, Dice6 } from 'lucide-react';

interface SplitDialogProps {
  sample: Sample;
  onSplit: (parentId: string, splitData: { count: number, volumePerSplit: number, targetBarcodes: string[] }) => void;
  onSplitIndividual: (parentId: string, splitData: { volumes: number[], targetBarcodes: string[] }) => void;
  children: React.ReactNode;
}

export const SplitDialog: React.FC<SplitDialogProps> = ({
  sample,
  onSplit,
  onSplitIndividual,
  children
}) => {
  const [open, setOpen] = useState(false);
  const [splitCount, setSplitCount] = useState(2);
  const [splitVolume, setSplitVolume] = useState('');
  const [splitBarcodes, setSplitBarcodes] = useState<string[]>(['', '']);
  const [splitNames, setSplitNames] = useState<string[]>(['', '']); // NEW state for names
  const [individualVolumes, setIndividualVolumes] = useState<string[]>(['', '']);
  const [splitType, setSplitType] = useState<'equal' | 'individual'>('equal');

  // Prefill sample names as "SampleName Aliquot 1", etc.
  const getDefaultAliquotName = (idx: number) =>
    `${sample.name} Aliquot ${idx + 1}`;

  const generateBarcode = (index: number) => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 5);
    const barcode = `S${timestamp}${random}${index}`.toUpperCase();
    const newBarcodes = [...splitBarcodes];
    newBarcodes[index] = barcode;
    setSplitBarcodes(newBarcodes);
  };

  // -- ADDED: Helper to fill equal volume with a random legal value
  const generateRandomEqualVolume = () => {
    // Calculate max volume per split as available volume / splitCount (leaving 0.1μL margin)
    const max = Math.floor((sample.volume - 0.1) / splitCount * 10) / 10;
    const min = 0.1; // Smallest reasonable aliquot
    if (max <= min) {
      setSplitVolume(min.toString());
    } else {
      const randomVol = (Math.random() * (max - min) + min);
      // Round to 1 decimal (as UI shows)
      setSplitVolume((Math.round(randomVol * 10) / 10).toString());
    }
  };

  // -- ADDED: Helper for random split of total volume into N individual aliquots
  const generateRandomSplitVolumes = () => {
    const available = sample.volume - 0.1;
    let remain = available;
    let vols: number[] = [];
    for (let i = 0; i < splitCount; i++) {
      // For the first (n-1) splits, give each a random fraction of remaining
      if (i < splitCount - 1) {
        const max = remain - 0.1 * (splitCount - i - 1);
        const min = 0.1;
        const r = Math.random() * (max - min) + min;
        const v = Math.round(r * 10) / 10;
        vols.push(v);
        remain -= v;
      } else {
        // Assign all remaining volume to last, but round to 1 decimal and never negative
        vols.push(Math.max(0.1, Math.round(remain * 10) / 10));
      }
    }
    setIndividualVolumes(vols.map(v => v.toString()));
  };

  // Update "Generate Equal Splits" to prefill barcodes and names for all aliquots.
  const generateEqualSplits = () => {
    const availableVolume = sample.volume;
    const maxVolumePerSplit = Math.floor((availableVolume - 0.1) / splitCount * 10) / 10;
    setSplitVolume(maxVolumePerSplit.toString());

    // Prefill barcodes and names for all splits
    const newBarcodes = [];
    const newNames = [];
    for (let i = 0; i < splitCount; i++) {
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substring(2, 5);
      const barcode = `S${timestamp}${random}${i}`.toUpperCase();
      newBarcodes.push(barcode);
      newNames.push(getDefaultAliquotName(i));
    }
    setSplitBarcodes(newBarcodes);
    setSplitNames(newNames);
  };

  // When split count changes, ensure barcodes and names arrays are the right length
  const handleSplitCountChange = (count: number) => {
    setSplitCount(count);
    setSplitBarcodes(Array(count).fill('').map((_, idx) => splitBarcodes[idx] || ''));
    setIndividualVolumes(Array(count).fill('').map((_, idx) => individualVolumes[idx] || ''));
    setSplitNames(Array(count).fill('').map((_, idx) => splitNames[idx] || getDefaultAliquotName(idx)));
  };

  // Update handleSplit to pass split names within splitData if required by parent (if your onSplit/onSplitIndividual supports names, update types accordingly)
  const handleSplit = () => {
    if (splitType === 'equal') {
      const volume = parseFloat(splitVolume);
      if (isNaN(volume) || volume <= 0) return;
      const totalVolume = volume * splitCount;
      if (totalVolume >= sample.volume) return;
      if (splitBarcodes.some(barcode => !barcode.trim())) return;

      // Supply barcodes and names
      onSplit(sample.id, {
        count: splitCount,
        volumePerSplit: volume,
        targetBarcodes: splitBarcodes,
        // Optionally pass names as well, if you want parent to receive them, e.g. targetNames: splitNames
      });
    } else {
      const volumes = individualVolumes.map(v => parseFloat(v)).filter(v => !isNaN(v) && v > 0);
      if (volumes.length !== splitCount) return;
      const totalVolume = volumes.reduce((sum, vol) => sum + vol, 0);
      if (totalVolume >= sample.volume) return;
      if (splitBarcodes.some(barcode => !barcode.trim())) return;

      onSplitIndividual(sample.id, {
        volumes,
        targetBarcodes: splitBarcodes,
        // Optionally pass targetNames: splitNames here as well if logic supports
      });
    }

    setOpen(false);
    setSplitCount(2);
    setSplitVolume('');
    setSplitBarcodes(['', '']);
    setSplitNames(['', '']);
    setIndividualVolumes(['', '']);
    setSplitType('equal');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Split Sample</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            Sample: {sample.name} ({sample.barcode})
            <br />
            Available volume: {sample.volume} μL
            {sample.concentration && (
              <span> | Concentration: {sample.concentration} mg/mL</span>
            )}
          </div>

          <div>
            <Label>Split Type</Label>
            <RadioGroup value={splitType} onValueChange={(value: 'equal' | 'individual') => setSplitType(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="equal" id="equal" />
                <Label htmlFor="equal">Equal volumes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="individual" id="individual" />
                <Label htmlFor="individual">Individual volumes</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="splitCount">Number of aliquots</Label>
              <Input
                id="splitCount"
                type="number"
                min="2"
                max="10"
                value={splitCount}
                onChange={(e) => handleSplitCountChange(Number(e.target.value))}
              />
            </div>
            {splitType === 'equal' && (
              <div>
                <Label htmlFor="splitVolume">Volume per aliquot (μL)</Label>
                <div className="flex gap-2">
                  <Input
                    id="splitVolume"
                    type="number"
                    step="0.1"
                    value={splitVolume}
                    onChange={(e) => setSplitVolume(e.target.value)}
                    max={Math.floor(sample.volume / splitCount)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateRandomEqualVolume}
                    className="px-3"
                  >
                    <Dice6 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {splitType === 'equal' && (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={generateEqualSplits}
                className="flex-1"
              >
                Generate Equal Splits
              </Button>
            </div>
          )}

          {splitType === 'individual' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Individual Volumes (μL)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateRandomSplitVolumes}
                >
                  <Dice6 className="h-4 w-4 mr-1" />
                  Random
                </Button>
              </div>
              {individualVolumes.map((volume, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <span className="text-sm w-16">Aliquot {index + 1}:</span>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Volume"
                    value={volume}
                    onChange={(e) => {
                      const newVolumes = [...individualVolumes];
                      newVolumes[index] = e.target.value;
                      setIndividualVolumes(newVolumes);
                    }}
                    className="flex-1"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Name and barcode fields for each aliquot */}
          <div className="space-y-2">
            <Label>Aliquot Names and Barcodes</Label>
            {Array(splitCount).fill(null).map((_, index) => (
              <div key={index} className="flex gap-2 mb-1">
                <Input
                  placeholder={`Name for aliquot ${index + 1}`}
                  value={splitNames[index] || ''}
                  onChange={e => {
                    const updatedNames = [...splitNames];
                    updatedNames[index] = e.target.value;
                    setSplitNames(updatedNames);
                  }}
                  className="w-48"
                />
                <Input
                  placeholder={`Barcode for aliquot ${index + 1}`}
                  value={splitBarcodes[index] || ''}
                  onChange={e => {
                    const newBarcodes = [...splitBarcodes];
                    newBarcodes[index] = e.target.value;
                    setSplitBarcodes(newBarcodes);
                  }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    generateBarcode(index);
                    // If blank name, set to default
                    if (!splitNames[index]) {
                      const updatedNames = [...splitNames];
                      updatedNames[index] = getDefaultAliquotName(index);
                      setSplitNames(updatedNames);
                    }
                  }}
                  className="px-3"
                >
                  <Shuffle className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {(splitVolume || individualVolumes.some(v => v)) && (
            <div className="text-sm text-gray-600">
              {splitType === 'equal' ? (
                <>
                  Total volume used: {parseFloat(splitVolume) * splitCount} μL
                  <br />
                  Remaining in source: {sample.volume - (parseFloat(splitVolume) * splitCount)} μL
                </>
              ) : (
                <>
                  Total volume used: {individualVolumes.map(v => parseFloat(v) || 0).reduce((sum, vol) => sum + vol, 0)} μL
                  <br />
                  Remaining in source: {sample.volume - individualVolumes.map(v => parseFloat(v) || 0).reduce((sum, vol) => sum + vol, 0)} μL
                </>
              )}
            </div>
          )}

          <Button 
            onClick={handleSplit} 
            className="w-full"
            disabled={
              splitBarcodes.some(b => !b.trim()) ||
              splitNames.some(n => !n.trim()) ||
              (splitType === 'equal' && (!splitVolume || (parseFloat(splitVolume) * splitCount) >= sample.volume)) ||
              (splitType === 'individual' && (individualVolumes.some(v => !v) || individualVolumes.map(v => parseFloat(v) || 0).reduce((sum, vol) => sum + vol, 0) >= sample.volume))
            }
          >
            Split into {splitCount} aliquots
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
