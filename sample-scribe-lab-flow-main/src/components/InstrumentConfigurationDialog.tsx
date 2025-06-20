
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export type InstrumentConfig = {
  id: string;
  name: string;
  ipAddress: string;
  port: number;
  model: string;
  serialNumber: string;
  status: 'online' | 'offline' | 'maintenance';
  labAssistUrl: string;
  settings: Record<string, any>;
};

type InstrumentConfigurationDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  instrument: InstrumentConfig | null;
  onSave: (instrument: InstrumentConfig) => void;
};

export const InstrumentConfigurationDialog: React.FC<InstrumentConfigurationDialogProps> = ({
  isOpen,
  onClose,
  instrument,
  onSave
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<InstrumentConfig>({
    id: instrument?.id || '',
    name: instrument?.name || '',
    ipAddress: instrument?.ipAddress || '',
    port: instrument?.port || 80,
    model: instrument?.model || '',
    serialNumber: instrument?.serialNumber || '',
    status: instrument?.status || 'offline',
    labAssistUrl: instrument?.labAssistUrl || '',
    settings: instrument?.settings || {}
  });

  const handleSave = () => {
    if (!formData.name || !formData.ipAddress) {
      toast({
        title: "Validation Error",
        description: "Name and IP Address are required",
        variant: "destructive"
      });
      return;
    }

    onSave(formData);
    toast({
      title: "Instrument Saved",
      description: `Configuration for ${formData.name} has been saved successfully.`
    });
    onClose();
  };

  const testConnection = async () => {
    toast({
      title: "Testing Connection",
      description: `Attempting to connect to ${formData.ipAddress}:${formData.port}...`
    });
    
    // Simulate connection test
    setTimeout(() => {
      toast({
        title: "Connection Test",
        description: "Connection test completed. Check instrument status for results.",
        variant: Math.random() > 0.5 ? "default" : "destructive"
      });
    }, 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {instrument ? 'Configure Instrument' : 'Add New Instrument'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Instrument Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Agilent 1290 Infinity II"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Input
              id="model"
              value={formData.model}
              onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
              placeholder="e.g., 1290 Infinity II"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="ipAddress">IP Address</Label>
            <Input
              id="ipAddress"
              value={formData.ipAddress}
              onChange={(e) => setFormData(prev => ({ ...prev, ipAddress: e.target.value }))}
              placeholder="192.168.1.100"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="port">Port</Label>
            <Input
              id="port"
              type="number"
              value={formData.port}
              onChange={(e) => setFormData(prev => ({ ...prev, port: parseInt(e.target.value) }))}
              placeholder="80"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="serialNumber">Serial Number</Label>
            <Input
              id="serialNumber"
              value={formData.serialNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, serialNumber: e.target.value }))}
              placeholder="ABC123456"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
            >
              <option value="offline">Offline</option>
              <option value="online">Online</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
          
          <div className="col-span-2 space-y-2">
            <Label htmlFor="labAssistUrl">Lab Assist URL</Label>
            <Input
              id="labAssistUrl"
              value={formData.labAssistUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, labAssistUrl: e.target.value }))}
              placeholder="http://192.168.1.100/labassist"
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={testConnection}>
            Test Connection
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
