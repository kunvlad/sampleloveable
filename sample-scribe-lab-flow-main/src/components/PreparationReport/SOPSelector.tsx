
import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  workflowId: string;
  onSOPSelected: (sopUrl: string) => void;
};

// Use localStorage to store the SOP file's url for demo purposes
export const SOPSelector: React.FC<Props> = ({ workflowId, onSOPSelected }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pdfName, setPdfName] = useState<string | null>(() => {
    const val = localStorage.getItem(`workflow-sop:${workflowId}`);
    if (!val) return null;
    try {
      const obj = JSON.parse(val);
      return obj.filename || null;
    } catch {
      return val;
    }
  });

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      if (!e.target?.result) return;
      localStorage.setItem(
        `workflow-sop:${workflowId}`,
        JSON.stringify({
          filename: file.name,
          dataUrl: e.target.result,
        })
      );
      setPdfName(file.name);
      onSOPSelected(e.target.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        size="sm"
        variant="secondary"
        onClick={() => fileInputRef.current?.click()}
      >
        {pdfName ? "Replace SOP PDF" : "Attach SOP PDF"}
      </Button>
      <input
        type="file"
        accept="application/pdf"
        ref={fileInputRef}
        className="hidden"
        onChange={e => {
          if (e.target.files?.length) {
            handleFile(e.target.files[0]);
          }
        }}
      />
      {pdfName && (
        <div className="text-xs text-gray-700 mt-1">
          SOP attached: <b>{pdfName}</b>
        </div>
      )}
    </div>
  );
};
