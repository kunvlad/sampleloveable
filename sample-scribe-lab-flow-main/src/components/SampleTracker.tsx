import React, { useState, useCallback } from 'react';
import { Sample, PartialMergeData } from '@/types/sample';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { generateFunnyName } from '@/utils/funnyNames';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from '@/components/ui/badge';
import { Copy, CheckCircle2, AlertCircle, PackagePlus, PackageX, ArrowRight, ArrowLeft, ArrowDown, ArrowUp, CopyCheck, Smile } from 'lucide-react';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { BarcodeScanner } from '@/components/BarcodeScanner';
import { SampleHistoryTree } from '@/components/SampleHistoryTree';
import { Link } from 'react-router-dom';
import { Switch } from '@/components/ui/switch';
import { VolumeManagement } from '@/components/VolumeManagement';
import { WeightManagement } from '@/components/WeightManagement';
import { TransferDialog } from '@/components/TransferDialog';
import { SplitDialog } from '@/components/SplitDialog';

interface SampleTrackerProps {
  samples: Sample[];
  onUpdateSamples: (samples: Sample[]) => void;
}

export const SampleTracker: React.FC<SampleTrackerProps> = ({ samples, onUpdateSamples }) => {
  const [newBarcode, setNewBarcode] = useState('');
  const [newName, setNewName] = useState('');
  const [newSampleType, setNewSampleType] = useState<Sample['sampleType']>('unknown');
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [selectedSamples, setSelectedSamples] = useState<string[]>([]);
  const [mergeName, setMergeName] = useState('');
  const [mergeSampleType, setMergeSampleType] = useState<Sample['sampleType']>('system-suitability');
  const [isFunnyName, setIsFunnyName] = useState(false);
  const [isGuidedWorkflow, setIsGuidedWorkflow] = useState(false);
  const [isSampleHistoryVisible, setIsSampleHistoryVisible] = useState(true);
  const [mergeVolumes, setMergeVolumes] = useState<{ [sampleId: string]: number }>({});

  const [copyStatus, copyToClipboard] = useCopyToClipboard();

  const handleCopyToClipboard = (text: string) => {
    copyToClipboard(text);
    if (copyStatus === 'success') {
      toast('Copied!', {
        description: 'Barcode copied to clipboard.',
      });
    } else if (copyStatus === 'error') {
      toast('Error', {
        description: 'Failed to copy barcode to clipboard.',
      });
    }
  };

  const handleOpenBarcodeScanner = () => {
    setIsBarcodeScannerOpen(true);
  };

  const handleCloseBarcodeScanner = () => {
    setIsBarcodeScannerOpen(false);
  };

  const handleNewSample = (barcode: string, name: string, sampleType: Sample['sampleType']) => {
    const newSample: Sample = {
      id: `sample-${Date.now()}`,
      barcode,
      name,
      sampleType,
      status: 'created',
      createdAt: new Date(),
      volume: 500,
      concentration: null,
      position: null,
      parentId: null,
      isParent: true,
      weight: null,
    };

    onUpdateSamples([...samples, newSample]);
    toast('Sample Added', {
      description: `Added sample ${name} with barcode ${barcode}`,
    });
  };

  const handleUpdateSample = (id: string, updates: Partial<Sample>) => {
    const updatedSamples = samples.map(sample =>
      sample.id === id ? { ...sample, ...updates } : sample
    );
    onUpdateSamples(updatedSamples);
    toast('Sample Updated', {
      description: `Updated sample ${updates.name || id}`,
    });
  };

  const handleSplitSample = (parentId: string, splitData: { count: number, volumePerSplit: number, targetBarcodes: string[] }) => {
    const parentSample = samples.find(s => s.id === parentId);
    if (!parentSample) return;

    const { count, volumePerSplit, targetBarcodes } = splitData;
    const newSamples: Sample[] = [];

    for (let i = 0; i < count; i++) {
      const newBarcode = targetBarcodes[i] || `SPLIT${Date.now().toString(36).toUpperCase()}${i}`;
      const newSample: Sample = {
        id: `split-${Date.now()}-${i}`,
        barcode: newBarcode,
        name: `${parentSample.name} Split ${i + 1}`,
        sampleType: parentSample.sampleType,
        status: 'prepared',
        createdAt: new Date(),
        volume: volumePerSplit,
        concentration: parentSample.concentration, // Do not recalculate, keep the same
        position: null,
        parentId: parentId,
        isParent: false,
        weight: parentSample.weight,
      };
      newSamples.push(newSample);
    }

    // Update parent sample volume, keep parent's concentration the same
    const updatedParent: Sample = {
      ...parentSample,
      volume: Math.round((parentSample.volume - (volumePerSplit * count)) * 10) / 10,
      status: 'split' as const,
      concentration: parentSample.concentration,
    };

    onUpdateSamples([...samples.filter(s => s.id !== parentId), ...newSamples, updatedParent]);
    toast('Sample Split', {
      description: `Split sample ${parentSample.name} into ${count} aliquots`,
    });
  };

  const handleSplitSampleIndividual = (parentId: string, splitData: { volumes: number[], targetBarcodes: string[] }) => {
    const parentSample = samples.find(s => s.id === parentId);
    if (!parentSample) return;

    const { volumes, targetBarcodes } = splitData;
    const newSamples: Sample[] = [];

    for (let i = 0; i < volumes.length; i++) {
      const newBarcode = targetBarcodes[i] || `SPLIT${Date.now().toString(36).toUpperCase()}${i}`;
      const newSample: Sample = {
        id: `split-${Date.now()}-${i}`,
        barcode: newBarcode,
        name: `${parentSample.name} Split ${i + 1}`,
        sampleType: parentSample.sampleType,
        status: 'prepared',
        createdAt: new Date(),
        volume: volumes[i],
        concentration: parentSample.concentration, // Do not recalculate, keep the same
        position: null,
        parentId: parentId,
        isParent: false,
        weight: parentSample.weight,
      };
      newSamples.push(newSample);
    }

    // Update parent sample volume, keep parent's concentration the same
    const totalVolume = volumes.reduce((sum, vol) => sum + vol, 0);
    const updatedParent: Sample = {
      ...parentSample,
      volume: Math.round((parentSample.volume - totalVolume) * 10) / 10,
      status: 'split' as const,
      concentration: parentSample.concentration,
    };

    onUpdateSamples([...samples.filter(s => s.id !== parentId), ...newSamples, updatedParent]);
    toast('Sample Split', {
      description: `Split sample ${parentSample.name} into ${volumes.length} aliquots`,
    });
  };

  const handleTransferSample = (sourceId: string, targetBarcode: string, volumeToTransfer: number) => {
    const sourceSample = samples.find(s => s.id === sourceId);
    const targetSample = samples.find(s => s.barcode === targetBarcode);

    if (!sourceSample || !targetSample) {
      toast('Error', {
        description: 'Source or target sample not found.',
      });
      return;
    }

    if (sourceSample.volume < volumeToTransfer) {
      toast('Error', {
        description: 'Not enough volume in source sample.',
      });
      return;
    }

    // Update source sample volume
    const updatedSource: Sample = {
      ...sourceSample,
      volume: Math.round((sourceSample.volume - volumeToTransfer) * 10) / 10,
    };

    // Update target sample volume
    const updatedTarget: Sample = {
      ...targetSample,
      volume: Math.round((targetSample.volume + volumeToTransfer) * 10) / 10,
    };

    onUpdateSamples(
      samples.map(sample => {
        if (sample.id === sourceId) return updatedSource;
        if (sample.id === targetSample.id) return updatedTarget;
        return sample;
      })
    );

    toast('Sample Transferred', {
      description: `Transferred ${volumeToTransfer}μL from ${sourceSample.name} to ${targetSample.name}`,
    });
  };

  const handleAddVolumeFromSource = (targetId: string, sourceId: string, volumeToAdd: number, dilutionFactor?: number) => {
    const targetSample = samples.find(s => s.id === targetId);
    const sourceSample = samples.find(s => s.id === sourceId);

    if (!targetSample || !sourceSample) {
      toast('Error', {
        description: 'Source or target sample not found.',
      });
      return;
    }

    if (sourceSample.volume < volumeToAdd) {
      toast('Error', {
        description: 'Not enough volume in source sample.',
      });
      return;
    }

    // Update source sample volume
    const updatedSource: Sample = {
      ...sourceSample,
      volume: Math.round((sourceSample.volume - volumeToAdd) * 10) / 10,
    };

    // Update target sample volume and concentration
    let updatedTarget: Sample = {
      ...targetSample,
      volume: Math.round((targetSample.volume + volumeToAdd) * 10) / 10,
    };

    if (dilutionFactor) {
      // Adjust concentration based on dilution factor
      updatedTarget = {
        ...updatedTarget,
        concentration: targetSample.concentration ? Math.round((targetSample.concentration / dilutionFactor) * 100) / 100 : null,
      };
    } else if (targetSample.concentration && sourceSample.concentration) {
      // Calculate new concentration based on weighted average
      const totalVolume = targetSample.volume + volumeToAdd;
      const newConcentration = Math.round(((targetSample.concentration * targetSample.volume + sourceSample.concentration * volumeToAdd) / totalVolume) * 100) / 100;
      updatedTarget = {
        ...updatedTarget,
        concentration: newConcentration,
      };
    }

    onUpdateSamples(
      samples.map(sample => {
        if (sample.id === sourceId) return updatedSource;
        if (sample.id === targetId) return updatedTarget;
        return sample;
      })
    );

    toast('Volume Added', {
      description: `Added ${volumeToAdd}μL from ${sourceSample.name} to ${targetSample.name}`,
    });
  };

  const handleMergeSamples = (mergeData: PartialMergeData[], mergeName: string, sampleType: Sample['sampleType']) => {
    console.log('Merging samples with data:', mergeData);
    console.log('Merge name:', mergeName);
    console.log('Sample type:', sampleType);
    
    // Calculate total volume and compound concentrations
    let totalVolume = 0;
    const compoundConcentrations: { [compound: string]: number } = {};
    const compounds: string[] = [];
    let totalWeight = 0;

    mergeData.forEach(data => {
      const sample = samples.find(s => s.id === data.sampleId);
      if (sample) {
        totalVolume += data.volume;
        totalWeight += sample.weight || 0;

        if (sample.compounds) {
          sample.compounds.forEach(compound => {
            if (compounds.indexOf(compound) === -1) {
              compounds.push(compound);
            }
          });
        }

        if (sample.concentrations) {
          Object.entries(sample.concentrations).forEach(([compound, concentration]) => {
            compoundConcentrations[compound] = (compoundConcentrations[compound] || 0) + concentration * data.volume;
          });
        }
      }
    });

    // Normalize compound concentrations
    Object.keys(compoundConcentrations).forEach(compound => {
      compoundConcentrations[compound] = Math.round((compoundConcentrations[compound] / totalVolume) * 100) / 100;
    });

    // Generate new barcode for merged sample
    const mergedBarcode = `MRG${Date.now().toString(36).toUpperCase()}`;
    
    // Create merged sample with the provided name
    const mergedSample: Sample = {
      id: `merged-${Date.now()}`,
      barcode: mergedBarcode,
      name: mergeName, // Use the provided merge name
      sampleType: sampleType,
      status: 'prepared',
      createdAt: new Date(),
      volume: Math.round(totalVolume * 10) / 10,
      concentration: totalWeight > 0 ? Math.round((totalWeight / (totalVolume / 1000)) * 10) / 10 : null,
      position: null,
      parentId: null,
      isParent: true,
      weight: totalWeight > 0 ? totalWeight : null,
      concentrations: Object.keys(compoundConcentrations).length > 0 ? compoundConcentrations : undefined,
      compounds: compounds.length > 0 ? compounds : undefined
    };

    // Update source samples by reducing their volume (partial merge)
    const updatedSamples = samples.map(sample => {
      const mergeEntry = mergeData.find(data => data.sampleId === sample.id);
      if (mergeEntry) {
        const newVolume = Math.round((sample.volume - mergeEntry.volume) * 10) / 10;
        return { ...sample, volume: Math.max(0, newVolume) };
      }
      return sample;
    });

    onUpdateSamples([...updatedSamples, mergedSample]);
    setSelectedSamples([]);
    setMergeName('');
    setMergeVolumes({});
    toast('Samples Merged', {
      description: `Merged ${mergeData.length} samples into ${mergeName}`,
    });
  };

  const getSelectedSamplesData = () => {
    return samples.filter(sample => selectedSamples.includes(sample.id));
  };

  const generateFunnySampleName = () => {
    setMergeName(generateFunnyName());
  };

  const handleVolumeChange = (sampleId: string, volume: number) => {
    setMergeVolumes(prev => ({
      ...prev,
      [sampleId]: volume
    }));
  };

  const suggestEqualVolumes = () => {
    if (selectedSamples.length === 0) return;
    
    const minVolume = Math.min(...selectedSamples.map(id => {
      const sample = samples.find(s => s.id === id);
      return sample ? sample.volume : 0;
    }));
    
    const suggestedVolume = Math.floor(minVolume * 0.8); // Use 80% of minimum volume
    
    const newVolumes: { [sampleId: string]: number } = {};
    selectedSamples.forEach(sampleId => {
      newVolumes[sampleId] = suggestedVolume;
    });
    
    setMergeVolumes(newVolumes);
  };

  const getTotalVolume = () => {
    return Object.values(mergeVolumes).reduce((sum, vol) => sum + vol, 0);
  };

  const getConcentrationBreakdown = () => {
    const breakdown: { [compound: string]: { totalAmount: number; finalConcentration: number } } = {};
    const totalVol = getTotalVolume();
    
    if (totalVol === 0) return {};

    selectedSamples.forEach(sampleId => {
      const sample = samples.find(s => s.id === sampleId);
      const volume = mergeVolumes[sampleId] || 0;
      
      if (sample && sample.concentrations) {
        Object.entries(sample.concentrations).forEach(([compound, concentration]) => {
          if (!breakdown[compound]) {
            breakdown[compound] = { totalAmount: 0, finalConcentration: 0 };
          }
          breakdown[compound].totalAmount += concentration * volume;
        });
      }
    });

    // Calculate final concentrations
    Object.keys(breakdown).forEach(compound => {
      breakdown[compound].finalConcentration = Math.round((breakdown[compound].totalAmount / totalVol) * 100) / 100;
    });

    return breakdown;
  };

  // Handler to delete all samples
  const handleDeleteAllSamples = () => {
    onUpdateSamples([]);
    localStorage.removeItem('lab-samples');
    toast('All Samples Deleted', { description: 'All samples have been deleted from the Sample Tracker System.' });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Sample List */}
      <div className="md:col-span-2">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Sample List</h2>
          <Button onClick={handleOpenBarcodeScanner}>
            <PackagePlus className="h-4 w-4 mr-2" />
            Add Sample
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Barcode</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Volume (μL)</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {samples.map((sample) => (
              <TableRow key={sample.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {sample.barcode}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopyToClipboard(sample.barcode)}
                    >
                      {copyStatus === 'success' ? (
                        <CopyCheck className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </TableCell>
                <TableCell>{sample.name}</TableCell>
                <TableCell>{sample.sampleType}</TableCell>
                <TableCell>{sample.volume}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {sample.status !== 'split' && sample.status !== 'merged' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedSamples([...selectedSamples, sample.id])}
                      >
                        <ArrowRight className="h-4 w-4 mr-2" />
                        Select
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Sample Actions */}
      <div>
        <h2 className="text-xl font-bold mb-4">Sample Actions</h2>

        {/* Merge Samples */}
        <div className="mb-6 p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Merge Samples (Partial)</h3>
          {selectedSamples.length > 0 ? (
            <>
              <div className="mb-4 space-y-2">
                {selectedSamples.map(sampleId => {
                  const sample = samples.find(s => s.id === sampleId);
                  if (!sample) return null;
                  
                  return (
                    <div key={sampleId} className="flex items-center gap-2 text-sm">
                      <span className="flex-1">{sample.name}</span>
                      <Input
                        type="number"
                        placeholder="Volume (μL)"
                        value={mergeVolumes[sampleId] || ''}
                        onChange={(e) => handleVolumeChange(sampleId, Number(e.target.value))}
                        className="w-24"
                        max={sample.volume}
                      />
                      <span className="text-gray-500">/ {sample.volume}μL</span>
                    </div>
                  );
                })}
              </div>

              <div className="mb-2">
                <Button onClick={suggestEqualVolumes} variant="outline" size="sm" className="mb-2">
                  Suggest Equal Volumes
                </Button>
                <div className="text-sm text-gray-600">
                  Total Volume: {getTotalVolume()}μL
                </div>
              </div>

              {/* Concentration Breakdown */}
              {Object.keys(getConcentrationBreakdown()).length > 0 && (
                <div className="mb-2 p-2 bg-gray-50 rounded text-sm">
                  <div className="font-medium mb-1">Final Concentrations:</div>
                  {Object.entries(getConcentrationBreakdown()).map(([compound, data]) => (
                    <div key={compound} className="text-xs">
                      {compound}: {data.finalConcentration} units
                    </div>
                  ))}
                </div>
              )}

              <div className="mb-2">
                <Label htmlFor="mergeName">Merged Sample Name</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="text"
                    id="mergeName"
                    value={mergeName}
                    onChange={(e) => setMergeName(e.target.value)}
                    placeholder="Enter merged sample name"
                  />
                  <Button
                    variant="outline"
                    onClick={generateFunnySampleName}
                    className="px-3"
                    title="Generate funny name"
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="mb-2">
                <Label htmlFor="mergeSampleType">Merged Sample Type</Label>
                <Select value={mergeSampleType} onValueChange={(value: Sample['sampleType']) => setMergeSampleType(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sample type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blank">Blank</SelectItem>
                    <SelectItem value="system-suitability">System Suitability</SelectItem>
                    <SelectItem value="control">Control</SelectItem>
                    <SelectItem value="calibration">Calibration</SelectItem>
                    <SelectItem value="sample">Sample</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => {
                  const mergeData = selectedSamples.map(sampleId => ({ 
                    sampleId, 
                    volume: mergeVolumes[sampleId] || 0, 
                    sampleName: samples.find(s => s.id === sampleId)?.name || '' 
                  }));
                  handleMergeSamples(mergeData, mergeName, mergeSampleType);
                }}
                disabled={selectedSamples.length < 2 || !mergeName.trim() || getTotalVolume() === 0}
              >
                Merge Selected Samples
              </Button>
            </>
          ) : (
            <p className="text-gray-500">Select samples to merge.</p>
          )}
        </div>

        {/* Sample History Tree */}
        <div className="mb-6 p-4 border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Sample History</h3>
            <Switch id="sample-history-visible" checked={isSampleHistoryVisible} onCheckedChange={setIsSampleHistoryVisible} />
          </div>
          <button
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded shadow mb-4"
            onClick={handleDeleteAllSamples}
            type="button"
            disabled={samples.length === 0}
          >
            Delete All Samples
          </button>
          {isSampleHistoryVisible && (
            <SampleHistoryTree
              samples={samples}
              selectedSamples={selectedSamples}
              onSelectedSamplesChange={setSelectedSamples}
              onUpdateSample={handleUpdateSample}
              onSplitSample={handleSplitSample}
              onSplitSampleIndividual={handleSplitSampleIndividual}
              onTransferSample={handleTransferSample}
              onAddVolumeFromSource={handleAddVolumeFromSource}
            />
          )}
        </div>
      </div>

      {/* Barcode Scanner Dialog */}
      <BarcodeScanner
        isOpen={isBarcodeScannerOpen}
        onClose={handleCloseBarcodeScanner}
        onScan={handleNewSample}
      />
    </div>
  );
};
