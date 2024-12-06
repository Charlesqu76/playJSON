import React, { useState } from 'react';
import './JsonViewer.css';  // You'll need to create this CSS file

interface JsonViewerProps {
  data: any;
  level?: number;
}

const JsonViewer: React.FC<JsonViewerProps> = ({ data, level = 0 }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const renderValue = (value: any): JSX.Element => {
    if (value === null) return <span className="json-null">null</span>;
    if (typeof value === 'boolean') return <span className="json-boolean">{value.toString()}</span>;
    if (typeof value === 'number') return <span className="json-number">{value}</span>;
    if (typeof value === 'string') return <span className="json-string">"{value}"</span>;
    if (Array.isArray(value)) return <JsonViewer data={value} level={level + 1} />;
    if (typeof value === 'object') return <JsonViewer data={value} level={level + 1} />;
    return <span>{String(value)}</span>;
  };

  if (Array.isArray(data)) {
    return (
      <div className="json-container" style={{ marginLeft: level }}>
        <span className="json-collapser" onClick={() => setIsCollapsed(!isCollapsed)}>
          {isCollapsed ? '▶' : '▼'} 
        </span>
        <span>[</span>
        {!isCollapsed && (
          <div className="json-indent">
            {data.map((item, index) => (
              <div key={index}>
                {renderValue(item)}
                {index < data.length - 1 && <span className="json-separator">,</span>}
              </div>
            ))}
          </div>
        )}
        <span>]</span>
      </div>
    );
  }

  if (typeof data === 'object' && data !== null) {
    return (
      <div className="json-container" style={{ marginLeft: level * 5 }}>
        <span className="json-collapser" onClick={() => setIsCollapsed(!isCollapsed)}>
          {isCollapsed ? '▶' : '▼'} 
        </span>
        <span>{'{'}</span>
        {!isCollapsed && (
          <div className="json-indent">
            {Object.entries(data).map(([key, value], index, array) => (
              <div key={key}>
                <span className="json-key">{key}</span>
                <span className="json-separator">: </span>
                {renderValue(value)}
                {index < array.length - 1 && <span className="json-separator">,</span>}
              </div>
            ))}
          </div>
        )}
        <span>{'}'}</span>
      </div>
    );
  }

  return renderValue(data);
};

export default JsonViewer;
