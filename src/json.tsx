import React, { useRef, useState, useEffect } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import * as monaco from "monaco-editor";

interface JsonPosition {
  key: string;
  line: number;
  path: string[];
  isArrayItem: boolean;
}

const getJsonPositions = (content: string): JsonPosition[] => {
  const positions: JsonPosition[] = [];
  const lines = content.split('\n');
  const pathStack: string[] = [];
  const arrayIndexStack: number[] = [];
  let currentArrayIndex = -1;

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    // Handle array start
    if (trimmedLine === '[') {
      currentArrayIndex = -1;
      arrayIndexStack.push(currentArrayIndex);
    }
    // Handle array end
    else if (trimmedLine === ']' || trimmedLine === '],') {
      arrayIndexStack.pop();
      if (pathStack.length > 0) {
        pathStack.pop();
      }
    }
    // Handle object start in array
    else if (trimmedLine === '{' && arrayIndexStack.length > 0) {
      currentArrayIndex = arrayIndexStack[arrayIndexStack.length - 1] + 1;
      arrayIndexStack[arrayIndexStack.length - 1] = currentArrayIndex;
    }
    // Handle object end
    else if (trimmedLine === '}' || trimmedLine === '},') {
      if (pathStack.length > 0 && arrayIndexStack.length === 0) {
        pathStack.pop();
      }
    }
    // Handle key-value pairs
    else {
      const keyMatch = trimmedLine.match(/"([^"]+)":\s*(.*)/);
      if (keyMatch) {
        const [, key, value] = keyMatch;
        const currentPath = [...pathStack];
        const isInArray = arrayIndexStack.length > 0;
        
        // Build the path
        let finalPath = [...currentPath];
        if (isInArray && currentArrayIndex >= 0) {
          const lastPath = finalPath[finalPath.length - 1];
          finalPath[finalPath.length - 1] = `${lastPath}[${currentArrayIndex}]`;
        }

        positions.push({
          key,
          line: index + 1,
          path: finalPath,
          isArrayItem: isInArray
        });

        // Update stacks for nested structures
        if (value.includes('{')) {
          pathStack.push(key);
        } else if (value.includes('[')) {
          pathStack.push(key);
        }
      }
    }
  });

  return positions;
};

const findPathAtLine = (positions: JsonPosition[], targetLine: number): string => {
  const position = positions.find(p => p.line === targetLine);
  if (!position) return '';
  
  const pathParts = [...position.path];
  if (!position.isArrayItem || position.path.length === 0) {
    pathParts.push(position.key);
  }
  
  return pathParts.filter(Boolean).join('.');
};

const MonacoJsonEditor: React.FC<MonacoJsonEditorProps> = ({ jsondata }) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [jsonContent, setJsonContent] = useState(jsondata);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [editorHeight, setEditorHeight] = useState("400px");

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;

    editor.onMouseDown(async (e) => {
      if (e.target.position) {
        const model = editor.getModel();
        if (model) {
          const content = model.getValue();
          const positions = getJsonPositions(content);
          const path = findPathAtLine(positions, e.target.position.lineNumber);
          if (path) {
            console.log("Path:", path);
          }
        }
      }
    });
  };

  const handleValidateJSON = () => {
    try {
      const parsedJson = JSON.parse(jsonContent);
      setValidationErrors([]);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? `JSON Parsing Error: ${error.message}`
          : "Invalid JSON";
      setValidationErrors([errorMessage]);
    }
  };

  const handleFormatJSON = () => {
    if (editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        const value = model.getValue();
        try {
          const formattedJson = JSON.stringify(JSON.parse(value), null, 2);
          editorRef.current.setValue(formattedJson);
          setJsonContent(formattedJson);
          setValidationErrors([]);
        } catch (error) {
          setValidationErrors(["Formatting failed: Invalid JSON"]);
        }
      }
    }
  };

  const updateEditorHeight = () => {
    if (editorRef.current) {
      const contentHeight = Math.min(
        editorRef.current.getContentHeight(),
        400 // maximum height
      );
      setEditorHeight(`${contentHeight}px`);
    }
  };

  useEffect(() => {
    if (editorRef.current) {
      const editor = editorRef.current;
      // Update height when content changes
      editor.onDidContentSizeChange(updateEditorHeight);
      // Initial height calculation
      updateEditorHeight();
    }
  }, [editorRef.current]);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.setValue(jsondata);
      setJsonContent(jsondata);
      handleFormatJSON();
    }
  }, [jsondata]);

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="mb-4 flex space-x-2">
        <button
          onClick={handleValidateJSON}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Validate JSON
        </button>
        <button
          onClick={handleFormatJSON}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Format JSON
        </button>
      </div>

      {validationErrors.length > 0 && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          {validationErrors.map((error, index) => (
            <p key={index}>{error}</p>
          ))}
        </div>
      )}

      <Editor
        height={editorHeight}
        defaultLanguage="json"
        defaultValue={jsondata}
        onMount={handleEditorDidMount}
        onChange={(value) => setJsonContent(value || "")}
        options={{
          minimap: { enabled: false },
          formatOnType: true,
          formatOnPaste: true,
          wordWrap: "on",
          wrappingStrategy: "advanced",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          overviewRulerBorder: false,
          showFoldingControls: "always",
          folding: true,
          foldingStrategy: "auto",
          links: true,
          hover: {
            enabled: true,
            delay: 300,
          },
        }}
      />
    </div>
  );
};

export default MonacoJsonEditor;
