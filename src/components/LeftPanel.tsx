import { useRef, useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";
import { Textarea } from "./ui/textarea";

export interface SearchResult {
  id: string;
  title: string;
}

interface LeftPanelProps {
  onCreate: (title: string, rawJson: string) => string | null;
  rootResults: SearchResult[];
  onSelectResult: (id: string) => void;
  onImport: (text: string) => string | null;
}

const LeftPanel = ({
  onCreate,
  rootResults,
  onSelectResult,
  onImport,
}: LeftPanelProps) => {
  const [title, setTitle] = useState("New JSON Block");
  const [rawJson, setRawJson] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <Card className="overflow-auto p-0 w-1/5">
      <CardHeader>
        <CardTitle>Create Block</CardTitle>
      </CardHeader>
      <CardContent>
        <Input
          className="mb-[0.55rem]"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Block title"
        />
        <Textarea
          className="mb-[0.55rem]"
          value={rawJson}
          onChange={(event) => setRawJson(event.target.value)}
          placeholder='Paste JSON here, e.g. {"name":"demo"}'
          rows={8}
        />
        {error ? (
          <div className="mb-[0.55rem] rounded-lg border border-[#fecaca] bg-[#fee2e2] px-[0.45rem] py-[0.35rem] text-[0.9rem] text-[#b91c1c]">
            {error}
          </div>
        ) : null}
        <div className="mb-[0.55rem] flex flex-wrap gap-2">
          <Button
            onClick={() => {
              const createError = onCreate(title, rawJson);
              if (createError) {
                setError(createError);
                return;
              }
              setError(null);
              setRawJson("");
            }}
          >
            Create JSON Block
          </Button>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            Import
          </Button>
        </div>
        <Input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          hidden
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            const text = await file.text();
            const resultError = onImport(text);
            setImportError(resultError);
          }}
        />
        {importError ? (
          <div className="mb-[0.55rem] rounded-lg border border-[#fecaca] bg-[#fee2e2] px-[0.45rem] py-[0.35rem] text-[0.9rem] text-[#b91c1c]">
            {importError}
          </div>
        ) : null}

        <div className="mt-4 border-t border-[#efe7dc] pt-3">
          <Separator className="mb-3" />
          <h3 className="mb-[0.6rem] mt-0">No Parent Blocks</h3>
          <div className="mt-[0.45rem] flex max-h-[190px] flex-col gap-[0.3rem] overflow-auto">
            {rootResults.map((result) => (
              <Button
                key={result.id}
                className="justify-start text-left"
                variant="outline"
                size="sm"
                onClick={() => onSelectResult(result.id)}
              >
                {result.title}
              </Button>
            ))}
            {rootResults.length === 0 ? (
              <div className="text-[0.9rem] text-[#6f655d]">
                No root blocks.
              </div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeftPanel;
