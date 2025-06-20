
import React from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { FlaskRound, Info } from "lucide-react";
import SectionCard from "./SectionCard";
import { ActivityLogEntry } from "@/types/sample";

function getSamplePrepEntries(log: ActivityLogEntry[]) {
  // Includes "split", "weight", "dilute", "prepare", "volume", "create", "add", "new sample"
  const regex = /(split|weight|dilute|prepare|volume|create|add|new sample)/i;
  return log.filter(entry => regex.test(entry.action));
}

function getVisualConfig(action: string) {
  // simplified icon logic for this sample section
  if (/weight/i.test(action)) return { icon: <span className="text-orange-700 font-bold">⚖️</span> };
  if (/volume|split/i.test(action)) return { icon: <span className="text-cyan-700 font-bold">🧪</span> };
  if (/dilut/i.test(action)) return { icon: <span className="text-fuchsia-700 font-bold">💧</span> };
  if (/create|add|new sample/i.test(action)) return { icon: <span className="text-emerald-700 font-bold">🆕</span> };
  return { icon: <FlaskRound className="w-5 h-5 text-emerald-700" /> };
}

const SamplePreparationSection = ({ log }: { log: ActivityLogEntry[] }) => {
  const entries = getSamplePrepEntries(log);

  return (
    <SectionCard
      title="Sample Preparation"
      icon={<FlaskRound className="w-6 h-6 text-emerald-700" />}
    >
      {entries.length === 0 && (
        <div className="mb-4 text-gray-400">
          <Info className="w-5 h-5 inline mr-2" />
          No sample preparation steps have been logged yet.
        </div>
      )}
      <Accordion type="single" collapsible className="w-full">
        {entries.map((entry, idx) => {
          const { icon } = getVisualConfig(entry.action);
          let affectedField: string | null = null;
          let affectedValue: string | number | null = null;
          let valueColor = "text-blue-700";

          if (/weight/i.test(entry.action) || "weight" in (entry.metadata || {})) {
            affectedField = "Weight";
            affectedValue = entry.metadata?.weight ?? entry.details?.match(/([\d.]+)\s*mg/)?.[1];
            valueColor = "text-orange-700";
          } else if (/volume/i.test(entry.action) || "volume" in (entry.metadata || {})) {
            affectedField = "Volume";
            affectedValue = entry.metadata?.volume ?? entry.details?.match(/([\d.]+)\s*(u?l)/i)?.[1];
            valueColor = "text-indigo-700";
          } else if (/dilut/i.test(entry.action)) {
            affectedField = "Dilution ratio";
            affectedValue = entry.metadata?.dilutionRatio ?? entry.details;
            valueColor = "text-fuchsia-700";
          } else if (/split/i.test(entry.action)) {
            affectedField = "Split volume";
            affectedValue = entry.metadata?.volume ?? entry.details?.match(/([\d.]+)\s*(u?l)/i)?.[1];
            valueColor = "text-cyan-700";
          } else if ("value" in (entry.metadata || {})) {
            affectedField = "Value";
            affectedValue = entry.metadata.value;
          }
          // Show creation-specific detail
          let creationInfo: React.ReactNode = null;
          if (/create|add|new sample/i.test(entry.action)) {
            creationInfo = (
              <span className="bg-white border px-2 py-0.5 rounded-lg shadow-sm ml-1">
                <b className="mr-1 text-gray-700">Sample created</b>
              </span>
            );
          }

          return (
            <AccordionItem value={entry.id || `sample-prep-${idx}`} key={entry.id || idx}>
              <AccordionTrigger className="flex items-center gap-2 group">
                <span>{icon}</span>
                <span className="font-semibold text-base group-hover:underline">
                  {entry.action.replace(/_/g, " ")}
                </span>
                <span className="ml-2 text-xs text-gray-500">
                  {format(new Date(entry.timestamp), "PPPp")}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pl-4 py-2 flex flex-col md:flex-row md:gap-6">
                  {/* Visual Summary Card */}
                  <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3 mb-2 flex-1">
                    <div className="flex flex-wrap gap-x-5 gap-y-1 items-center text-sm">
                      <span className="font-bold text-emerald-800">
                        Sample: {entry.sampleBarcode || entry.sampleId}
                      </span>
                      {entry.sampleId && (
                        <span className="text-gray-600">ID: <span className="font-mono">{entry.sampleId}</span></span>
                      )}
                      <span className="text-gray-600">
                        <b>Action: </b>
                        <span className="font-semibold text-emerald-700">{entry.action.replace(/_/g, " ")}</span>
                      </span>
                      {affectedField && affectedValue && (
                        <span className="inline-flex items-center bg-white border px-2 py-0.5 rounded-lg shadow-sm ml-1">
                          <b className="mr-1 text-gray-700">{affectedField}:</b>
                          <span className={`font-mono font-semibold ${valueColor}`}>{affectedValue}</span>
                          {affectedField === "Weight" ? " mg" : ""}
                          {affectedField === "Volume" || affectedField === "Split volume" ? " µL" : ""}
                        </span>
                      )}
                      {creationInfo}
                    </div>
                    {/* Step details */}
                    {entry.details && (
                      <div className="mt-2 text-gray-700">
                        <b>Step Details:</b>{" "}
                        <span className="">{entry.details}</span>
                      </div>
                    )}
                    {/* Metadata */}
                    {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                      <div className="mt-2 text-xs text-gray-600">
                        <b>Extra Data:</b>{" "}
                        {Object.entries(entry.metadata).map(([k, v]) =>
                          <span key={k} className="inline-block bg-gray-100 rounded px-2 py-0.5 mr-2">{k}: <b>{String(v)}</b></span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </SectionCard>
  );
};

export default SamplePreparationSection;
