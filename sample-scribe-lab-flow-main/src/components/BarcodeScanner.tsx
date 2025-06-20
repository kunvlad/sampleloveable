
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sample } from '@/types/sample';
import { Scan, Hash, Smile } from 'lucide-react';
import { generateFunnyName } from '@/utils/funnyNames';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string, name: string, sampleType: Sample['sampleType']) => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  isOpen,
  onClose,
  onScan
}) => {
  const [manualBarcode, setManualBarcode] = useState('');
  const [sampleName, setSampleName] = useState('');
  const [sampleType, setSampleType] = useState<Sample['sampleType']>('unknown');

  const handleScan = () => {
    if (manualBarcode.trim() && sampleName.trim()) {
      onScan(manualBarcode.trim(), sampleName.trim(), sampleType);
      setManualBarcode('');
      setSampleName('');
      setSampleType('unknown');
      onClose();
    }
  };

  const generateRandomBarcode = () => {
    const barcode = Math.random().toString().substr(2, 8);
    setManualBarcode(barcode);
  };

  const generateFunnySampleName = () => {
    setSampleName(generateFunnyName());
  };

  const formatSampleType = (sampleType: Sample['sampleType']) => {
    return sampleType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5 text-blue-600" />
            Barcode Scanner
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Scanner Simulation */}
          <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
            <Scan className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-4">Position barcode within the frame</p>
            <div className="animate-pulse bg-blue-100 h-2 w-3/4 mx-auto rounded"></div>
          </div>

          {/* Manual Entry */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="flex-1 h-px bg-gray-300"></div>
              <span>or enter manually</span>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>

            <div>
              <Label htmlFor="barcode">Barcode</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="barcode"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  placeholder="Enter or scan barcode"
                  onKeyPress={(e) => e.key === 'Enter' && handleScan()}
                />
                <Button
                  variant="outline"
                  onClick={generateRandomBarcode}
                  className="px-3"
                >
                  <Hash className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="sampleName">Sample Name</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="sampleName"
                  value={sampleName}
                  onChange={(e) => setSampleName(e.target.value)}
                  placeholder="Enter sample name"
                  onKeyPress={(e) => e.key === 'Enter' && handleScan()}
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

            <div>
              <Label htmlFor="sampleType">Sample Type</Label>
              <Select value={sampleType} onValueChange={(value) => setSampleType(value as Sample['sampleType'])}>
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

            <p className="text-xs text-gray-500">
              Tip: Click the # button to generate a sample barcode or the 😊 button for a funny name
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleScan} 
              disabled={!manualBarcode.trim() || !sampleName.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Add Sample
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
