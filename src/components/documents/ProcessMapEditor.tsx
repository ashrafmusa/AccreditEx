import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  MarkerType,
  Panel,
  MiniMap,
  ReactFlowProvider,
  NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { AppDocument } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { XMarkIcon, PlusIcon, TrashIcon, CheckIcon } from '../icons';

interface ProcessMapEditorProps {
  isOpen: boolean;
  onClose: () => void;
  document: AppDocument;
  onSave: (document: AppDocument) => void;
  isSaving?: boolean;
}

// Custom node types
const CustomStartNode = ({ data }: any) => (
  <div className="px-6 py-3 shadow-lg rounded-full bg-green-500 text-white border-2 border-green-600 text-center font-semibold min-w-[120px]">
    {data.label}
  </div>
);

const CustomEndNode = ({ data }: any) => (
  <div className="px-6 py-3 shadow-lg rounded-full bg-red-500 text-white border-2 border-red-600 text-center font-semibold min-w-[120px]">
    {data.label}
  </div>
);

const CustomProcessNode = ({ data }: any) => (
  <div className="px-6 py-4 shadow-lg rounded-lg bg-blue-500 text-white border-2 border-blue-600 text-center font-medium min-w-[150px]">
    {data.label}
  </div>
);

const CustomDecisionNode = ({ data }: any) => (
  <div className="px-6 py-4 shadow-lg bg-yellow-500 text-gray-900 border-2 border-yellow-600 text-center font-medium min-w-[150px] transform rotate-45">
    <div className="transform -rotate-45">{data.label}</div>
  </div>
);

const nodeTypes: NodeTypes = {
  start: CustomStartNode,
  end: CustomEndNode,
  process: CustomProcessNode,
  decision: CustomDecisionNode,
};

const ProcessMapEditor: React.FC<ProcessMapEditorProps> = ({ isOpen, onClose, document: documentData, onSave, isSaving }) => {
  const { t, lang, dir } = useTranslation();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeType, setSelectedNodeType] = useState<'start' | 'process' | 'decision' | 'end'>('process');
  const [nodeLabel, setNodeLabel] = useState('');
  const [showAddNodePanel, setShowAddNodePanel] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load existing process map data
  useEffect(() => {
    if (documentData.processMapContent) {
      if (documentData.processMapContent.nodes?.length > 0) {
        setNodes(documentData.processMapContent.nodes);
        setEdges(documentData.processMapContent.edges || []);
      } else {
        // Initialize with a start node if empty
        const initialNode: Node = {
          id: '1',
          type: 'start',
          data: { label: t('start') || 'Start' },
          position: { x: 250, y: 50 },
        };
        setNodes([initialNode]);
      }
    }
  }, [documentData, setNodes, setEdges, t]);

  const onConnect = useCallback(
    (connection: Connection) => {
      const edge = {
        ...connection,
        type: 'smoothstep',
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
      };
      setEdges((eds) => addEdge(edge, eds));
      setHasChanges(true);
    },
    [setEdges]
  );

  const handleAddNode = () => {
    if (!nodeLabel.trim()) return;

    const newNode: Node = {
      id: `${nodes.length + 1}`,
      type: selectedNodeType,
      data: { label: nodeLabel },
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 300 + 100,
      },
    };

    setNodes((nds) => [...nds, newNode]);
    setNodeLabel('');
    setShowAddNodePanel(false);
    setHasChanges(true);
  };

  const handleDeleteSelected = () => {
    setNodes((nds) => nds.filter((node) => !node.selected));
    setEdges((eds) => eds.filter((edge) => !edge.selected));
    setHasChanges(true);
  };

  const handleSave = () => {
    const updatedDocument = {
      ...documentData,
      processMapContent: {
        nodes,
        edges,
      },
    };
    onSave(updatedDocument);
    setHasChanges(false);
  };

  const handleClear = () => {
    if (window.confirm(t('confirmClearProcessMap') || 'Are you sure you want to clear the entire process map?')) {
      setNodes([]);
      setEdges([]);
      setHasChanges(true);
    }
  };

  const handleAutoLayout = () => {
    // Simple vertical auto-layout
    const layoutNodes = nodes.map((node, index) => ({
      ...node,
      position: {
        x: 250,
        y: index * 150 + 50,
      },
    }));
    setNodes(layoutNodes);
    setHasChanges(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center backdrop-blur-sm modal-enter">
      <div className="bg-white dark:bg-dark-brand-surface rounded-lg shadow-xl w-full max-w-7xl h-[90vh] m-4 flex flex-col modal-content-enter" dir={dir}>
        <header className="p-4 border-b dark:border-dark-brand-border flex justify-between items-center flex-shrink-0">
          <div>
            <h3 className="text-xl font-semibold dark:text-dark-brand-text-primary">{documentData.name[lang]}</h3>
            <p className="text-sm text-gray-500">
              v{documentData.currentVersion} - {t((documentData.status.charAt(0).toLowerCase() + documentData.status.slice(1).replace(' ', '')) as any)}
              {hasChanges && <span className="ml-2 text-yellow-600">● {t('unsavedChanges') || 'Unsaved changes'}</span>}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 rounded-full dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Close">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </header>

        <main className="flex-grow overflow-hidden relative">
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={(changes) => {
                onNodesChange(changes);
                setHasChanges(true);
              }}
              onEdgesChange={(changes) => {
                onEdgesChange(changes);
                setHasChanges(true);
              }}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              fitView
              className="bg-gray-50 dark:bg-gray-900"
            >
              <Background />
              <Controls />
              <MiniMap
                nodeColor={(node) => {
                  switch (node.type) {
                    case 'start': return '#10b981';
                    case 'end': return '#ef4444';
                    case 'decision': return '#eab308';
                    default: return '#3b82f6';
                  }
                }}
                className="bg-white dark:bg-gray-800"
              />
              
              <Panel position="top-left" className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 space-y-2">
                <button
                  onClick={() => setShowAddNodePanel(!showAddNodePanel)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  <PlusIcon className="w-4 h-4" />
                  {t('addNode') || 'Add Node'}
                </button>
                
                {showAddNodePanel && (
                  <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                    <select
                      value={selectedNodeType}
                      onChange={(e) => setSelectedNodeType(e.target.value as any)}
                      className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 text-sm"
                    >
                      <option value="start">{t('startNode') || '🟢 Start'}</option>
                      <option value="process">{t('processNode') || '🔵 Process'}</option>
                      <option value="decision">{t('decisionNode') || '🟡 Decision'}</option>
                      <option value="end">{t('endNode') || '🔴 End'}</option>
                    </select>
                    
                    <input
                      type="text"
                      value={nodeLabel}
                      onChange={(e) => setNodeLabel(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddNode()}
                      placeholder={t('nodeLabel') || 'Node label...'}
                      className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 text-sm"
                    />
                    
                    <button
                      onClick={handleAddNode}
                      disabled={!nodeLabel.trim()}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      <CheckIcon className="w-4 h-4" />
                      {t('add') || 'Add'}
                    </button>
                  </div>
                )}
                
                <button
                  onClick={handleDeleteSelected}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                  {t('deleteSelected') || 'Delete Selected'}
                </button>
                
                <button
                  onClick={handleAutoLayout}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
                >
                  {t('autoLayout') || 'Auto Layout'}
                </button>
                
                <button
                  onClick={handleClear}
                  className="w-full px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500 transition-colors text-sm"
                >
                  {t('clearAll') || 'Clear All'}
                </button>
              </Panel>

              <Panel position="top-right" className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3">
                <div className="text-sm space-y-1">
                  <div className="font-semibold mb-2">{t('legend') || 'Legend'}</div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-500"></div>
                    <span>{t('startNode') || 'Start'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-blue-500"></div>
                    <span>{t('processNode') || 'Process'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-500 transform rotate-45"></div>
                    <span>{t('decisionNode') || 'Decision'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-red-500"></div>
                    <span>{t('endNode') || 'End'}</span>
                  </div>
                </div>
              </Panel>

              <Panel position="bottom-center" className="bg-blue-50 dark:bg-blue-900/30 rounded-lg shadow-lg p-2 text-sm text-gray-700 dark:text-gray-300">
                💡 {t('processMapHint') || 'Tip: Click and drag to move nodes. Drag from node handles to create connections. Click nodes/edges to select and delete.'}
              </Panel>
            </ReactFlow>
          </ReactFlowProvider>
        </main>
        
        <footer className="bg-gray-50 dark:bg-gray-900/50 px-6 py-3 flex justify-between items-center space-x-3 rtl:space-x-reverse border-t dark:border-dark-brand-border flex-shrink-0">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {nodes.length} {t('nodes') || 'nodes'} · {edges.length} {t('connections') || 'connections'}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-md text-sm font-medium border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {t('close')}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className="inline-flex justify-center py-2 px-6 rounded-md text-sm font-medium text-white bg-brand-primary hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (t('saving') || 'Saving...') : (t('saveChanges') || 'Save Changes')}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ProcessMapEditor;
