
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sample } from '@/types/sample';
import { Edit, Smile } from 'lucide-react';
import { generateFunnyName } from '@/utils/funnyNames';

interface EditSampleDialogProps {
  sample: Sample | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (sampleId: string, updates: { name: string; sampleType: Sample['sampleType'] }) => void;
}

export const EditSampleDialog: React.FC<EditSampleDialogProps> = ({
  sample,
  isOpen,
  onClose,
  onSave
}) => {
  const [name, setName] = useState('');
  const [sampleType, setSampleType] = useState<Sample['sampleType']>('unknown');

  React.useEffect(() => {
    if (sample) {
      setName(sample.name);
      setSampleType(sample.sampleType);
    }
  }, [sample]);

  const handleSave = () => {
    if (sample && name.trim()) {
      onSave(sample.id, { name: name.trim(), sampleType });
      onClose();
    }
  };

  const generateFunnySampleName = () => {
    setName(generateFunnyName());
  };

  if (!sample) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-blue-600" />
            Edit Sample
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            Barcode: {sample.barcode}
          </div>

          <div>
            <Label htmlFor="editName">Sample Name</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="editName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter sample name"
                onKeyPress={(e) => e.key === 'Enter' && handleSave()}
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
            <Label htmlFor="editSampleType">Sample Type</Label>
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

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!name.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
