import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sample } from '@/types/sample';
import { ArrowLeft, GitBranch, Download, RefreshCw } from 'lucide-react';
import mermaid from 'mermaid';
import { useToast } from '@/hooks/use-toast';

// Util for getting samples from localStorage
const getSamples = (): Sample[] => {
  const saved = localStorage.getItem('lab-samples');
  if (saved) {
    const parsedSamples = JSON.parse(saved);
    return parsedSamples.map((sample: any) => ({
      ...sample,
      createdAt: new Date(sample.createdAt)
    }));
  }
  return [];
};

const generateMermaidChart = (samples: Sample[]) => {
  if (samples.length === 0) return '';

  let chart = 'flowchart TD\n';
  // ClassDef definitions
  chart += '    classDef blank fill:#6B7280,stroke:#374151,color:#fff\n';
  chart += '    classDef systemSuit fill:#3B82F6,stroke:#1E40AF,color:#fff\n';
  chart += '    classDef control fill:#10B981,stroke:#047857,color:#fff\n';
  chart += '    classDef calibration fill:#F59E0B,stroke:#D97706,color:#fff\n';
  chart += '    classDef unknown fill:#8B5CF6,stroke:#7C3AED,color:#fff\n';
  chart += '    classDef sample fill:#EF4444,stroke:#DC2626,color:#fff\n';
  
  // User friendly node names: just show the sample name, keep IDs unique
  samples.forEach(sample => {
    const nodeId = `S${sample.id.replace(/-/g, '')}`;
    const label = `${sample.name}`;
    chart += `    ${nodeId}["${label}"]\n`;
  });

  // Relations (same as before)
  samples.forEach(sample => {
    const childId = `S${sample.id.replace(/-/g, '')}`;
    let dependencyIds: string[] = [];
    if (sample.status === "merged") {
      // @ts-expect-error: possible prop
      if (Array.isArray(sample.dependencyIds)) dependencyIds = sample.dependencyIds;
      // @ts-expect-error: possible prop
      else if (sample.metadata && Array.isArray(sample.metadata.inputSampleIds)) dependencyIds = sample.metadata.inputSampleIds;
      dependencyIds.forEach(depId => {
        const parentId = `S${depId.replace(/-/g, '')}`;
        if (depId !== sample.id && samples.some(s => s.id === depId)) {
          chart += `    ${parentId} -->|merged| ${childId}\n`;
        }
      });
    }
    if (sample.parentId) {
      const parentId = `S${sample.parentId.replace(/-/g, '')}`;
      const relationship =
        sample.status === 'transferred'
          ? 'transferred'
          : sample.status === 'prepared'
          ? 'split'
          : sample.status === 'merged'
          ? 'merged'
          : 'derived';
      chart += `    ${parentId} -->|${relationship}| ${childId}\n`;
    }
  });

  // Class assignments
  samples.forEach(sample => {
    const nodeId = `S${sample.id.replace(/-/g, '')}`;
    const className = sample.sampleType === 'blank' ? 'blank' :
                     sample.sampleType === 'system-suitability' ? 'systemSuit' :
                     sample.sampleType === 'control' ? 'control' :
                     sample.sampleType === 'calibration' ? 'calibration' :
                     sample.sampleType === 'unknown' ? 'unknown' :
                     'sample';
    chart += `    class ${nodeId} ${className}\n`;
  });

  return chart;
};

const MermaidGraphPage: React.FC = () => {
  const mermaidRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [samples, setSamples] = useState<Sample[]>(getSamples());

  // Only render when Refresh is pressed, not live
  const renderMermaid = (samplesParam = samples) => {
    if (!mermaidRef.current || samplesParam.length === 0) {
      if (mermaidRef.current) mermaidRef.current.innerHTML = '';
      return;
    }

    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: false,
        curve: 'basis'
      }
    });

    const chartDefinition = generateMermaidChart(samplesParam);
    mermaidRef.current.innerHTML = '';
    mermaid.render('mermaid-chart', chartDefinition).then(({ svg }) => {
      if (mermaidRef.current) {
        mermaidRef.current.innerHTML = svg;
      }
    }).catch(error => {
      console.error('Error rendering mermaid chart:', error);
      if (mermaidRef.current) {
        mermaidRef.current.innerHTML = '<p class="text-red-500">Error rendering chart</p>';
      }
    });
  };

  // Initial render only (no real-time effect)
  React.useEffect(() => {
    renderMermaid(samples);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = () => {
    const newSamples = getSamples();
    setSamples(newSamples);
    renderMermaid(newSamples);
    toast({
      title: "Sample Flowchart Updated",
      description: "Graph refreshed with the latest sample data.",
    });
  };

  const downloadMermaidChart = () => {
    const chartDefinition = generateMermaidChart(samples);
    const blob = new Blob([chartDefinition], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sample-flowchart-${new Date().toISOString().split('T')[0]}.mmd`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Refresh Button */}
        <div className="flex justify-end mb-4">
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-100"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Graph
          </Button>
        </div>
        {/* Mermaid Chart */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GitBranch className="h-6 w-6" />
                Sample Flowchart
              </div>
              <button 
                className="bg-white/10 text-white border-white/20 hover:bg-white/20 rounded px-3 py-1 flex items-center gap-2 transition disabled:bg-gray-200 disabled:text-gray-400"
                onClick={downloadMermaidChart}
                disabled={samples.length === 0}
                style={{ fontSize: "0.9rem" }}
              >
                <Download className="h-4 w-4 mr-1" />
                Download .mmd
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {samples.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No samples to visualize</p>
                <p className="text-sm">Add samples to see their flowchart</p>
              </div>
            ) : (
              <div className="w-full">
                <div ref={mermaidRef} className="w-full flex justify-center" />
              </div>
            )}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Sample Types (Colors)</h4>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-500 rounded"></div>
                    <span>Blank</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span>System Suitability</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span>Control</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded"></div>
                    <span>Calibration</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-500 rounded"></div>
                    <span>Unknown</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span>Sample</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Features</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Manual refresh with latest data</li>
                  <li>• User-friendly node names</li>
                  <li>• Color-coded by sample type</li>
                  <li>• Shows relationship labels</li>
                  <li>• Exportable as .mmd file</li>
                  <li>• Optimized for documentation</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MermaidGraphPage;
