import { useMemo, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Separator } from './ui/separator';
import { Textarea } from './ui/textarea';

export interface SearchResult {
  id: string;
  title: string;
}

interface LeftPanelProps {
  onCreate: (title: string, rawJson: string) => string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchResults: SearchResult[];
  rootResults: SearchResult[];
  onSelectResult: (id: string) => void;
  onImport: (text: string) => string | null;
}

const LeftPanel = ({
  onCreate,
  searchQuery,
  onSearchChange,
  searchResults,
  rootResults,
  onSelectResult,
  onImport,
}: LeftPanelProps) => {
  const [title, setTitle] = useState('New JSON Block');
  const [rawJson, setRawJson] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const visibleResults = useMemo(() => searchResults.slice(0, 20), [searchResults]);

  return (
    <Card className="left-panel">
      <CardHeader>
        <CardTitle>Create Block</CardTitle>
      </CardHeader>
      <CardContent>
      <Input
        className="control-input"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Block title"
      />
      <Textarea
        className="create-json"
        value={rawJson}
        onChange={(event) => setRawJson(event.target.value)}
        placeholder='Paste JSON here, e.g. {"name":"demo"}'
        rows={8}
      />
      {error ? <div className="inline-error">{error}</div> : null}
      <div className="button-row">
        <Button
          onClick={() => {
            const createError = onCreate(title, rawJson);
            if (createError) {
              setError(createError);
              return;
            }
            setError(null);
            setRawJson('');
          }}
        >
          Create JSON Block
        </Button>
        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
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
          event.target.value = '';
          if (!file) return;
          const text = await file.text();
          const resultError = onImport(text);
          setImportError(resultError);
        }}
      />
      {importError ? <div className="inline-error">{importError}</div> : null}

      <div className="panel-section">
        <Separator />
        <h3 style={{ marginTop: '0.8rem' }}>Search</h3>
        <Input
          className="control-input"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search by title, key, or value"
        />
        <div className="search-results">
          {visibleResults.map((result) => (
            <Button
              key={result.id}
              className="search-result"
              variant="outline"
              size="sm"
              onClick={() => onSelectResult(result.id)}
            >
              {result.title}
            </Button>
          ))}
          {visibleResults.length === 0 && searchQuery.trim() ? (
            <div className="hint">No matching blocks.</div>
          ) : null}
        </div>
      </div>

      <div className="panel-section">
        <Separator />
        <h3>No Parent Blocks</h3>
        <div className="search-results">
          {rootResults.map((result) => (
            <Button
              key={result.id}
              className="search-result"
              variant="outline"
              size="sm"
              onClick={() => onSelectResult(result.id)}
            >
              {result.title}
            </Button>
          ))}
          {rootResults.length === 0 ? <div className="hint">No root blocks.</div> : null}
        </div>
      </div>

      </CardContent>
    </Card>
  );
};

export default LeftPanel;
