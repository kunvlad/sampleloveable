
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sample, ActivityLogEntry } from '@/types/sample';
import { ArrowLeft, History } from 'lucide-react';
import mermaid from 'mermaid';

mermaid.initialize({ startOnLoad: true, theme: 'neutral' });

const SampleFinder: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [foundSample, setFoundSample] = useState<Sample | null>(null);
    const [lineageSamples, setLineageSamples] = useState<Sample[]>([]);
    const [sampleActivities, setSampleActivities] = useState<ActivityLogEntry[]>([]);
    const [mermaidChart, setMermaidChart] = useState('');

    const allSamples: Sample[] = useMemo(() => {
        const saved = localStorage.getItem('lab-samples');
        if (saved) {
            return JSON.parse(saved).map((s: any) => ({...s, createdAt: new Date(s.createdAt)}));
        }
        return [];
    }, []);

    const activityLog: ActivityLogEntry[] = useMemo(() => {
        const saved = localStorage.getItem('lab-activity-log');
        if (saved) {
            return JSON.parse(saved).map((entry: any) => ({...entry, timestamp: new Date(entry.timestamp)}));
        }
        return [];
    }, []);

    const handleSearch = () => {
        const term = searchTerm.toLowerCase().trim();
        if (!term) {
            setFoundSample(null);
            return;
        }
        const sample = allSamples.find(s => s.barcode.toLowerCase() === term || s.name.toLowerCase().includes(term)) || null;
        setFoundSample(sample);
    };

    useEffect(() => {
        if (foundSample) {
            const relatedSamples = new Map<string, Sample>();
            relatedSamples.set(foundSample.id, foundSample);

            const findParents = (sample: Sample, level: number) => {
                if (!sample.parentId || level > 2) return;
                const parent = allSamples.find(s => s.id === sample.parentId);
                if (parent) {
                    relatedSamples.set(parent.id, parent);
                    findParents(parent, level + 1);
                }
            };

            const findChildren = (sample: Sample) => {
                const children = allSamples.filter(s => s.parentId === sample.id);
                children.forEach(child => {
                    relatedSamples.set(child.id, child);
                });
            };

            findParents(foundSample, 1);
            findChildren(foundSample);
            
            const lineage = Array.from(relatedSamples.values());
            setLineageSamples(lineage);

            const lineageIds = lineage.map(s => s.id);
            const activities = activityLog.filter(log => lineageIds.includes(log.sampleId));
            setSampleActivities(activities.sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime()));

            let chart = `graph TD\n`;
            lineage.forEach(s => {
                chart += `    ${s.id}["${s.name}<br/>(${s.barcode})"]\n`;
                if(s.id === foundSample.id) {
                    chart += `    style ${s.id} fill:#f9f,stroke:#333,stroke-width:4px\n`
                }
            });
            lineage.forEach(s => {
                if (s.parentId && relatedSamples.has(s.parentId)) {
                    chart += `    ${s.parentId} --> ${s.id}\n`;
                }
            });
            setMermaidChart(chart);

        } else {
            setLineageSamples([]);
            setSampleActivities([]);
            setMermaidChart('');
        }
    }, [foundSample, allSamples, activityLog]);

    useEffect(() => {
        if (mermaidChart) {
            const mermaidDiv = document.querySelector<HTMLElement>('.mermaid-chart');
            if (mermaidDiv) {
                mermaidDiv.removeAttribute('data-processed');
                mermaidDiv.innerHTML = mermaidChart;
                mermaid.run({
                    nodes: [mermaidDiv]
                });
            }
        }
    }, [mermaidChart]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <Link to="/">
                        <Button variant="outline" className="mb-4">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Lab Tracker
                        </Button>
                    </Link>
                    <h1 className="text-4xl font-bold text-slate-800 mb-2">Sample Finder</h1>
                    <p className="text-lg text-slate-600">Track a sample's history and lineage.</p>
                </div>

                <Card className="mb-6">
                    <CardContent className="p-4 flex gap-4 items-center">
                        <Input 
                            placeholder="Enter sample barcode or name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="max-w-sm"
                        />
                        <Button onClick={handleSearch}>Search</Button>
                    </CardContent>
                </Card>

                {foundSample ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Sample Lineage</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="mermaid-chart" key={Date.now()}>
                                        {mermaidChart}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        <div>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><History className="h-5 w-5" />Activity History</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {sampleActivities.length > 0 ? (
                                        <ul className="space-y-4 max-h-96 overflow-y-auto pr-2">
                                            {sampleActivities.map(activity => (
                                                <li key={activity.id} className="text-sm border-b pb-2">
                                                    <p className="font-semibold">{activity.details}</p>
                                                    <p className="text-xs text-gray-500">{new Date(activity.timestamp).toLocaleString()} - on sample {activity.sampleBarcode}</p>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-gray-500">No activities found for this sample and its lineage.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-16 text-gray-500">
                        <p>Search for a sample to see its details.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SampleFinder;
