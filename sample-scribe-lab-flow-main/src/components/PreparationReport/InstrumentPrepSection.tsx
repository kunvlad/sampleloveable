
import React, { useState } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Clock8, Info } from "lucide-react";
import SectionCard from "./SectionCard";
import { ActivityLogEntry } from "@/types/sample";

function getInstrumentPrepEntries(log: ActivityLogEntry[]) {
  // instrument, standby, ready, equilibrat(e), flush, prepare
  const regex = /(instrument|standby|ready|equilibrat|flush|prepare)/i;
  return log.filter(entry => regex.test(entry.action));
}
function getVisualConfig(action: string) {
  return { icon: <Clock8 className="w-5 h-5 text-gray-400" /> };
}

const InstrumentPrepSection = ({ log }: { log: ActivityLogEntry[] }) => {
  const entries = getInstrumentPrepEntries(log);
  const [openItem, setOpenItem] = useState<string | undefined>();

  return (
    <SectionCard
      title="Instrument Preparation & Standby Mode"
      icon={<Clock8 className="w-6 h-6 text-gray-700" />}
    >
      {entries.length === 0 && (
        <div className="mb-4 text-gray-400">
          <Info className="w-5 h-5 inline mr-2" />
          No instrument preparation events logged yet.
        </div>
      )}
      <Accordion type="single" collapsible className="w-full" value={openItem} onValueChange={setOpenItem}>
        {entries.map((entry, idx) => {
          const { icon } = getVisualConfig(entry.action);
          return (
            <AccordionItem value={entry.id || `inst-prep-${idx}`} key={entry.id || idx}>
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
                    <Badge variant="outline" className="mr-1">Instrument</Badge>
                    {entry.details || <span className="italic text-gray-400">no details</span>}
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

export default InstrumentPrepSection;
