
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sample } from '@/types/sample';
import { ArrowRight, Shuffle, Dice6 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TransferDialogProps {
  sample: Sample;
  // Added targetName parameter
  onTransfer: (sourceId: string, targetBarcode: string, volumeToTransfer: number, targetName: string) => void;
  children: React.ReactNode;
}

export const TransferDialog: React.FC<TransferDialogProps> = ({
  sample,
  onTransfer,
  children
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [targetBarcode, setTargetBarcode] = useState('');
  const [targetName, setTargetName] = useState('');
  const [volumeToTransfer, setVolumeToTransfer] = useState('');
  const { toast } = useToast();

  // Prefilled name for the target sample
  React.useEffect(() => {
    if (isOpen) {
      setTargetName(`${sample.name} Transfer`);
    }
  }, [isOpen, sample.name]);

  const generateBarcode = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 5);
    const barcode = `T${timestamp}${random}`.toUpperCase();
    setTargetBarcode(barcode);
  };

  const generateRandomVolume = () => {
    const maxVolume = sample.volume - 0.1;
    const randomVolume = Math.round((Math.random() * (maxVolume - 10) + 10) * 10) / 10;
    setVolumeToTransfer(Math.min(randomVolume, maxVolume).toString());
  };

  // Updated to include name
  const handleTransfer = () => {
    const volume = parseFloat(volumeToTransfer);

    if (!targetBarcode.trim()) {
      toast({
        title: "Missing Barcode",
        description: "Please enter a target barcode.",
        variant: "destructive"
      });
      return;
    }

    if (!targetName.trim()) {
      toast({
        title: "Missing Name",
        description: "Please enter a target sample name.",
        variant: "destructive"
      });
      return;
    }

    if (isNaN(volume) || volume <= 0) {
      toast({
        title: "Invalid Volume",
        description: "Please enter a valid volume to transfer.",
        variant: "destructive"
      });
      return;
    }

    if (volume >= sample.volume) {
      toast({
        title: "Insufficient Volume",
        description: "Transfer volume cannot be greater than or equal to available volume.",
        variant: "destructive"
      });
      return;
    }

    // Pass name!
    onTransfer(sample.id, targetBarcode, volume, targetName);
    setTargetBarcode('');
    setTargetName('');
    setVolumeToTransfer('');
    setIsOpen(false);
  };

  const remainingVolume = sample.volume - parseFloat(volumeToTransfer || '0');

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer Sample</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            From: {sample.name} ({sample.barcode})
            <br />
            Available volume: {sample.volume} μL
            {sample.concentration && (
              <span> | Concentration: {sample.concentration} mg/mL</span>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetName">Target Sample Name</Label>
            <Input
              id="targetName"
              value={targetName}
              onChange={(e) => setTargetName(e.target.value)}
              placeholder="Enter new sample name"
              className="flex-1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetBarcode">Target Barcode</Label>
            <div className="flex gap-2">
              <Input
                id="targetBarcode"
                value={targetBarcode}
                onChange={(e) => setTargetBarcode(e.target.value)}
                placeholder="Enter target sample barcode"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateBarcode}
                className="px-3"
              >
                <Shuffle className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transferVolume">Volume to Transfer (μL)</Label>
            <div className="flex gap-2">
              <Input
                id="transferVolume"
                type="number"
                step="0.1"
                value={volumeToTransfer}
                onChange={(e) => setVolumeToTransfer(e.target.value)}
                placeholder="Enter volume to transfer"
                max={sample.volume - 0.1}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateRandomVolume}
                className="px-3"
              >
                <Dice6 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {parseFloat(volumeToTransfer || '0') > 0 && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="text-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium">Transfer Preview:</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <div className="font-medium text-gray-900">Source</div>
                    <div>Remaining: {remainingVolume.toFixed(1)} μL</div>
                  </div>
                  <div className="flex items-center justify-center">
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-gray-900">Target</div>
                    <div>Volume: {volumeToTransfer} μL</div>
                    <div>Name: {targetName}</div>
                    {sample.concentration && (
                      <div>Conc: {sample.concentration} mg/mL</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <Button 
            onClick={handleTransfer} 
            className="w-full"
            disabled={!targetBarcode || !targetName || !volumeToTransfer || parseFloat(volumeToTransfer || '0') <= 0}
          >
            Transfer Sample
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

