import React, { useState } from 'react';
import './JsonViewer.css';

interface JsonViewerProps {
  data: any;
  level?: number;
  onEdit?: (path: string[], newKey: string, newValue: any) => void;
}

const JsonViewer: React.FC<JsonViewerProps> = ({ data, level = 0, onEdit }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [editingItem, setEditingItem] = useState<{path: string[], type: 'key' | 'value'} | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const handleEdit = (path: string[], type: 'key' | 'value', initialValue: string) => {
    setEditingItem({ path, type });
    setEditValue(initialValue);
  };

  const handleSave = () => {
    if (!editingItem || !onEdit) return;
    try {
      if (editingItem.type === 'value') {
        const parsedValue = editValue === 'null' ? null : JSON.parse(editValue);
        onEdit(editingItem.path.slice(0, -1), editingItem.path[editingItem.path.length - 1], parsedValue);
      } else {
        onEdit(editingItem.path.slice(0, -1), editValue, data[editingItem.path[editingItem.path.length - 1]]);
      }
    } catch {
      if (editingItem.type === 'value') {
        onEdit(editingItem.path.slice(0, -1), editingItem.path[editingItem.path.length - 1], editValue);
      }
    }
    setEditingItem(null);
  };

  const renderValue = (value: any, path: string[] = []): JSX.Element => {
    const isEditing = editingItem?.path.join('.') === path.join('.');
    if (isEditing && editingItem.type === 'value') {
      return (
        <input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          autoFocus
        />
      );
    }

    if (value === null) return <span className="json-null" onDoubleClick={() => handleEdit(path, 'value', 'null')}>null</span>;
    if (typeof value === 'boolean') return <span className="json-boolean" onDoubleClick={() => handleEdit(path, 'value', value.toString())}>{value.toString()}</span>;
    if (typeof value === 'number') return <span className="json-number" onDoubleClick={() => handleEdit(path, 'value', value.toString())}>{value}</span>;
    if (typeof value === 'string') return <span className="json-string" onDoubleClick={() => handleEdit(path, 'value', value)}>"{value}"</span>;
    if (Array.isArray(value)) return <JsonViewer data={value} level={level + 1} onEdit={onEdit} />;
    if (typeof value === 'object') return <JsonViewer data={value} level={level + 1} onEdit={onEdit} />;
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
                {editingItem?.path.join('.') === key && editingItem.type === 'key' ? (
                  <input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    autoFocus
                  />
                ) : (
                  <span 
                    className="json-key" 
                    onDoubleClick={() => handleEdit([key], 'key', key)}
                  >
                    {key}
                  </span>
                )}
                <span className="json-separator">: </span>
                {renderValue(value, [key])}
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
