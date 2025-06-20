import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarcodeScanner } from '@/components/BarcodeScanner';
import { HPLCSequenceTable } from '@/components/HPLCSequenceTable';
import { SampleHistoryTree } from '@/components/SampleHistoryTree';
import { Sample, ActivityLogEntry } from '@/types/sample';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Network, Play, FileText, RotateCcw, X, Settings } from 'lucide-react';
import SampleGraphPage from "./SampleGraph";

const Index = () => {
  // Load data from localStorage on component mount with proper date conversion
  const [samples, setSamples] = useState<Sample[]>(() => {
    const saved = localStorage.getItem('lab-samples');
    if (saved) {
      const parsedSamples = JSON.parse(saved);
      return parsedSamples.map((sample: any) => ({
        ...sample,
        createdAt: new Date(sample.createdAt)
      }));
    }
    return [];
  });
  
  const [selectedSamples, setSelectedSamples] = useState<string[]>(() => {
    const saved = localStorage.getItem('lab-selected-samples');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>(() => {
    const saved = localStorage.getItem('lab-activity-log');
    if (saved) {
      const parsedLog = JSON.parse(saved);
      return parsedLog.map((entry: any) => ({
        ...entry,
        timestamp: new Date(entry.timestamp)
      }));
    }
    return [];
  });
  
  const [scannerOpen, setScannerOpen] = useState(false);
  const [currentWorkflow, setCurrentWorkflow] = useState<any>(null);
  const { toast } = useToast();

  // Save data to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('lab-samples', JSON.stringify(samples));
  }, [samples]);

  useEffect(() => {
    localStorage.setItem('lab-selected-samples', JSON.stringify(selectedSamples));
  }, [selectedSamples]);

  useEffect(() => {
    localStorage.setItem('lab-activity-log', JSON.stringify(activityLog));
  }, [activityLog]);

  // Load current workflow and "workflow-mode" on mount
  useEffect(() => {
    const savedWorkflow = localStorage.getItem('current-workflow');
    const workflowMode = localStorage.getItem('workflow-mode');
    if (savedWorkflow) {
      setCurrentWorkflow(JSON.parse(savedWorkflow));
      // Show notification on mode
      if (workflowMode === "continue") {
        toast({
          title: "Continuing Workflow",
          description: "You may continue working from your previous workflow.",
        });
      } else if (workflowMode === "replay") {
        toast({
          title: "Guided Workflow Loaded",
          description: "You may replay this workflow step by step.",
        });
      }
    }
  }, []);

  // Listen for new workflow-continued event
  useEffect(() => {
    const handleWorkflowEvent = (event: any) => {
      const savedWorkflow = localStorage.getItem('current-workflow');
      const workflowMode = localStorage.getItem('workflow-mode');
      if (savedWorkflow) {
        setCurrentWorkflow(JSON.parse(savedWorkflow));
        if (workflowMode === "continue") {
          toast({
            title: "Continuing Workflow",
            description: "You may continue working from your previous workflow.",
          });
        } else if (workflowMode === "replay") {
          toast({
            title: "Guided Workflow Loaded",
            description: "You may replay this workflow step by step.",
          });
        }
      }
    };
    window.addEventListener('workflow-continued', handleWorkflowEvent);
    window.addEventListener('workflow-loaded', handleWorkflowEvent);
    return () => {
      window.removeEventListener('workflow-continued', handleWorkflowEvent);
      window.removeEventListener('workflow-loaded', handleWorkflowEvent);
    };
  }, []);

  // PATCH 1: On mount, ingest imported LIMS samples if present
  useEffect(() => {
    const limsSamplesStr = localStorage.getItem("lims-imported-samples");
    if (limsSamplesStr) {
      try {
        const limsSamples = JSON.parse(limsSamplesStr);
        if (limsSamples && Array.isArray(limsSamples) && limsSamples.length > 0) {
          setSamples(prev => [
            ...prev,
            ...limsSamples.map((raw: any) => ({
              ...raw,
              id: crypto.randomUUID(),
              createdAt: new Date(),
              status: "imported",
              isParent: true,
              parentId: null,
              position: null,
              weight: null,
            }))
          ]);
        }
        localStorage.removeItem("lims-imported-samples");
      } catch {}
    }
    // PATCH 2: Add solvent-to-blank sample if present
    const solventBlank = localStorage.getItem("solvent-to-blank-sample");
    if (solventBlank) {
      try {
        const blankSample = JSON.parse(solventBlank);
        if (blankSample) {
          setSamples(prev => [
            ...prev,
            { ...blankSample, createdAt: new Date(blankSample.createdAt ?? Date.now()), status: "created" }
          ]);
        }
        localStorage.removeItem("solvent-to-blank-sample");
      } catch {}
    }
  }, []);

  const addActivityLog = (action: ActivityLogEntry['action'], sampleId: string, sampleBarcode: string, details: string, metadata?: any) => {
    const logEntry: ActivityLogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      action,
      sampleId,
      sampleBarcode,
      details,
      metadata
    };
    setActivityLog(prev => [logEntry, ...prev]);
  };

  const addSample = (barcode: string, name: string, sampleType: Sample['sampleType']) => {
    const newSample: Sample = {
      id: crypto.randomUUID(),
      barcode,
      name,
      sampleType,
      status: 'created',
      createdAt: new Date(),
      volume: 0,
      concentration: null,
      position: null,
      parentId: null,
      isParent: true,
      weight: null
    };

    setSamples(prev => [...prev, newSample]);
    addActivityLog('created', newSample.id, barcode, `Sample ${name} (${barcode}) added to tracker with type: ${sampleType}`);
    toast({
      title: "Sample Added",
      description: `Sample ${name} (${barcode}) has been successfully tracked.`,
    });
  };

  const updateSample = (id: string, updates: Partial<Sample>) => {
    setSamples(prev => prev.map(sample => 
      sample.id === id ? { ...sample, ...updates } : sample
    ));
    
    const sample = samples.find(s => s.id === id);
    if (sample) {
      if (updates.weight) {
        addActivityLog('weight_added', id, sample.barcode, `Weight set to ${updates.weight} mg`);
      }
      if (updates.volume && updates.volume !== sample.volume) {
        addActivityLog('volume_added', id, sample.barcode, `Volume updated to ${updates.volume} μL`);
      }
      if (updates.name && updates.name !== sample.name) {
        addActivityLog('renamed', id, sample.barcode, `Sample renamed from "${sample.name}" to "${updates.name}"`);
      }
    }
  };

  const addVolumeFromSource = (targetId: string, sourceId: string, volumeToAdd: number, dilutionFactor?: number) => {
    const target = samples.find(s => s.id === targetId);
    const source = samples.find(s => s.id === sourceId);
    
    if (!target || !source) return;

    const newTargetVolume = Math.round((target.volume + volumeToAdd) * 10) / 10;
    let newConcentration = target.concentration;
    let newName = target.name;

    if (dilutionFactor && target.concentration) {
      // For dilution, calculate the new concentration correctly
      newConcentration = Math.round((target.concentration / dilutionFactor) * 10) / 10;
      if (!target.name.includes('dilution')) {
        newName = `${target.name} - ${dilutionFactor}x dilution`;
      }
    } else if (target.concentration && source.concentration) {
      // Mix two concentrated solutions
      const targetAmount = target.volume * (target.concentration || 0);
      const sourceAmount = volumeToAdd * (source.concentration || 0);
      newConcentration = Math.round(((targetAmount + sourceAmount) / newTargetVolume) * 10) / 10;
    } else if (target.concentration && !source.concentration) {
      // If source has no concentration, this dilutes the target
      const targetAmount = target.volume * target.concentration;
      newConcentration = Math.round((targetAmount / newTargetVolume) * 10) / 10;
    }

    const newSourceVolume = Math.round((source.volume - volumeToAdd) * 10) / 10;

    setSamples(prev => prev.map(sample => {
      if (sample.id === targetId) {
        return { ...sample, volume: newTargetVolume, concentration: newConcentration, name: newName };
      }
      if (sample.id === sourceId) {
        return { ...sample, volume: Math.max(0, newSourceVolume) };
      }
      return sample;
    }));

    const actionType = dilutionFactor ? 'diluted' : 'volume_added';
    const details = dilutionFactor 
      ? `Sample diluted ${dilutionFactor}x by adding ${volumeToAdd} μL from ${source.name}`
      : `Added ${volumeToAdd} μL from ${source.name}`;
    
    addActivityLog(actionType, targetId, target.barcode, details);
    addActivityLog('volume_added', sourceId, source.barcode, `${volumeToAdd} μL transferred to ${target.name}`);
  };

  // PATCH: Ensure correct concentration after splitting!
  // Update splitSample to NOT change child concentrations.
  const splitSample = (parentId: string, splitData: { count: number, volumePerSplit: number, targetBarcodes: string[] }) => {
    const parent = samples.find(s => s.id === parentId);
    if (!parent) return;

    const { count, volumePerSplit, targetBarcodes } = splitData;
    const totalVolumeUsed = volumePerSplit * count;
    const splitSamples: Sample[] = [];

    for (let i = 0; i < count; i++) {
      splitSamples.push({
        id: crypto.randomUUID(),
        barcode: targetBarcodes[i],
        name: `${parent.name} - Split ${i + 1}`,
        sampleType: parent.sampleType,
        status: 'prepared',
        createdAt: new Date(),
        volume: volumePerSplit,
        concentration: parent.concentration,  // concentration stays SAME as parent!
        position: null,
        parentId: parentId,
        isParent: false,
        weight: null
      });
    }

    setSamples(prev => [
      ...prev.map(s => s.id === parentId ? { 
        ...s, 
        volume: Math.round((s.volume - totalVolumeUsed) * 10) / 10,
        status: s.volume - totalVolumeUsed <= 0 ? 'split' as const : s.status
      } : s),
      ...splitSamples
    ]);

    addActivityLog('split', parentId, parent.barcode, `Sample split into ${count} aliquots of ${volumePerSplit} μL each`);

    toast({
      title: "Sample Split",
      description: `Sample ${parent.barcode} has been split into ${count} aliquots.`,
    });
  };

  // Similarly for splitSampleIndividual
  const splitSampleIndividual = (parentId: string, splitData: { volumes: number[], targetBarcodes: string[] }) => {
    const parent = samples.find(s => s.id === parentId);
    if (!parent) return;

    const { volumes, targetBarcodes } = splitData;
    const totalVolumeUsed = volumes.reduce((sum, vol) => sum + vol, 0);
    const splitSamples: Sample[] = [];

    for (let i = 0; i < volumes.length; i++) {
      splitSamples.push({
        id: crypto.randomUUID(),
        barcode: targetBarcodes[i],
        name: `${parent.name} - Split ${i + 1}`,
        sampleType: parent.sampleType,
        status: 'prepared',
        createdAt: new Date(),
        volume: volumes[i],
        concentration: parent.concentration, // Keep same as parent!
        position: null,
        parentId: parentId,
        isParent: false,
        weight: null
      });
    }

    setSamples(prev => [
      ...prev.map(s => s.id === parentId ? { 
        ...s, 
        volume: Math.round((s.volume - totalVolumeUsed) * 10) / 10,
        status: s.volume - totalVolumeUsed <= 0 ? 'split' as const : s.status
      } : s),
      ...splitSamples
    ]);

    addActivityLog('split', parentId, parent.barcode, `Sample split into ${volumes.length} aliquots with individual volumes`);

    toast({
      title: "Sample Split",
      description: `Sample ${parent.barcode} has been split into ${volumes.length} aliquots with individual volumes.`,
    });
  };

  const transferSample = (sourceId: string, targetBarcode: string, volumeToTransfer: number) => {
    const source = samples.find(s => s.id === sourceId);
    if (!source) return;

    const newSample: Sample = {
      id: crypto.randomUUID(),
      barcode: targetBarcode,
      name: `Transfer from ${source.name}`,
      sampleType: source.sampleType,
      status: 'prepared',
      createdAt: new Date(),
      volume: volumeToTransfer,
      concentration: source.concentration, // Preserve concentration during transfer
      position: null,
      parentId: sourceId,
      isParent: false,
      weight: null
    };

    setSamples(prev => [
      ...prev.map(s => s.id === sourceId ? { 
        ...s, 
        volume: Math.round((s.volume - volumeToTransfer) * 10) / 10,
        status: s.volume - volumeToTransfer <= 0 ? 'transferred' as const : s.status
      } : s),
      newSample
    ]);

    addActivityLog('transferred', sourceId, source.barcode, `${volumeToTransfer} μL transferred to ${targetBarcode}`);

    toast({
      title: "Sample Transferred",
      description: `${volumeToTransfer} μL transferred from ${source.barcode} to ${targetBarcode}.`,
    });
  };

  const mergeSamples = (sampleIds: string[], newBarcode: string, sampleType: Sample['sampleType'], partialMerge: boolean = true, sampleVolumes?: { [sampleId: string]: number }, customName?: string) => {
    const samplesToMerge = samples.filter(s => sampleIds.includes(s.id));
    
    // Calculate total volume - use custom volumes if provided for partial merge
    const totalVolume = partialMerge && sampleVolumes 
      ? Object.values(sampleVolumes).reduce((sum, vol) => sum + vol, 0)
      : samplesToMerge.reduce((sum, s) => sum + s.volume, 0);

    const concentrations: { [compound: string]: number } = {};
    samplesToMerge.forEach((sample, index) => {
      if (sample.concentration) {
        const volumeUsed = partialMerge && sampleVolumes ? (sampleVolumes[sample.id] || 0) : sample.volume;
        concentrations[`compound_${index + 1}_from_${sample.barcode}`] = sample.concentration;
      }
    });

    const mergedSample: Sample = {
      id: crypto.randomUUID(),
      barcode: newBarcode,
      name: customName || `Merged Sample ${newBarcode}`,
      sampleType,
      status: 'prepared',
      createdAt: new Date(),
      volume: Math.round(totalVolume * 10) / 10,
      concentration: null,
      concentrations,
      position: null,
      parentId: null,
      isParent: true,
      weight: null
    };

    if (partialMerge && sampleVolumes) {
      // Update source samples by reducing their volume (keep them available)
      setSamples(prev => [
        ...prev.map(s => {
          if (sampleIds.includes(s.id)) {
            const volumeUsed = sampleVolumes[s.id] || 0;
            const newVolume = Math.round((s.volume - volumeUsed) * 10) / 10;
            return { ...s, volume: Math.max(0, newVolume) };
          }
          return s;
        }),
        mergedSample
      ]);
    } else {
      // Full merge - mark original samples as merged
      setSamples(prev => [
        ...prev.map(s => sampleIds.includes(s.id) ? { ...s, status: 'merged' as const, volume: 0 } : s),
        mergedSample
      ]);
    }

    const volumeDetails = partialMerge && sampleVolumes 
      ? ` with custom volumes: ${Object.entries(sampleVolumes).map(([id, vol]) => {
          const sample = samplesToMerge.find(s => s.id === id);
          return `${sample?.barcode}: ${vol} μL`;
        }).join(', ')}`
      : '';

    addActivityLog('merged', mergedSample.id, newBarcode, `${samplesToMerge.length} samples merged into ${newBarcode} (${partialMerge ? 'partial' : 'full'} merge)${volumeDetails}`);

    toast({
      title: "Samples Merged",
      description: `${samplesToMerge.length} samples have been ${partialMerge ? 'partially ' : ''}merged into ${newBarcode}.`,
    });
  };

  const handleLoadWorkflow = (workflow: any) => {
    setCurrentWorkflow(workflow);
    localStorage.setItem('current-workflow', JSON.stringify(workflow));
    localStorage.setItem('guided-workflow', JSON.stringify(workflow));
    
    toast({
      title: "Workflow Loaded",
      description: `Workflow "${workflow.workflow_name}" is ready for guided execution.`,
    });
  };

  const startNewWorkflow = () => {
    setCurrentWorkflow(null);
    setActivityLog([]);
    setSamples([]);
    setSelectedSamples([]);
    localStorage.removeItem('current-workflow');
    localStorage.removeItem('guided-workflow');
    localStorage.removeItem('lab-activity-log');
    localStorage.removeItem('lab-samples');
    localStorage.removeItem('lab-selected-samples');
    
    toast({
      title: "New Workflow Started",
      description: "All data has been cleared. You can now start a fresh workflow.",
    });
  };

  const deselectAllSamples = () => {
    setSelectedSamples([]);
    toast({
      title: "Selection Cleared",
      description: "All samples have been deselected.",
    });
  };

  // Function to assign sequence and navigate
  const handleAssignSelectedAndGo = () => {
    // We want to store the sequence order (list of selected sample IDs in order)
    localStorage.setItem('lab-hplc-sequence', JSON.stringify(selectedSamples));
    window.location.href = "/hplc-sequence-table";
  };

  // ADD: handler to add a batch of samples
  const addSamples = (samplesToAdd: Sample[]) => {
    setSamples(prev => [
      ...prev,
      ...samplesToAdd.map(samp => ({
        ...samp,
        // Defensive check: make sure createdAt is a Date
        createdAt: samp.createdAt instanceof Date ? samp.createdAt : new Date(samp.createdAt),
        id: samp.id || crypto.randomUUID(),
      })),
    ]);
  };

  // Listen for clear-all-samples event from WorkflowManager
  useEffect(() => {
    const handleClearAllSamples = () => {
      setSamples([]);
      localStorage.removeItem('lab-samples');
      toast({ title: 'All Samples Deleted', description: 'All samples have been deleted from the Sample Tracker System.' });
    };
    window.addEventListener('clear-all-samples', handleClearAllSamples);
    return () => window.removeEventListener('clear-all-samples', handleClearAllSamples);
  }, [toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            Laboratory Sample Tracker system
          </h1>
          <p className="text-lg text-slate-600 mb-4">
            HPLC Sample Preparation & Management System
          </p>
          {currentWorkflow && (
            <div className="mb-4">
              <Card className="inline-block">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span>
                      Current Workflow: <strong>{currentWorkflow.workflow_name}</strong>
                      {localStorage.getItem('workflow-mode') === "continue" && (
                        <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Continue Mode</span>
                      )}
                      {localStorage.getItem('workflow-mode') === "replay" && (
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Guided Replay</span>
                      )}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6">
          {/* Sample History Tree */}
          <div>
            <SampleHistoryTree
              samples={samples}
              selectedSamples={selectedSamples}
              onSelectedSamplesChange={setSelectedSamples}
              onUpdateSample={updateSample}
              onSplitSample={splitSample}
              onSplitSampleIndividual={splitSampleIndividual}
              onTransferSample={transferSample}
              onAddVolumeFromSource={addVolumeFromSource}
              onMergeSamples={mergeSamples}
              onAddSample={() => setScannerOpen(true)}
              onAddSamples={addSamples}   // <-- ADDED LINE
            />
            <div className="mt-4 flex flex-row gap-2 items-center">
              <Button
                onClick={handleAssignSelectedAndGo}
                variant="default"
              >
                Send to Analysis Scheduler
              </Button>
              <Button
                onClick={() => setSamples([])}
                variant="destructive"
                disabled={samples.length === 0}
              >
                Delete All Samples
              </Button>
            </div>
            <div className="mt-8">
              <SampleGraphPage />
            </div>
          </div>
        </div>
        {/* Barcode Scanner Modal */}
        <BarcodeScanner
          isOpen={scannerOpen}
          onClose={() => setScannerOpen(false)}
          onScan={addSample}
        />
      </div>
    </div>
  );
};

export default Index;
