import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { InstrumentConfigurationDialog, InstrumentConfig } from "./InstrumentConfigurationDialog";
import { Settings, Download, Upload, Save, ExternalLink, Plus, Trash2, Copy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { InstrumentListItem } from "./InstrumentListItem";

const STORAGE_KEY = "instrument-configurations";

// Dummy workload status per instrument
const getDummyWorkload = (instrumentId: string) => {
  // You can randomize or use fixed values, for demo purposes
  // In a real app, fetch these from backend/supabase!
  const base = {
    pending: Math.floor(Math.random() * 6),
    queued: Math.floor(Math.random() * 6),
    done: Math.floor(Math.random() * 10),
    inError: Math.floor(Math.random() * 2),
  };
  // Optionally provide deterministic dummy data for predictable UX
  if (instrumentId === "instr1") return { pending: 2, queued: 3, done: 7, inError: 0 };
  if (instrumentId === "instr2") return { pending: 1, queued: 2, done: 5, inError: 1 };
  if (instrumentId === "instr3") return { pending: 0, queued: 1, done: 3, inError: 0 };
  return base;
};

export const InstrumentManagementPanel: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [instruments, setInstruments] = useState<InstrumentConfig[]>([]);
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [editingInstrument, setEditingInstrument] = useState<InstrumentConfig | null>(null);

  // Load instruments from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setInstruments(JSON.parse(saved));
      } catch (error) {
        console.error("Failed to load instrument configurations:", error);
      }
    } else {
      // Initialize with default Agilent instruments
      const defaultInstruments: InstrumentConfig[] = [
        {
          id: 'instr1',
          name: 'Agilent 1290 Infinity II',
          ipAddress: '192.168.1.101',
          port: 80,
          model: '1290 Infinity II',
          serialNumber: 'AG1290001',
          status: 'online',
          labAssistUrl: 'http://192.168.1.101/labassist',
          settings: {}
        },
        {
          id: 'instr2',
          name: 'Agilent 1260 Infinity',
          ipAddress: '192.168.1.102',
          port: 80,
          model: '1260 Infinity',
          serialNumber: 'AG1260001',
          status: 'offline',
          labAssistUrl: 'http://192.168.1.102/labassist',
          settings: {}
        },
        {
          id: 'instr3',
          name: 'Agilent 1100 Series',
          ipAddress: '192.168.1.103',
          port: 80,
          model: '1100 Series',
          serialNumber: 'AG1100001',
          status: 'maintenance',
          labAssistUrl: 'http://192.168.1.103/labassist',
          settings: {}
        }
      ];
      setInstruments(defaultInstruments);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultInstruments));
    }
  }, []);

  const saveInstruments = (newInstruments: InstrumentConfig[]) => {
    setInstruments(newInstruments);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newInstruments));
  };

  const handleSelectAll = () => {
    if (selectedInstruments.length === instruments.length) {
      setSelectedInstruments([]);
    } else {
      setSelectedInstruments(instruments.map(i => i.id));
    }
  };

  const handleSelectInstrument = (instrumentId: string) => {
    setSelectedInstruments(prev => 
      prev.includes(instrumentId) 
        ? prev.filter(id => id !== instrumentId)
        : [...prev, instrumentId]
    );
  };

  const handleAddInstrument = () => {
    setEditingInstrument(null);
    setIsConfigDialogOpen(true);
  };

  const handleEditInstrument = (instrument: InstrumentConfig) => {
    setEditingInstrument(instrument);
    setIsConfigDialogOpen(true);
  };

  const handleSaveInstrument = (instrument: InstrumentConfig) => {
    if (editingInstrument) {
      // Update existing instrument
      const updatedInstruments = instruments.map(i => 
        i.id === instrument.id ? instrument : i
      );
      saveInstruments(updatedInstruments);
    } else {
      // Add new instrument
      const newInstrument = { ...instrument, id: `instr_${Date.now()}` };
      saveInstruments([...instruments, newInstrument]);
    }
  };

  const handleDeleteInstruments = () => {
    if (selectedInstruments.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select instruments to delete.",
        variant: "destructive"
      });
      return;
    }

    const updatedInstruments = instruments.filter(i => !selectedInstruments.includes(i.id));
    saveInstruments(updatedInstruments);
    setSelectedInstruments([]);
    
    toast({
      title: "Instruments Deleted",
      description: `${selectedInstruments.length} instrument(s) deleted successfully.`
    });
  };

  const handleExportSettings = () => {
    if (selectedInstruments.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select instruments to export settings.",
        variant: "destructive"
      });
      return;
    }

    const selectedData = instruments.filter(i => selectedInstruments.includes(i.id));
    const exportData = {
      timestamp: new Date().toISOString(),
      instruments: selectedData
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `instrument-settings-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Settings Exported",
      description: `Settings for ${selectedInstruments.length} instrument(s) exported successfully.`
    });
  };

  const handleImportSettings = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const importData = JSON.parse(e.target?.result as string);
            if (importData.instruments && Array.isArray(importData.instruments)) {
              // Merge imported instruments with existing ones
              const mergedInstruments = [...instruments];
              importData.instruments.forEach((imported: InstrumentConfig) => {
                const existingIndex = mergedInstruments.findIndex(i => i.id === imported.id);
                if (existingIndex >= 0) {
                  mergedInstruments[existingIndex] = imported;
                } else {
                  mergedInstruments.push({ ...imported, id: `imported_${Date.now()}_${Math.random()}` });
                }
              });
              saveInstruments(mergedInstruments);
              toast({
                title: "Settings Imported",
                description: `${importData.instruments.length} instrument configuration(s) imported successfully.`
              });
            } else {
              throw new Error("Invalid file format");
            }
          } catch (error) {
            toast({
              title: "Import Failed",
              description: "Failed to import settings. Please check the file format.",
              variant: "destructive"
            });
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleCreateBackup = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      version: "1.0",
      instruments: instruments,
      metadata: {
        totalInstruments: instruments.length,
        exportedBy: "Lab Management System"
      }
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lab-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Backup Created",
      description: "Complete system backup created successfully."
    });
  };

  const handleRestoreBackup = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const backupData = JSON.parse(e.target?.result as string);
            if (backupData.instruments && Array.isArray(backupData.instruments)) {
              saveInstruments(backupData.instruments);
              toast({
                title: "Backup Restored",
                description: `System restored from backup. ${backupData.instruments.length} instruments loaded.`
              });
            } else {
              throw new Error("Invalid backup format");
            }
          } catch (error) {
            toast({
              title: "Restore Failed",
              description: "Failed to restore backup. Please check the file format.",
              variant: "destructive"
            });
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleExportSupportFile = () => {
    const supportData = {
      timestamp: new Date().toISOString(),
      systemInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language
      },
      instruments: instruments.map(i => ({
        id: i.id,
        name: i.name,
        model: i.model,
        status: i.status,
        ipAddress: i.ipAddress,
        port: i.port
      })),
      diagnostics: {
        totalInstruments: instruments.length,
        onlineInstruments: instruments.filter(i => i.status === 'online').length,
        offlineInstruments: instruments.filter(i => i.status === 'offline').length,
        maintenanceInstruments: instruments.filter(i => i.status === 'maintenance').length
      }
    };

    const blob = new Blob([JSON.stringify(supportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `support-file-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Support File Created",
      description: "Diagnostic support file exported successfully."
    });
  };

  const handleCopySettings = () => {
    if (selectedInstruments.length !== 2) {
      toast({
        title: "Invalid Selection",
        description: "Please select exactly 2 instruments to copy settings between them.",
        variant: "destructive"
      });
      return;
    }

    const [sourceId, targetId] = selectedInstruments;
    const sourceInstrument = instruments.find(i => i.id === sourceId);
    const targetInstrument = instruments.find(i => i.id === targetId);

    if (sourceInstrument && targetInstrument) {
      const updatedInstruments = instruments.map(i => 
        i.id === targetId 
          ? { ...i, settings: { ...sourceInstrument.settings } }
          : i
      );
      saveInstruments(updatedInstruments);
      
      toast({
        title: "Settings Copied",
        description: `Settings copied from ${sourceInstrument.name} to ${targetInstrument.name}.`
      });
    }
  };

  const handleOpenLabAssist = (instrument: InstrumentConfig) => {
    if (instrument.labAssistUrl) {
      window.open(instrument.labAssistUrl, '_blank');
    } else {
      toast({
        title: "Lab Assist URL Not Set",
        description: "Please configure the Lab Assist URL for this instrument first.",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-100 text-green-800';
      case 'offline': return 'bg-gray-100 text-gray-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Add: Handle updating software for selected instruments
  const handleUpdateSoftware = () => {
    if (selectedInstruments.length === 0) {
      toast({
        title: "No Instruments Selected",
        description: "Please select instrument(s) to update software.",
        variant: "destructive",
      });
      return;
    }
    // Simulate updating each instrument
    const updatedInstruments = instruments.map(i =>
      selectedInstruments.includes(i.id)
        ? { ...i, softwareVersion: "v2.0 (updated)" }
        : i
    );
    saveInstruments(updatedInstruments);
    toast({
      title: "Software Update Complete",
      description: `Software updated for ${selectedInstruments.length} instrument(s).`,
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Instrument Management</span>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAddInstrument}>
              <Plus className="w-4 h-4 mr-2" />
              Add Instrument
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDeleteInstruments}
              disabled={selectedInstruments.length === 0}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleUpdateSoftware}
              disabled={selectedInstruments.length === 0}
            >
              <Upload className="w-4 h-4 mr-2" />
              Update Software
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Control Buttons */}
        <div className="flex flex-wrap gap-2 mb-4 p-4 bg-gray-50 rounded-lg">
          <Button size="sm" variant="outline" onClick={handleSelectAll}>
            {selectedInstruments.length === instruments.length ? 'Deselect All' : 'Select All'}
          </Button>
          <Button size="sm" variant="outline" onClick={handleCopySettings} disabled={selectedInstruments.length !== 2}>
            <Copy className="w-4 h-4 mr-2" />
            Copy Settings
          </Button>
          <Button size="sm" variant="outline" onClick={handleExportSettings} disabled={selectedInstruments.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export Settings
          </Button>
          <Button size="sm" variant="outline" onClick={handleImportSettings}>
            <Upload className="w-4 h-4 mr-2" />
            Import Settings
          </Button>
          <Button size="sm" variant="outline" onClick={handleExportSupportFile}>
            <Download className="w-4 h-4 mr-2" />
            Export Support File
          </Button>
          <Button size="sm" variant="outline" onClick={handleCreateBackup}>
            <Save className="w-4 h-4 mr-2" />
            Create Backup
          </Button>
          <Button size="sm" variant="outline" onClick={handleRestoreBackup}>
            <Upload className="w-4 h-4 mr-2" />
            Restore Backup
          </Button>
        </div>

        {/* Instruments List */}
        <div className="space-y-3">
          {instruments.map((instrument) =>
            <InstrumentListItem
              key={instrument.id}
              instrument={instrument}
              selected={selectedInstruments.includes(instrument.id)}
              onSelect={handleSelectInstrument}
              getWorkload={getDummyWorkload}
              onEdit={handleEditInstrument}
              onOpenLabAssist={handleOpenLabAssist}
            />
          )}
        </div>

        {instruments.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No instruments configured. Click "Add Instrument" to get started.
          </div>
        )}

        <InstrumentConfigurationDialog
          isOpen={isConfigDialogOpen}
          onClose={() => setIsConfigDialogOpen(false)}
          instrument={editingInstrument}
          onSave={handleSaveInstrument}
        />
      </CardContent>
    </Card>
  );
};

export default InstrumentManagementPanel;
