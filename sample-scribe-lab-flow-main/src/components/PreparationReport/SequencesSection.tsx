
import React from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { ClipboardList, Info } from "lucide-react";
import SectionCard from "./SectionCard";
import { ActivityLogEntry } from "@/types/sample";

function getSequenceEntries(log: ActivityLogEntry[]) {
  // assign, rearrange, duplicate, delete
  const regex = /(assign|rearrange|duplicate|delete)/i;
  return log.filter(entry => regex.test(entry.action));
}
function getVisualConfig(action: string) {
  if (/assign/i.test(action)) return { icon: <span className="text-blue-700 font-bold">🎯</span> };
  if (/rearrange/i.test(action)) return { icon: <span className="text-purple-700 font-bold">🔀</span> };
  if (/duplicate/i.test(action)) return { icon: <span className="text-green-700 font-bold">📄</span> };
  if (/delete/i.test(action)) return { icon: <span className="text-red-700 font-bold">🗑️</span> };
  return { icon: <ClipboardList className="w-5 h-5 text-blue-700" /> };
}

const SequencesSection = ({ log }: { log: ActivityLogEntry[] }) => {
  const entries = getSequenceEntries(log);

  return (
    <SectionCard
      title="Sequences and Analysis"
      icon={<ClipboardList className="w-6 h-6 text-blue-700" />}
    >
      {entries.length === 0 && (
        <div className="mb-4 text-gray-400">
          <Info className="w-5 h-5 inline mr-2" />
          No HPLC sequence creation/editing steps logged yet.
        </div>
      )}
      <Accordion type="single" collapsible className="w-full">
        {entries.map((entry, idx) => {
          const { icon } = getVisualConfig(entry.action);
          return (
            <AccordionItem value={entry.id || `seq-ana-${idx}`} key={entry.id || idx}>
              <AccordionTrigger className="flex items-center gap-2 group">
                <span>{icon}</span>
                <span className="font-semibold text-base group-hover:underline">{entry.action}</span>
                <span className="ml-2 text-xs text-gray-500">
                  {format(new Date(entry.timestamp), "PPPp")}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pl-4 py-1">
                  <div className="mb-2">
                    <Badge variant="outline" className="mr-1">Sample</Badge>
                    {entry.sampleBarcode || entry.sampleId}
                  </div>
                  <div className="text-sm mb-2">
                    <b className="text-gray-500 mr-1">Details:</b>
                    {entry.details || <span className="italic text-gray-400">none</span>}
                  </div>
                  {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                    <div className="mt-1 ml-1 text-xs text-gray-600">
                      <b>Metadata:</b>{" "}
                      {Object.entries(entry.metadata).map(([k, v]) =>
                        <span key={k} className="mr-2">{k}: <b>{String(v)}</b></span>
                      )}
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </SectionCard>
  );
};

export default SequencesSection;
