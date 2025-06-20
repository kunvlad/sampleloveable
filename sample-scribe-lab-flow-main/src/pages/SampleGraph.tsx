
import React from 'react';
// Remove Link and Button since we're removing the "Back to Tracker" button here
// import { Link } from 'react-router-dom';
// import { Button } from '@/components/ui/button';
// import { ArrowLeft } from 'lucide-react';
import MermaidGraphPage from './MermaidGraph';

const SampleGraphPage: React.FC = () => {
  return (
    <div className="w-full">
      <MermaidGraphPage />
    </div>
  );
};

export default SampleGraphPage;

