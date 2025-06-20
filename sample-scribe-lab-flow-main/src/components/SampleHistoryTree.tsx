import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Sample } from '@/types/sample';
import { ChevronDown, ChevronRight, Weight, ArrowRightLeft, Split, Beaker, Edit, ArrowRight, Merge, PackagePlus, Droplet, Import } from 'lucide-react';
import { WeightManagement } from '@/components/WeightManagement';
import { VolumeManagement } from '@/components/VolumeManagement';
import { TransferDialog } from '@/components/TransferDialog';
import { SplitDialog } from '@/components/SplitDialog';
import { EditSampleDialog } from '@/components/EditSampleDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MergeDialog } from './MergeDialog';
import { useToast } from "@/hooks/use-toast";
import { SolventPickerDialog } from "@/components/SolventPickerDialog";
import { LIMSImportDialog } from "@/components/LIMSImportDialog";

interface SampleHistoryTreeProps {
  samples: Sample[];
  selectedSamples: string[];
  onSelectedSamplesChange: (selectedSamples: string[]) => void;
  onUpdateSample?: (id: string, updates: Partial<Sample>) => void;
  onSplitSample?: (parentId: string, splitData: { count: number, volumePerSplit: number, targetBarcodes: string[] }) => void;
  onSplitSampleIndividual?: (parentId: string, splitData: { volumes: number[], targetBarcodes: string[] }) => void;
  onTransferSample?: (sourceId: string, targetBarcode: string, volumeToTransfer: number, targetName: string) => void;
  onAddVolumeFromSource?: (targetId: string, sourceId: string, volumeToAdd: number, dilutionFactor?: number) => void;
  onMergeSamples?: (sampleIds: string[], newBarcode: string, sampleType: Sample['sampleType'], partialMerge: boolean, sampleVolumes?: { [sampleId: string]: number }, customName?: string) => void;
  onAddSample?: () => void;
  onAddSamples?: (samples: Sample[]) => void;
}

interface TreeNode {
  sample: Sample;
  children: TreeNode[];
  level: number;
}

export const SampleHistoryTree: React.FC<SampleHistoryTreeProps> = ({ 
  samples, 
  selectedSamples, 
  onSelectedSamplesChange,
  onUpdateSample,
  onSplitSample,
  onSplitSampleIndividual,
  onTransferSample,
  onAddVolumeFromSource,
  onMergeSamples,
  onAddSample,
  onAddSamples
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [editingSample, setEditingSample] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDialogSample, setEditDialogSample] = useState<Sample | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  // Set default to "all" instead of "received"
  const [statusFilter, setStatusFilter] = useState<Sample['status'] | 'all'>('all');
  const { toast } = useToast();

  // Add dialog state
  const [solventPickerOpen, setSolventPickerOpen] = useState(false);
  const [limsImportDialogOpen, setLimsImportDialogOpen] = useState(false); // NEW

  const filteredSamples = useMemo(() => {
    if (statusFilter === 'all') {
      return samples;
    }
    const samplesWithStatus = samples.filter(s => s.status === statusFilter);
    const sampleMap = new Map(samples.map(sample => [sample.id, sample]));
    const visibleSampleIds = new Set<string>();

    function addWithParents(sample: Sample) {
      if (visibleSampleIds.has(sample.id)) return;
      visibleSampleIds.add(sample.id);
      if (sample.parentId) {
        const parent = sampleMap.get(sample.parentId);
        if (parent) {
          addWithParents(parent);
        }
      }
    }

    samplesWithStatus.forEach(addWithParents);
    return samples.filter(sample => visibleSampleIds.has(sample.id));
  }, [samples, statusFilter]);

  // Add utility to find all leaf nodes
  const getLeafSampleIds = () => {
    const allIds = new Set(samples.map(s => s.id));
    const parentIds = new Set(samples.filter(s => s.parentId).map(s => s.parentId!));
    // leaf: id that is NOT a parentId
    return samples
      .filter(s => allIds.has(s.id) && !parentIds.has(s.id) && (s.status !== "merged" && s.status !== "split"))
      .map(s => s.id);
  };

  const buildTree = (): TreeNode[] => {
    const sampleMap = new Map<string, Sample>();
    filteredSamples.forEach(sample => sampleMap.set(sample.id, sample));

    const rootNodes: TreeNode[] = [];
    const processedNodes = new Set<string>();

    const createNode = (sample: Sample, level: number = 0): TreeNode => {
      const children: TreeNode[] = [];
      
      filteredSamples
        .filter(s => s.parentId === sample.id)
        .forEach(child => {
          if (!processedNodes.has(child.id)) {
            processedNodes.add(child.id);
            children.push(createNode(child, level + 1));
          }
        });

      return { sample, children, level };
    };

    filteredSamples
      .filter(sample => !sample.parentId || !sampleMap.has(sample.parentId))
      .forEach(rootSample => {
        if (!processedNodes.has(rootSample.id)) {
          processedNodes.add(rootSample.id);
          rootNodes.push(createNode(rootSample, 0));
        }
      });

    return rootNodes;
  };

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const collapseAllTrees = () => {
    setExpandedNodes(new Set());
  };

  const getStatusColor = (status: Sample['status']) => {
    switch (status) {
      case 'created': return 'bg-blue-100 text-blue-800';
      case 'imported': return 'bg-yellow-100 text-yellow-800';
      case 'prepared': return 'bg-green-100 text-green-800';
      case 'analyzed': return 'bg-purple-100 text-purple-800';
      case 'split': return 'bg-orange-100 text-orange-800';
      case 'merged': return 'bg-gray-100 text-gray-800';
      case 'transferred': return 'bg-gray-50 text-gray-500';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSampleSelection = (sampleId: string, checked: boolean) => {
    if (checked) {
      onSelectedSamplesChange([...selectedSamples, sampleId]);
    } else {
      onSelectedSamplesChange(selectedSamples.filter(id => id !== sampleId));
    }
  };

  const handleStartEdit = (sample: Sample) => {
    setEditingSample(sample.id);
    setEditName(sample.name);
  };

  const handleSaveEdit = (sampleId: string) => {
    if (onUpdateSample && editName.trim()) {
      onUpdateSample(sampleId, { name: editName.trim() });
    }
    setEditingSample(null);
    setEditName('');
  };

  const handleCancelEdit = () => {
    setEditingSample(null);
    setEditName('');
  };

  const handleOpenEditDialog = (sample: Sample) => {
    setEditDialogSample(sample);
    setIsEditDialogOpen(true);
  };

  const handleSaveEditDialog = (sampleId: string, updates: { name: string; sampleType: Sample['sampleType'] }) => {
    if (onUpdateSample) {
      onUpdateSample(sampleId, updates);
    }
  };

  const handleUpdateWeight = (sampleId: string, weight: number) => {
    const sample = samples.find(s => s.id === sampleId);
    if (sample && sample.volume > 0) {
      const concentration = Math.round((weight / (sample.volume / 1000)) * 100) / 100;
      onUpdateSample?.(sampleId, { weight, concentration });
    } else {
      onUpdateSample?.(sampleId, { weight });
    }
  };

  const handleUpdateVolume = (sampleId: string, volume: number) => {
    const sample = samples.find(s => s.id === sampleId);
    if (sample && sample.weight) {
      const concentration = Math.round((sample.weight / (volume / 1000)) * 10) / 10;
      onUpdateSample?.(sampleId, { volume: Math.round(volume * 10) / 10, concentration });
    } else {
      onUpdateSample?.(sampleId, { volume: Math.round(volume * 10) / 10 });
    }
  };

  // Allowed sampleType values from Sample definition
  const allowedSampleTypes: Sample['sampleType'][] = [
    "blank",
    "system-suitability",
    "control",
    "calibration",
    "unknown",
    "sample",
  ];
  const allowedStatuses: Sample['status'][] = [
    "created",
    "imported",
    "prepared",
    "analyzed",
    "split",
    "merged",
    "transferred",
  ];

  // In-place LIMS import
  const handleLIMSImport = (newSamples: any[]) => {
    // Convert LIMS samples to Sample type as best as possible
    const importedSamples = newSamples.map((sample) => {
      // Ensure only allowed sampleType and assign status "imported"
      const safeSampleType: Sample['sampleType'] =
        allowedSampleTypes.includes(sample.sampleType)
          ? sample.sampleType
          : "unknown";
      // Assign imported status
      const safeStatus: Sample['status'] = "imported";
      return {
        id: crypto.randomUUID(),
        barcode: sample.barcode || "",
        name: sample.name || "",
        sampleType: safeSampleType,
        status: safeStatus, // imported!
        createdAt: new Date(),
        volume: sample.volume ?? 0,
        concentration: sample.concentration ?? null,
        position: null,
        parentId: null,
        isParent: true,
        weight: null,
      } as Sample;
    });
    if (importedSamples.length && onAddSamples) {
      onAddSamples(importedSamples);
    } else if (importedSamples.length && onUpdateSample) {
      importedSamples.forEach((samp) => onUpdateSample(samp.id, samp));
    }
    toast({ title: "Samples Imported", description: "From LIMS" });
  };

  // Change: onCreateBlankSampleFromSolvent now adds a new sample to the tree
  const handleCreateBlankSampleFromSolvent = (solvent: any) => {
    const newSample: Sample = {
      id: crypto.randomUUID(),
      barcode: "BLNK-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
      name: `Blank (${solvent.name})`,
      sampleType: "blank",
      status: "created",
      createdAt: new Date(),
      volume: Number(solvent.volume) * 1000, // μL
      concentration: null,
      position: null,
      parentId: null,
      isParent: true,
      weight: null,
    };
    onAddSamples?.([newSample]);
    toast({ title: "Blank Sample Imported", description: "Created from Solvent" });
  };

  const sampleTypeBadgeColor = (sampleType: Sample['sampleType']) => {
    switch (sampleType) {
      case 'blank': return 'bg-gray-100 text-gray-800 border';
      case 'system-suitability': return 'bg-blue-100 text-blue-800 border';
      case 'control': return 'bg-green-100 text-green-800 border';
      case 'calibration': return 'bg-purple-100 text-purple-800 border';
      case 'unknown': return 'bg-orange-100 text-orange-800 border';
      default: return 'bg-gray-100 text-gray-900 border';
    }
  };

  const renderNode = (node: TreeNode): React.ReactNode => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedNodes.has(node.sample.id);
    const indentLevel = node.level * 24;
    const isSelected = selectedSamples.includes(node.sample.id);
    const isActive = node.sample.status !== 'split' && node.sample.status !== 'merged';
    const isEditing = editingSample === node.sample.id;

   // Extract dilution factor if present, e.g. "2x dilution"
   let dilutionFactor: string | null = null;
   if (node.sample.name) {
     const match = node.sample.name.match(/(\d+(\.\d+)?)x dilution/i);
     if (match) {
       dilutionFactor = match[1];
     }
   }

    return (
      <div key={node.sample.id} className="mb-2">
        <div 
          className={`p-3 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow ${
            isSelected ? 'bg-blue-50 border-blue-300' : 'bg-white'
          }`}
          style={{ marginLeft: `${indentLevel}px` }}
        >
          <div className="flex items-center gap-2 mb-3">
            {isActive && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => handleSampleSelection(node.sample.id, !!checked)}
              />
            )}

            {hasChildren ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleNode(node.sample.id)}
                className="p-1 h-6 w-6"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            ) : (
              <div className="w-6 h-6 flex items-center justify-center">
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              </div>
            )}

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-8 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(node.sample.id);
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                      autoFocus
                    />
                    <Button size="sm" onClick={() => handleSaveEdit(node.sample.id)}>
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <>
                    <span className="font-medium text-gray-900">{node.sample.name}</span>
                    {/* Type Badge */}
                    <Badge className={sampleTypeBadgeColor(node.sample.sampleType)}>
                      {node.sample.sampleType.replace('-', ' ')}
                    </Badge>
                    {/* Status Badge */}
                    <Badge className={getStatusColor(node.sample.status)}>
                      {node.sample.status}
                    </Badge>
                    {/* Dilution Icon (if present) */}
                    {dilutionFactor && (
                      <span title={`${dilutionFactor}x dilution`}>
                        <Droplet className="inline h-4 w-4 text-blue-400 ml-1 mr-0.5" />
                        <span className="text-xs text-blue-500">{dilutionFactor}x</span>
                      </span>
                    )}
                  </>
                )}
              </div>
              {/* NEW: Barcode field */}
              <div className="mb-0.5">
                <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-xs font-mono rounded text-gray-600 border border-gray-200">
                  Barcode:&nbsp;
                  <span className="text-gray-900">{node.sample.barcode}</span>
                </span>
              </div>
              {/* Split the mini-fields to show Volume, Weight, Concentration with icons */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <span className="inline-block text-gray-400"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="4" y="9" width="16" height="11" rx="2" /><path d="M8 9V5a4 4 0 0 1 8 0v4" /></svg></span>
                  {node.sample.volume}μL
                </div>
                {node.sample.weight !== null && (
                  <div className="flex items-center gap-1">
                    <span className="inline-block text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6.7 6.7A7 7 0 1 1 12 19a7 7 0 1 1 5.3-12.3"/><path d="M12 8v4l3 3"/></svg>
                    </span>
                    {node.sample.weight} mg
                  </div>
                )}
                {node.sample.concentration !== null && (
                  <div className="flex items-center gap-1">
                    <span className="inline-block text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><path d="M16 12a4 4 0 0 1-8 0"/></svg>
                    </span>
                    {node.sample.concentration} mg/mL
                  </div>
                )}
                <span className="text-xs text-purple-600">{node.sample.position && <>HPLC Position: {node.sample.position}</>}</span>
              </div>
            </div>

            {!isEditing && (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleStartEdit(node.sample)}
                  className="p-1 h-6 w-6"
                  title="Quick edit name"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenEditDialog(node.sample)}
                  className="p-1 h-6 w-6"
                  title="Edit name and type"
                >
                  <Beaker className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Action Buttons - inside the sample window and synced with SampleTracker logic */}
          {isActive && !isEditing && (
            <div className="flex flex-wrap gap-2 mt-2">
              {/* Volume Management */}
              {onUpdateSample && onAddVolumeFromSource && (
                <VolumeManagement
                  sample={node.sample}
                  samples={samples}
                  onUpdateVolume={handleUpdateVolume}
                  onAddVolumeFromSource={onAddVolumeFromSource}
                  onUpdateSample={onUpdateSample}
                />
              )}
              
              {/* Weight Management - only for parent samples and NOT for merged samples */}
              {node.sample.isParent && onUpdateSample && node.sample.status !== "merged" && (
                <WeightManagement 
                  sample={node.sample}
                  onUpdateWeight={handleUpdateWeight}
                />
              )}
              
              {/* Transfer Button */}
              {node.sample.volume > 0 && onTransferSample && (
                <TransferDialog
                  sample={node.sample}
                  onTransfer={onTransferSample}
                >
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-green-200 text-green-700 hover:bg-green-50"
                  >
                    <ArrowRight className="h-4 w-4 mr-1" />
                    Transfer
                  </Button>
                </TransferDialog>
              )}

              {/* Split Button - available for all samples with volume */}
              {node.sample.volume > 0 && onSplitSample && onSplitSampleIndividual && (
                <SplitDialog
                  sample={node.sample}
                  onSplit={onSplitSample}
                  onSplitIndividual={onSplitSampleIndividual}
                >
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-orange-200 text-orange-700 hover:bg-orange-50"
                    disabled={node.sample.volume <= 0}
                  >
                    <Split className="h-4 w-4 mr-1" />
                    Split
                  </Button>
                </SplitDialog>
              )}
            </div>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-2">
            {node.children.map(child => renderNode(child))}
          </div>
        )}
      </div>
    );
  };

  const treeNodes = buildTree();

  return (
    <>
      <Card className="h-fit">
        <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardTitle className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              Sample History Tree
              {onAddSample && (
                <Button
                  onClick={onAddSample}
                  variant="outline"
                  size="sm"
                  className="ml-4 bg-white/20 text-white hover:bg-white/30 border-white/30 hover:text-white"
                >
                  <PackagePlus className="h-4 w-4 mr-2" />
                  Add Sample
                </Button>
              )}
              {/* PATCH: Use Dialog to Import from LIMS */}
              <Button
                onClick={() => setLimsImportDialogOpen(true)}
                variant="outline"
                size="sm"
                className="ml-2 bg-white/20 text-white hover:bg-white/30 border-white/30 hover:text-white"
                title="Import samples from LIMS"
              >
                <Import className="h-4 w-4 mr-1" />
                Import from LIMS
              </Button>
              {/* Create Blank Sample from Solvent */}
              <Button
                onClick={() => setSolventPickerOpen(true)}
                variant="outline"
                size="sm"
                className="ml-2 bg-white/20 text-white hover:bg-white/30 border-white/30 hover:text-white"
                title="Create blank sample from solvent"
              >
                <Beaker className="h-4 w-4 mr-1" />
                Blank from Solvent
              </Button>
            </span>
            <div className="flex items-center gap-2">
              {/* Add: Collapse all button */}
              <Button
                variant="outline"
                size="sm"
                className="border-purple-200 text-purple-700 bg-white/20 hover:bg-white/40 hover:text-purple-800"
                onClick={collapseAllTrees}
              >
                Collapse all trees
              </Button>
              {/* ADD: Select all leaf samples button */}
              <Button
                variant="outline"
                size="sm"
                className="border-purple-200 text-purple-700 bg-white/20 hover:bg-white/40 hover:text-purple-800"
                onClick={() => {
                  const leafSampleIds = getLeafSampleIds();
                  onSelectedSamplesChange(leafSampleIds);
                }}
              >
                Select all leaf samples
              </Button>
              {/* ... keep filter by status ... */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-normal">Filter by status:</span>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                    <SelectTrigger className="w-[180px] bg-white/20 border-white/30 text-white">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="created">Created</SelectItem>
                        <SelectItem value="imported">Imported</SelectItem>
                        <SelectItem value="prepared">Prepared</SelectItem>
                        <SelectItem value="analyzed">Analyzed</SelectItem>
                        <SelectItem value="split">Split</SelectItem>
                        <SelectItem value="merged">Merged</SelectItem>
                        <SelectItem value="transferred">Transferred</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {selectedSamples.length > 1 && onMergeSamples && (
              <div className="mb-4">
                <MergeDialog
                    samplesToMerge={samples.filter(s => selectedSamples.includes(s.id))}
                    onMergeSamples={onMergeSamples}
                >
                  <Button variant="outline">
                      <Merge className="h-4 w-4 mr-2" />
                      Merge {selectedSamples.length} selected samples
                  </Button>
                </MergeDialog>
              </div>
          )}
          {treeNodes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="h-12 w-12 mx-auto mb-4 opacity-50 bg-gray-200 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 bg-gray-400 rounded"></div>
              </div>
              <p className="text-lg mb-2">No sample history yet</p>
              <p className="text-sm">Sample relationships will appear here as you split and merge samples. Try changing the filter.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {treeNodes.map(node => renderNode(node))}
            </div>
          )}
        </CardContent>
      </Card>
      {/* PATCH: LIMSImportDialog for modal in-place import */}
      <LIMSImportDialog
        open={limsImportDialogOpen}
        onClose={() => setLimsImportDialogOpen(false)}
        onImport={handleLIMSImport}
      />
      <EditSampleDialog
        sample={editDialogSample}
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditDialogSample(null);
        }}
        onSave={handleSaveEditDialog}
      />
      <SolventPickerDialog
        open={solventPickerOpen}
        onClose={() => setSolventPickerOpen(false)}
        onSelect={handleCreateBlankSampleFromSolvent}
      />
    </>
  );
};
