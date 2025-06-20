import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Sample } from '@/types/sample';
import { Beaker, Calculator, Pipette, Dice6 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VolumeManagementProps {
  sample: Sample;
  samples: Sample[];
  onUpdateVolume: (sampleId: string, volume: number) => void;
  onAddVolumeFromSource: (targetId: string, sourceId: string, volumeToAdd: number, dilutionFactor?: number) => void;
  onUpdateSample?: (sampleId: string, updates: Partial<Sample>) => void;
}

export const VolumeManagement: React.FC<VolumeManagementProps> = ({
  sample,
  samples,
  onUpdateVolume,
  onAddVolumeFromSource,
  onUpdateSample
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'set' | 'add' | 'dilute'>('set');
  const [newVolume, setNewVolume] = useState(sample.volume > 0 ? sample.volume.toString() : '');
  const [volumeToAdd, setVolumeToAdd] = useState('');
  const [sourceId, setSourceId] = useState('');
  const [dilutionType, setDilutionType] = useState<'preset' | 'custom'>('preset');
  const [dilutionFactor, setDilutionFactor] = useState<number>(2);
  const [customDilution, setCustomDilution] = useState('');
  const { toast } = useToast();

  const calculateConcentration = (weight: number, volume: number): number => {
    const volumeInMl = volume / 1000;
    return Math.round((weight / volumeInMl) * 10) / 10;
  };

  const calculateMixedConcentration = (
    targetVolume: number, 
    targetConcentration: number | null, 
    addedVolume: number, 
    sourceConcentration: number | null
  ): number | null => {
    if (!targetConcentration && !sourceConcentration) return null;
    
    const targetAmount = targetVolume * (targetConcentration || 0);
    const sourceAmount = addedVolume * (sourceConcentration || 0);
    const totalVolume = targetVolume + addedVolume;
    
    return Math.round(((targetAmount + sourceAmount) / totalVolume) * 10) / 10;
  };

  const calculateDilutedConcentration = (originalConcentration: number, dilutionFactor: number): number => {
    return Math.round((originalConcentration / dilutionFactor) * 10) / 10;
  };

  const calculateVolumeNeeded = (currentVolume: number, dilutionFactor: number): number => {
    return Math.round((currentVolume * (dilutionFactor - 1)) * 10) / 10;
  };

  // Available sources for all modes
  const availableSources = samples.filter(s => {
    return s.id !== sample.id && 
           s.volume > 0 && 
           (s.status === 'prepared' || s.status === 'created');
  });

  const handleVolumeUpdate = () => {
    const volume = parseFloat(newVolume);
    if (isNaN(volume) || volume <= 0) {
      toast({
        title: "Invalid Volume",
        description: "Please enter a valid volume value.",
        variant: "destructive"
      });
      return;
    }

    if (sourceId && sourceId !== 'manual') {
      // Using a source for setting volume
      const volumeToAdd = volume - sample.volume;
      if (volumeToAdd > 0) {
        onAddVolumeFromSource(sample.id, sourceId, volumeToAdd);
      } else {
        onUpdateVolume(sample.id, volume);
      }
    } else {
      onUpdateVolume(sample.id, volume);
    }
    
    setIsOpen(false);
    
    const concentrationInfo = sample.weight 
      ? ` Concentration calculated: ${calculateConcentration(sample.weight, volume)} mg/mL.`
      : '';
    
    toast({
      title: "Volume Updated",
      description: `Sample volume set to ${volume} μL.${concentrationInfo}`,
    });
  };

  const handleAddVolume = () => {
    const addVolume = parseFloat(volumeToAdd);
    if (isNaN(addVolume) || addVolume <= 0) {
      toast({
        title: "Invalid Volume",
        description: "Please enter a valid volume to add.",
        variant: "destructive"
      });
      return;
    }

    if (sourceId && sourceId !== 'manual') {
      onAddVolumeFromSource(sample.id, sourceId, addVolume);
      const sourceDetails = samples.find(s => s.id === sourceId);
      toast({
        title: "Volume Added",
        description: `Added ${addVolume} μL from ${sourceDetails?.name || 'source sample'}.`,
      });
    } else {
      const currentVolume = sample.volume;
      const totalVolume = currentVolume + addVolume;
      onUpdateVolume(sample.id, totalVolume);
      toast({
        title: "Volume Added",
        description: `Added ${addVolume} μL. Total volume: ${totalVolume} μL`,
      });
    }

    setVolumeToAdd('');
    setSourceId('');
    setIsOpen(false);
  };

  const handleDilution = () => {
    const finalDilutionFactor = dilutionType === 'preset' ? dilutionFactor : parseFloat(customDilution);
    
    if (isNaN(finalDilutionFactor) || finalDilutionFactor <= 1) {
      toast({
        title: "Invalid Dilution",
        description: "Dilution factor must be greater than 1.",
        variant: "destructive"
      });
      return;
    }

    const volumeNeeded = calculateVolumeNeeded(sample.volume, finalDilutionFactor);
    
    if (sourceId && sourceId !== 'manual') {
      onAddVolumeFromSource(sample.id, sourceId, volumeNeeded, finalDilutionFactor);
      const sourceDetails = samples.find(s => s.id === sourceId);
      toast({
        title: "Sample Diluted",
        description: `Added ${volumeNeeded} μL from ${sourceDetails?.name || 'source'} for ${finalDilutionFactor}x dilution.`,
      });
    } else {
      const totalVolume = sample.volume + volumeNeeded;
      
      // Update concentration if we have one
      if (sample.concentration) {
        const newConcentration = calculateDilutedConcentration(sample.concentration, finalDilutionFactor);
        let newName = sample.name;
        if (!sample.name.includes('dilution')) {
          newName = `${sample.name} - ${finalDilutionFactor}x dilution`;
        }
        
        onUpdateSample?.(sample.id, { 
          volume: totalVolume, 
          concentration: newConcentration,
          name: newName
        });
      } else {
        onUpdateVolume(sample.id, totalVolume);
      }
      
      toast({
        title: "Sample Diluted",
        description: `Added ${volumeNeeded} μL for ${finalDilutionFactor}x dilution. New volume: ${totalVolume} μL`,
      });
    }

    setIsOpen(false);
    setSourceId('');
  };

  const generateRandomVolume = () => {
    const randomVolume = Math.round((Math.random() * 990 + 10) * 10) / 10;
    if (mode === 'add' || mode === 'dilute') {
      setVolumeToAdd(randomVolume.toString());
    } else {
      const currentVolume = sample.volume;
      const totalVolume = currentVolume + randomVolume;
      setNewVolume(totalVolume.toString());
    }
    
    toast({
      title: "Random Volume Generated",
      description: `Generated ${randomVolume} μL`,
    });
  };

  const currentConcentration = sample.weight && sample.volume > 0 
    ? calculateConcentration(sample.weight, sample.volume) 
    : sample.concentration;

  const getConcentrationPreview = () => {
    if (mode === 'add' && sourceId && sourceId !== 'manual' && parseFloat(volumeToAdd) > 0) {
      const source = samples.find(s => s.id === sourceId);
      const addVolume = parseFloat(volumeToAdd);
      const mixedConc = calculateMixedConcentration(
        sample.volume, 
        currentConcentration, 
        addVolume, 
        source?.concentration
      );
      return mixedConc;
    }
    
    if (mode === 'dilute' && parseFloat(volumeToAdd || customDilution) > 0) {
      const factor = dilutionType === 'preset' ? dilutionFactor : parseFloat(customDilution);
      if (currentConcentration && factor > 1) {
        return calculateDilutedConcentration(currentConcentration, factor);
      }
    }
    
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="border-blue-200 text-blue-700 hover:bg-blue-50"
        >
          <Beaker className="h-4 w-4 mr-1" />
          {sample.volume > 0 ? `${sample.volume}μL` : 'Add Volume'}
          {currentConcentration && (
            <span className="ml-1 text-xs">({currentConcentration} mg/mL)</span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Volume Management</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Mode Selection */}
          <div>
            <Label>Operation Mode</Label>
            <RadioGroup value={mode} onValueChange={(value: 'set' | 'add' | 'dilute') => setMode(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="set" id="set" />
                <Label htmlFor="set">Set total volume</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="add" id="add" />
                <Label htmlFor="add">Add volume</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dilute" id="dilute" />
                <Label htmlFor="dilute">Dilute sample</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Volume Source for all modes */}
          {availableSources.length > 0 && (
            <div>
              <Label htmlFor="source">Volume Source (Optional)</Label>
              <Select value={sourceId} onValueChange={setSourceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source sample or leave empty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual addition</SelectItem>
                  {availableSources.map(source => (
                    <SelectItem key={source.id} value={source.id}>
                      {source.name} ({source.volume} μL available)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {mode === 'set' && (
            <div className="space-y-2">
              <Label htmlFor="volume">Total Volume (μL)</Label>
              <div className="flex gap-2">
                <Input
                  id="volume"
                  type="number"
                  step="0.1"
                  value={newVolume}
                  onChange={(e) => setNewVolume(e.target.value)}
                  placeholder="Enter total volume in μL"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateRandomVolume}
                  className="px-3"
                >
                  <Dice6 className="h-4 w-4" />
                </Button>
              </div>
              {sample.weight && parseFloat(newVolume) > 0 && (
                <div className="text-sm text-gray-600">
                  New concentration: {calculateConcentration(sample.weight, parseFloat(newVolume))} mg/mL
                </div>
              )}
            </div>
          )}

          {mode === 'add' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="addVolume">Volume to Add (μL)</Label>
                <div className="flex gap-2">
                  <Input
                    id="addVolume"
                    type="number"
                    step="0.1"
                    value={volumeToAdd}
                    onChange={(e) => setVolumeToAdd(e.target.value)}
                    placeholder="Volume to add"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateRandomVolume}
                    className="px-3"
                  >
                    <Dice6 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {getConcentrationPreview() !== null && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-sm font-medium text-green-800">
                    New concentration: {getConcentrationPreview()} mg/mL
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    Final volume: {sample.volume + parseFloat(volumeToAdd || '0')} μL
                  </div>
                </div>
              )}
            </div>
          )}

          {mode === 'dilute' && (
            <div className="space-y-4">
              <div>
                <Label>Dilution Factor</Label>
                <RadioGroup value={dilutionType} onValueChange={(value: 'preset' | 'custom') => setDilutionType(value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="preset" id="preset" />
                    <Label htmlFor="preset">Preset dilutions</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="custom" id="custom" />
                    <Label htmlFor="custom">Custom dilution</Label>
                  </div>
                </RadioGroup>
              </div>

              {dilutionType === 'preset' && (
                <div className="grid grid-cols-4 gap-2">
                  {[2, 4, 8, 16].map(factor => (
                    <Button
                      key={factor}
                      variant={dilutionFactor === factor ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDilutionFactor(factor)}
                    >
                      {factor}x
                    </Button>
                  ))}
                </div>
              )}

              {dilutionType === 'custom' && (
                <div>
                  <Label htmlFor="customDilution">Custom Dilution Factor</Label>
                  <Input
                    id="customDilution"
                    type="number"
                    step="0.1"
                    min="1.1"
                    value={customDilution}
                    onChange={(e) => setCustomDilution(e.target.value)}
                    placeholder="Enter dilution factor (e.g., 3.5)"
                  />
                </div>
              )}

              {sample.volume > 0 && (dilutionType === 'preset' || parseFloat(customDilution) > 1) && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-sm">
                    <div>Current volume: {sample.volume} μL</div>
                    <div>Volume to add: {calculateVolumeNeeded(sample.volume, dilutionType === 'preset' ? dilutionFactor : parseFloat(customDilution))} μL</div>
                    <div>Final volume: {sample.volume + calculateVolumeNeeded(sample.volume, dilutionType === 'preset' ? dilutionFactor : parseFloat(customDilution))} μL</div>
                    {currentConcentration && (
                      <div>New concentration: {calculateDilutedConcentration(currentConcentration, dilutionType === 'preset' ? dilutionFactor : parseFloat(customDilution))} mg/mL</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={mode === 'set' ? handleVolumeUpdate : mode === 'add' ? handleAddVolume : handleDilution} 
              className="flex-1"
              disabled={
                (mode === 'set' && (!newVolume || parseFloat(newVolume) <= 0)) ||
                (mode === 'add' && (!volumeToAdd || parseFloat(volumeToAdd) <= 0)) ||
                (mode === 'dilute' && dilutionType === 'custom' && (!customDilution || parseFloat(customDilution) <= 1))
              }
            >
              {mode === 'set' ? 'Update Volume' : mode === 'add' ? 'Add Volume' : 'Apply Dilution'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
