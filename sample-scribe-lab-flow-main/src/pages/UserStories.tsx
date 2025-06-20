import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BookOpen, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface UserStory {
  id: string;
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Completed' | 'In Progress' | 'Planned';
  acceptanceCriteria: string[];
}

const UserStories: React.FC = () => {
  const userStories: UserStory[] = [
    {
      id: 'US001',
      title: 'Sample Weight Management',
      description: 'As a lab technician, I want to add weight measurements to samples so that I can calculate concentrations.',
      priority: 'High',
      status: 'Completed',
      acceptanceCriteria: [
        'Can enter weight manually',
        'Can get weight from connected balance',
        'Weight is displayed in sample tracker',
        'Concentration is automatically calculated when volume is present'
      ]
    },
    {
      id: 'US002',
      title: 'Volume Tracking with Digital Pipette',
      description: 'As a lab technician, I want to track sample volumes using a digital pipette simulation so that I can manage sample quantities accurately.',
      priority: 'High',
      status: 'Completed',
      acceptanceCriteria: [
        'Can add volume manually',
        'Can simulate pipette addition',
        'Can add random volumes for testing',
        'Volume changes update concentration calculations'
      ]
    },
    {
      id: 'US003',
      title: 'Sample Transfer Between Tubes',
      description: 'As a lab technician, I want to transfer specific volumes between sample tubes so that I can prepare samples for different analyses.',
      priority: 'High',
      status: 'Completed',
      acceptanceCriteria: [
        'Can specify transfer volume',
        'Can define target barcode',
        'Source volume is reduced appropriately',
        'Concentration is maintained in transferred sample'
      ]
    },
    {
      id: 'US004',
      title: 'Sample Splitting with Custom Volumes',
      description: 'As a lab technician, I want to split samples into aliquots with different volumes so that I can prepare samples for various tests.',
      priority: 'Medium',
      status: 'Completed',
      acceptanceCriteria: [
        'Can split into equal aliquots',
        'Can specify individual volumes for each aliquot',
        'Can define target barcodes for each aliquot',
        'Original sample volume is updated correctly'
      ]
    },
    {
      id: 'US005',
      title: 'HPLC Sequence Generation',
      description: 'As a lab technician, I want to generate HPLC sequences from selected samples so that I can run automated analyses.',
      priority: 'High',
      status: 'Completed',
      acceptanceCriteria: [
        'Can select samples using checkboxes',
        'Only selected samples appear in sequence',
        'Can export sequence as CSV',
        'Positions are automatically assigned'
      ]
    },
    {
      id: 'US006',
      title: 'Synchronized Sample Selection',
      description: 'As a lab technician, I want sample selection to be synchronized between tracker and history views so that I can easily manage sample groups.',
      priority: 'Medium',
      status: 'Completed',
      acceptanceCriteria: [
        'Selection in tracker updates history view',
        'Selection in history updates tracker view',
        'Visual feedback shows selected samples',
        'Bulk operations work with selected samples'
      ]
    },
    {
      id: 'US007',
      title: 'Sample History Visualization',
      description: 'As a lab technician, I want to see the complete history and relationships of my samples so that I can track sample lineage.',
      priority: 'Medium',
      status: 'Completed',
      acceptanceCriteria: [
        'Shows parent-child relationships',
        'Displays sample status and properties',
        'Expandable tree structure',
        'Shows transfer and split history'
      ]
    },
    {
      id: 'US008',
      title: 'Barcode Scanning Integration',
      description: 'As a lab technician, I want to scan barcodes to quickly add samples so that I can efficiently track new samples.',
      priority: 'Medium',
      status: 'Planned',
      acceptanceCriteria: [
        'Camera-based barcode scanning',
        'Manual barcode entry option',
        'Automatic sample creation',
        'Duplicate barcode prevention'
      ]
    },
    {
      id: 'US009',
      title: 'Advanced Sample Search',
      description: 'As a lab technician, I want to search and filter samples by various criteria so that I can quickly find specific samples.',
      priority: 'Low',
      status: 'Planned',
      acceptanceCriteria: [
        'Search by barcode, name, or properties',
        'Filter by status, date, or concentration',
        'Sort by different columns',
        'Export filtered results'
      ]
    },
    {
      id: 'US010',
      title: 'Sample Batch Operations',
      description: 'As a lab technician, I want to perform batch operations on multiple samples so that I can efficiently manage large sample sets.',
      priority: 'Medium',
      status: 'Planned',
      acceptanceCriteria: [
        'Bulk status updates',
        'Batch volume adjustments',
        'Group transfers',
        'Bulk export operations'
      ]
    },
    {
      id: 'US011',
      title: 'Enhanced Volume Management from Source',
      description: 'As a lab technician, I want to add volume from a source sample with automatic concentration calculations so that I can work with pre-liquids and dilutions.',
      priority: 'High',
      status: 'Completed',
      acceptanceCriteria: [
        'Can select source sample or leave empty',
        'Automatic concentration calculation for pre-liquids',
        'Proper dilution concentration updates in tracker and history',
        'Mixed concentration calculations when combining samples'
      ]
    },
    {
      id: 'US012',
      title: 'Enhanced Sample Splitting with Equal Splits',
      description: 'As a lab technician, I want a button to generate equal splits automatically so that I can quickly create uniform aliquots.',
      priority: 'Medium',
      status: 'Completed',
      acceptanceCriteria: [
        'Generate equal splits button',
        'Automatic volume calculation for equal distribution',
        'Maintains parent sample properties',
        'Updates sample tracker and history appropriately'
      ]
    },
    {
      id: 'US013',
      title: 'Enhanced Partial Merging with Volume Control',
      description: 'As a lab technician, I want to specify volumes for each sample during partial merging so that I can create precise mixed samples.',
      priority: 'High',
      status: 'Completed',
      acceptanceCriteria: [
        'Specify volume for each sample in partial merge',
        'Calculate concentrations for multi-compound samples',
        'Track different compounds separately',
        'Maintain original samples with reduced volumes'
      ]
    },
    {
      id: 'US014',
      title: 'Workflow Management with YAML Export/Import',
      description: 'As a lab technician, I want to save and load workflows as YAML files so that I can reproduce experimental procedures.',
      priority: 'High',
      status: 'Completed',
      acceptanceCriteria: [
        'Export activity log as YAML workflow',
        'Import and load saved workflows',
        'Start new workflow option',
        'Choose workflow in progress'
      ]
    },
    {
      id: 'US015',
      title: 'Dedicated Sample Relationship Graph Page',
      description: 'As a lab technician, I want a dedicated page for sample relationship visualization with zoom capabilities so that I can better understand sample dependencies.',
      priority: 'Medium',
      status: 'In Progress',
      acceptanceCriteria: [
        'Separate page for sample graph',
        'Zoom in and zoom out functionality',
        'Color scheme based on sample types',
        'Interactive graph navigation'
      ]
    },
    {
      id: 'US016',
      title: 'Guided Workflow Reproduction',
      description: 'As a lab technician, I want to reproduce loaded workflows through a guided interface so that I can follow experimental procedures step by step.',
      priority: 'High',
      status: 'In Progress',
      acceptanceCriteria: [
        'Guided workflow tab/page',
        'Step-by-step workflow execution',
        'Action prompts based on loaded workflow',
        'Progress tracking through workflow steps'
      ]
    },
    {
      id: 'US017',
      title: 'Enhanced Workflow Management Interface',
      description: 'As a lab technician, I want workflow management options at the beginning of my session so that I can easily start, continue, or load workflows.',
      priority: 'Medium',
      status: 'In Progress',
      acceptanceCriteria: [
        'Start new workflow option',
        'Choose workflow in progress',
        'Load existing workflow',
        'Clear workflow selection interface'
      ]
    }
  ];

  const getStatusIcon = (status: UserStory['status']) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'In Progress':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'Planned':
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusColor = (status: UserStory['status']) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'Planned':
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getPriorityColor = (priority: UserStory['priority']) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800';
      case 'Medium':
        return 'bg-orange-100 text-orange-800';
      case 'Low':
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            User Stories
          </h1>
          <p className="text-lg text-slate-600">
            Laboratory Sample Tracker Development Backlog
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {userStories.filter(story => story.status === 'Completed').length}
                  </div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {userStories.filter(story => story.status === 'In Progress').length}
                  </div>
                  <div className="text-sm text-gray-600">In Progress</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {userStories.filter(story => story.status === 'Planned').length}
                  </div>
                  <div className="text-sm text-gray-600">Planned</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Stories Table */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-6 w-6" />
              User Stories Backlog
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">ID</TableHead>
                  <TableHead>Story</TableHead>
                  <TableHead className="w-20">Priority</TableHead>
                  <TableHead className="w-32">Status</TableHead>
                  <TableHead>Acceptance Criteria</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userStories.map((story) => (
                  <TableRow key={story.id}>
                    <TableCell className="font-mono text-sm">
                      {story.id}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium mb-1">{story.title}</div>
                        <div className="text-sm text-gray-600">{story.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(story.priority)}>
                        {story.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(story.status)}
                        <Badge className={getStatusColor(story.status)}>
                          {story.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <ul className="text-sm space-y-1">
                        {story.acceptanceCriteria.map((criteria, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <div className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                            <span>{criteria}</span>
                          </li>
                        ))}
                      </ul>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserStories;
