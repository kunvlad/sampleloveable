
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Info } from 'lucide-react';

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  properties: {
    [key: string]: any;
  };
}

interface GuidedWorkflowDisplayProps {
  currentStep: WorkflowStep;
  originalWorkflow?: any;
  onPropertyChange: (property: string, value: any) => void;
}

export const GuidedWorkflowDisplay: React.FC<GuidedWorkflowDisplayProps> = ({
  currentStep,
  originalWorkflow,
  onPropertyChange
}) => {
  const getOriginalValue = (property: string) => {
    if (!originalWorkflow) return null;
    
    // Look for the property in the original workflow
    const findInWorkflow = (obj: any, prop: string): any => {
      if (typeof obj !== 'object' || obj === null) return null;
      
      if (obj[prop] !== undefined) return obj[prop];
      
      for (const key in obj) {
        const result = findInWorkflow(obj[key], prop);
        if (result !== null) return result;
      }
      
      return null;
    };
    
    return findInWorkflow(originalWorkflow, property);
  };

  const renderPropertyInput = (property: string, value: any, type: string = 'text') => {
    const originalValue = getOriginalValue(property);
    
    return (
      <div key={property} className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor={property} className="capitalize">
            {property.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
          </Label>
          {originalValue !== null && (
            <Badge variant="outline" className="text-xs">
              <Info className="h-3 w-3 mr-1" />
              Original: {String(originalValue)}
            </Badge>
          )}
        </div>
        
        {type === 'textarea' ? (
          <Textarea
            id={property}
            value={value || ''}
            onChange={(e) => onPropertyChange(property, e.target.value)}
            placeholder={originalValue ? `Original: ${originalValue}` : `Enter ${property}`}
          />
        ) : type === 'select' ? (
          <Select value={value || ''} onValueChange={(val) => onPropertyChange(property, val)}>
            <SelectTrigger>
              <SelectValue placeholder={originalValue ? `Original: ${originalValue}` : `Select ${property}`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <Input
            id={property}
            type={type}
            value={value || ''}
            onChange={(e) => onPropertyChange(property, e.target.value)}
            placeholder={originalValue ? `Original: ${originalValue}` : `Enter ${property}`}
          />
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {currentStep.title}
          {originalWorkflow && (
            <Badge variant="secondary" className="text-xs">
              Based on original workflow
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-600">{currentStep.description}</p>
        
        <div className="grid gap-4">
          {Object.entries(currentStep.properties).map(([property, value]) => {
            // Determine input type based on property name and value
            let inputType = 'text';
            if (property.toLowerCase().includes('temperature')) inputType = 'number';
            if (property.toLowerCase().includes('time')) inputType = 'number';
            if (property.toLowerCase().includes('volume')) inputType = 'number';
            if (property.toLowerCase().includes('concentration')) inputType = 'number';
            if (property.toLowerCase().includes('description') || property.toLowerCase().includes('notes')) inputType = 'textarea';
            if (property.toLowerCase().includes('priority') || property.toLowerCase().includes('level')) inputType = 'select';
            
            return renderPropertyInput(property, value, inputType);
          })}
        </div>
        
        {originalWorkflow && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <Info className="h-4 w-4" />
              <span>Properties marked with "Original" show values from the loaded workflow</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
