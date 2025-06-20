import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sample } from '@/types/sample';
import { Network, Shuffle, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface SampleGraphProps {
  samples: Sample[];
}

interface Node {
  id: string;
  label: string;
  color: string;
  shape: string;
  title: string;
  sampleType: Sample['sampleType'];
}

interface Edge {
  from: string;
  to: string;
  label: string;
  color: string;
}

export const SampleGraph: React.FC<SampleGraphProps> = ({ samples }) => {
  const graphRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = React.useState(1);

  const getSampleTypeColor = (sampleType: Sample['sampleType']) => {
    switch (sampleType) {
      case 'blank': return '#6B7280'; // gray
      case 'system-suitability': return '#3B82F6'; // blue  
      case 'control': return '#10B981'; // green
      case 'calibration': return '#F59E0B'; // orange
      case 'unknown': return '#8B5CF6'; // purple
      case 'sample': return '#EF4444'; // red
      default: return '#9CA3AF'; // gray
    }
  };

  const getStatusColor = (sample: Sample) => {
    switch (sample.status) {
      case 'created': return '#3B82F6'; // blue
      case 'imported': return '#6366F1'; // indigo or any color for imported
      case 'prepared': return '#10B981'; // green
      case 'analyzed': return '#8B5CF6'; // purple
      case 'split': return '#F59E0B'; // orange
      case 'merged': return '#6B7280'; // gray
      case 'transferred': return '#EF4444'; // red
      default: return '#9CA3AF'; // gray
    }
  };

  const getSampleTypeShape = (sampleType: Sample['sampleType']) => {
    switch (sampleType) {
      case 'blank': return 'box';
      case 'control': return 'diamond';
      case 'calibration': return 'star';
      case 'sample': return 'dot';
      case 'system-suitability': return 'triangle';
      default: return 'circle';
    }
  };

  const createGraphData = () => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    samples.forEach(sample => {
      nodes.push({
        id: sample.id,
        label: `${sample.name}\n(${sample.barcode})`,
        color: getSampleTypeColor(sample.sampleType),
        shape: getSampleTypeShape(sample.sampleType),
        sampleType: sample.sampleType,
        title: `
          Name: ${sample.name}
          Barcode: ${sample.barcode}
          Type: ${sample.sampleType}
          Status: ${sample.status}
          Volume: ${sample.volume} μL
          ${sample.concentration ? `Concentration: ${sample.concentration} mg/mL` : ''}
          ${sample.weight ? `Weight: ${sample.weight} mg` : ''}
          Created: ${sample.createdAt.toLocaleDateString()}
        `.trim()
      });

      // Regular parent dependency (split, transferred, etc)
      if (sample.parentId) {
        const parent = samples.find(s => s.id === sample.parentId);
        if (parent) {
          const relationship = sample.status === 'transferred' ? 'transferred from' :
                             sample.status === 'prepared' && parent.status === 'split' ? 'split from' :
                             'derived from';
          
          edges.push({
            from: sample.parentId,
            to: sample.id,
            label: relationship,
            color: getStatusColor(sample)
          });
        }
      }
    });

    // For merged samples, show all inputs as dependencies.
    samples.forEach(mergedSample => {
      if (mergedSample.status === 'merged') {
        // Try to get dependencyIds from the mergedSample (which TS knows as Sample and does not have metadata as required field)
        let dependencyIds: string[] = [];
        // @ts-expect-error: handle loose structure, may include dependencyIds or metadata
        if (Array.isArray(mergedSample.dependencyIds)) {
          // @ts-expect-error
          dependencyIds = mergedSample.dependencyIds;
        // @ts-expect-error
        } else if (mergedSample.metadata && Array.isArray(mergedSample.metadata.inputSampleIds)) {
          // @ts-expect-error
          dependencyIds = mergedSample.metadata.inputSampleIds;
        }
        if (dependencyIds.length > 0) {
          dependencyIds.forEach(inputId => {
            if (samples.some(s => s.id === inputId)) {
              edges.push({
                from: inputId,
                to: mergedSample.id,
                label: 'merged into',
                color: '#8B5CF6'
              });
            }
          });
        }
      }
    });

    return { nodes, edges };
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev / 1.2, 0.3));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  useEffect(() => {
    if (!graphRef.current) return;

    const { nodes, edges } = createGraphData();
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '500');
    svg.setAttribute('viewBox', `0 0 ${800 * zoomLevel} ${500 * zoomLevel}`);
    svg.style.cursor = 'grab';
    
    // Clear previous content
    graphRef.current.innerHTML = '';
    graphRef.current.appendChild(svg);

    // Simple grid layout
    const cols = Math.ceil(Math.sqrt(nodes.length));
    const cellWidth = (800 * zoomLevel) / cols;
    const cellHeight = (500 * zoomLevel) / Math.ceil(nodes.length / cols);

    // Add arrow marker definition
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', 'arrowhead');
    marker.setAttribute('markerWidth', '10');
    marker.setAttribute('markerHeight', '7');
    marker.setAttribute('refX', '9');
    marker.setAttribute('refY', '3.5');
    marker.setAttribute('orient', 'auto');
    
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
    polygon.setAttribute('fill', '#6B7280');
    
    marker.appendChild(polygon);
    defs.appendChild(marker);
    svg.appendChild(defs);

    // Draw edges first (so they appear behind nodes)
    edges.forEach(edge => {
      const fromNode = nodes.find(n => n.id === edge.from);
      const toNode = nodes.find(n => n.id === edge.to);
      if (!fromNode || !toNode) return;

      const fromIndex = nodes.indexOf(fromNode);
      const toIndex = nodes.indexOf(toNode);
      
      const fromX = (fromIndex % cols) * cellWidth + cellWidth / 2;
      const fromY = Math.floor(fromIndex / cols) * cellHeight + cellHeight / 2;
      const toX = (toIndex % cols) * cellWidth + cellWidth / 2;
      const toY = Math.floor(toIndex / cols) * cellHeight + cellHeight / 2;

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', fromX.toString());
      line.setAttribute('y1', fromY.toString());
      line.setAttribute('x2', toX.toString());
      line.setAttribute('y2', toY.toString());
      line.setAttribute('stroke', edge.color);
      line.setAttribute('stroke-width', '2');
      line.setAttribute('marker-end', 'url(#arrowhead)');
      svg.appendChild(line);

      // Add edge label
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', ((fromX + toX) / 2).toString());
      text.setAttribute('y', ((fromY + toY) / 2).toString());
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', (10 * zoomLevel).toString());
      text.setAttribute('fill', '#6B7280');
      text.textContent = edge.label;
      svg.appendChild(text);
    });

    // Draw nodes
    nodes.forEach((node, index) => {
      const x = (index % cols) * cellWidth + cellWidth / 2;
      const y = Math.floor(index / cols) * cellHeight + cellHeight / 2;

      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.setAttribute('transform', `translate(${x}, ${y})`);

      // Node shape
      let shape;
      const size = 20 * zoomLevel;
      
      if (node.shape === 'box') {
        shape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        shape.setAttribute('x', (-size).toString());
        shape.setAttribute('y', (-size * 0.75).toString());
        shape.setAttribute('width', (size * 2).toString());
        shape.setAttribute('height', (size * 1.5).toString());
      } else if (node.shape === 'diamond') {
        shape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        shape.setAttribute('points', `0,-${size} ${size},0 0,${size} -${size},0`);
      } else if (node.shape === 'triangle') {
        shape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        shape.setAttribute('points', `0,-${size} ${size * 0.866},${size * 0.5} -${size * 0.866},${size * 0.5}`);
      } else {
        shape = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        shape.setAttribute('r', size.toString());
      }
      
      shape.setAttribute('fill', node.color);
      shape.setAttribute('stroke', '#fff');
      shape.setAttribute('stroke-width', (2 * zoomLevel).toString());
      
      // Add title for tooltip
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = node.title;
      shape.appendChild(title);
      
      group.appendChild(shape);

      // Node label
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', (8 * zoomLevel).toString());
      text.setAttribute('fill', '#fff');
      text.setAttribute('dy', '0.35em');
      
      const lines = node.label.split('\n');
      lines.forEach((line, lineIndex) => {
        const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
        tspan.setAttribute('x', '0');
        tspan.setAttribute('dy', lineIndex === 0 ? '0' : (10 * zoomLevel).toString());
        tspan.textContent = line;
        text.appendChild(tspan);
      });
      
      group.appendChild(text);
      svg.appendChild(group);
    });

  }, [samples, zoomLevel]);

  return (
    <Card className="h-fit">
      <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Network className="h-6 w-6" />
            Sample Relationship Graph
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleZoomOut}
              className="text-white border-white/20 hover:bg-white/10"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleResetZoom}
              className="text-white border-white/20 hover:bg-white/10"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleZoomIn}
              className="text-white border-white/20 hover:bg-white/10"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {samples.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Shuffle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">No samples to visualize</p>
            <p className="text-sm">Add samples to see their relationships</p>
          </div>
        ) : (
          <div className="w-full h-[500px] border border-gray-200 rounded-lg overflow-hidden">
            <div ref={graphRef} className="w-full h-full" />
          </div>
        )}
        
        <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
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
            <h4 className="font-semibold mb-2">Node Shapes (Type)</h4>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span>Circle: Unknown</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-400"></div>
                <span>Square: Blank</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span>Dot: Sample</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-2 bg-gray-400 transform rotate-45"></div>
                <span>Diamond: Control</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 text-center text-sm text-gray-600">
          Zoom: {Math.round(zoomLevel * 100)}% | Use controls above to zoom in/out or reset
        </div>
      </CardContent>
    </Card>
  );
};
