
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ActivityLogEntry } from '@/types/sample';
import { ArrowLeft, Activity, Calendar, User, FileText } from 'lucide-react';

const ActivityLog = () => {
  // Load activity log from localStorage with proper date conversion
  const activityLog: ActivityLogEntry[] = React.useMemo(() => {
    const saved = localStorage.getItem('lab-activity-log');
    if (saved) {
      const parsedLog = JSON.parse(saved);
      return parsedLog.map((entry: any) => ({
        ...entry,
        timestamp: new Date(entry.timestamp)
      }));
    }
    return [];
  }, []);

  const getActionColor = (action: ActivityLogEntry['action']) => {
    switch (action) {
      case 'created': return 'bg-green-100 text-green-800';
      case 'split': return 'bg-orange-100 text-orange-800';
      case 'merged': return 'bg-blue-100 text-blue-800';
      case 'transferred': return 'bg-purple-100 text-purple-800';
      case 'weight_added': return 'bg-yellow-100 text-yellow-800';
      case 'volume_added': return 'bg-cyan-100 text-cyan-800';
      case 'renamed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatAction = (action: ActivityLogEntry['action']) => {
    return action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link to="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Tracker
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-slate-800">Activity Log</h1>
          </div>
          <p className="text-lg text-slate-600">
            Complete history of all sample operations and changes
          </p>
        </div>

        {/* Activity Log */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-6 w-6" />
              Sample Activity Log
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {activityLog.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No Activity Yet</h3>
                <p>Sample operations will appear here as they happen</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-32">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Timestamp
                        </div>
                      </TableHead>
                      <TableHead className="w-24">Action</TableHead>
                      <TableHead className="w-32">Sample</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activityLog.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-mono text-sm">
                          {entry.timestamp.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={getActionColor(entry.action)}>
                            {formatAction(entry.action)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono">
                          {entry.sampleBarcode}
                        </TableCell>
                        <TableCell>{entry.details}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ActivityLog;
