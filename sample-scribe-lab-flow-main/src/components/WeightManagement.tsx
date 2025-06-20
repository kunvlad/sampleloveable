import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sample } from '@/types/sample';
import { Weight, Scale } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WeightManagementProps {
  sample: Sample;
  onUpdateWeight: (sampleId: string, weight: number) => void;
}

export const WeightManagement: React.FC<WeightManagementProps> = ({
  sample,
  onUpdateWeight
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [manualWeight, setManualWeight] = useState('');
  const [isWeighing, setIsWeighing] = useState(false);
  const { toast } = useToast();

  const handleManualWeight = () => {
    const weight = parseFloat(manualWeight);
    if (isNaN(weight) || weight <= 0) {
      toast({
        title: "Invalid Weight",
        description: "Please enter a valid weight value.",
        variant: "destructive"
      });
      return;
    }

    onUpdateWeight(sample.id, weight);
    setManualWeight('');
    setIsOpen(false);
    toast({
      title: "Weight Added",
      description: `Sample weight set to ${weight} mg.`,
    });
  };

  const handleBalanceWeight = () => {
    setIsWeighing(true);
    
    // 🚀 Make balance super fast (was 2000ms, now 50ms)
    setTimeout(() => {
      // Simulate a random weight between 10-100 mg
      const simulatedWeight = Math.round((Math.random() * 90 + 10) * 100) / 100;
      onUpdateWeight(sample.id, simulatedWeight);
      setIsWeighing(false);
      setIsOpen(false);
      toast({
        title: "Weight from Balance",
        description: `Sample weight measured: ${simulatedWeight} mg from connected balance.`,
      });
    }, 50);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="border-purple-200 text-purple-700 hover:bg-purple-50"
        >
          <Weight className="h-4 w-4 mr-1" />
          {sample.weight ? `${sample.weight} mg` : 'Add Weight'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sample Weight Management</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="text-sm text-gray-600">
            Sample: {sample.name} ({sample.barcode})
          </div>

          {sample.weight && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-sm font-medium text-green-800">
                Current Weight: {sample.weight} mg
              </div>
            </div>
          )}

          {/* Manual Weight Entry */}
          <div className="space-y-3">
            <Label htmlFor="manual-weight">Manual Weight Entry</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  id="manual-weight"
                  type="number"
                  step="0.01"
                  placeholder="Enter weight in mg"
                  value={manualWeight}
                  onChange={(e) => setManualWeight(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleManualWeight}
                disabled={!manualWeight}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Set Weight
              </Button>
            </div>
          </div>

          {/* Balance Connection */}
          <div className="border-t pt-4">
            <div className="space-y-3">
              <Label>Connected Balance</Label>
              <Button 
                onClick={handleBalanceWeight}
                disabled={isWeighing}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                <Scale className="h-4 w-4 mr-2" />
                {isWeighing ? 'Reading from Balance...' : 'Get Weight from Balance (10-100 mg)'}
              </Button>
              {isWeighing && (
                <div className="text-sm text-gray-600 text-center">
                  Please place sample on balance and wait...
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
