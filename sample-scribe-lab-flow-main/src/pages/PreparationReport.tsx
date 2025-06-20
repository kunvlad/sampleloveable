
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const PreparationReportPage = () => {
  return (
    <div className="max-w-3xl mx-auto py-12">
      <Card>
        <CardHeader>
          <CardTitle>Preparation Report Moved</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            The Preparation (&quot;Analysis Workflow&quot;) Report is now available in the Workflow Manager. Select any workflow to view its report.
          </p>
          <div className="mt-4">
            <Link to="/workflow-manager">
              <Button>Go to Workflow Manager</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PreparationReportPage;
