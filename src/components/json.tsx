import React, { useRef, useState, useEffect } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { Button } from "antd";

interface IProps {
  jsondata: string;
}

const MonacoJsonEditor = ({ jsondata }: IProps) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [jsonContent, setJsonContent] = useState(jsondata);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [editorHeight, setEditorHeight] = useState("400px");

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;
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
    <div className="w-full mx-auto p-4">
      <div className="mb-4 flex space-x-2">
        <Button
          onClick={handleValidateJSON}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Validate
        </Button>
        <Button
          onClick={handleFormatJSON}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Format
        </Button>
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
