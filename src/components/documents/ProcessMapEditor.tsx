import React, { useState, useCallback, useEffect, useRef } from "react";
import DOMPurify from "dompurify";
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
  useReactFlow,
  getRectOfNodes,
  getTransformForBounds,
} from "reactflow";
import "reactflow/dist/style.css";
import { toPng } from "html-to-image";
import { AppDocument } from "../../types";
import { useTranslation } from "../../hooks/useTranslation";
import {
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  CheckIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  PhotoIcon,
  QuestionMarkCircleIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
} from "../icons";

interface ProcessMapEditorProps {
  isOpen: boolean;
  onClose: () => void;
  document: AppDocument;
  onSave: (document: AppDocument) => void;
  isSaving?: boolean;
}

// Custom node types with enhanced styling - LARGER & MORE READABLE
const CustomStartNode = ({ data }: any) => (
  <div className="px-8 py-4 shadow-2xl rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white border-3 border-green-700 text-center font-bold min-w-[200px] hover:shadow-green-500/50 transition-all duration-200 hover:scale-105 cursor-pointer">
    <div className="flex items-center justify-center gap-3">
      <span className="text-2xl">▶️</span>
      <span className="text-base">{data.label}</span>
    </div>
  </div>
);

const CustomEndNode = ({ data }: any) => (
  <div className="px-8 py-4 shadow-2xl rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white border-3 border-red-700 text-center font-bold min-w-[200px] hover:shadow-red-500/50 transition-all duration-200 hover:scale-105 cursor-pointer">
    <div className="flex items-center justify-center gap-3">
      <span className="text-2xl">⏹️</span>
      <span className="text-base">{data.label}</span>
    </div>
  </div>
);

const CustomProcessNode = ({ data }: any) => (
  <div className="px-8 py-5 shadow-2xl rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white border-3 border-blue-700 text-center font-semibold min-w-[220px] hover:shadow-blue-500/50 transition-all duration-200 hover:scale-105 cursor-pointer">
    <div className="flex flex-col items-center justify-center gap-2">
      <span className="text-3xl">⚙️</span>
      <span className="text-base">{data.label}</span>
    </div>
  </div>
);

const CustomDecisionNode = ({ data }: any) => (
  <div className="p-10 shadow-2xl bg-gradient-to-br from-yellow-400 to-yellow-500 text-gray-900 border-3 border-yellow-600 text-center font-semibold min-w-[200px] min-h-[200px] transform rotate-45 hover:shadow-yellow-500/50 transition-all duration-200 hover:scale-105 cursor-pointer">
    <div className="transform -rotate-45 flex flex-col items-center justify-center gap-2">
      <span className="text-3xl">◆</span>
      <span className="text-base font-bold">{data.label}</span>
    </div>
  </div>
);

const nodeTypes: NodeTypes = {
  start: CustomStartNode,
  end: CustomEndNode,
  process: CustomProcessNode,
  decision: CustomDecisionNode,
};

// History management for undo/redo
interface HistoryState {
  nodes: Node[];
  edges: Edge[];
}

// Template patterns
interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  nodes: Partial<Node>[];
  edges: Partial<Edge>[];
}

const templates: Template[] = [
  {
    id: "simple-flow",
    name: "Simple Flow",
    description: "Start → Process → End",
    icon: "➡️",
    nodes: [
      {
        id: "1",
        type: "start",
        data: { label: "Start" },
        position: { x: 100, y: 100 },
      },
      {
        id: "2",
        type: "process",
        data: { label: "Process" },
        position: { x: 100, y: 200 },
      },
      {
        id: "3",
        type: "end",
        data: { label: "End" },
        position: { x: 100, y: 300 },
      },
    ],
    edges: [
      { id: "e1-2", source: "1", target: "2" },
      { id: "e2-3", source: "2", target: "3" },
    ],
  },
  {
    id: "decision-flow",
    name: "Decision Flow",
    description: "Start → Decision → Two paths",
    icon: "🔀",
    nodes: [
      {
        id: "1",
        type: "start",
        data: { label: "Start" },
        position: { x: 250, y: 50 },
      },
      {
        id: "2",
        type: "decision",
        data: { label: "Decision?" },
        position: { x: 200, y: 150 },
      },
      {
        id: "3",
        type: "process",
        data: { label: "Yes Path" },
        position: { x: 100, y: 300 },
      },
      {
        id: "4",
        type: "process",
        data: { label: "No Path" },
        position: { x: 350, y: 300 },
      },
      {
        id: "5",
        type: "end",
        data: { label: "End" },
        position: { x: 250, y: 450 },
      },
    ],
    edges: [
      { id: "e1-2", source: "1", target: "2" },
      { id: "e2-3", source: "2", target: "3", label: "Yes" },
      { id: "e2-4", source: "2", target: "4", label: "No" },
      { id: "e3-5", source: "3", target: "5" },
      { id: "e4-5", source: "4", target: "5" },
    ],
  },
  {
    id: "review-process",
    name: "Review Process",
    description: "Submit → Review → Approve/Reject",
    icon: "📝",
    nodes: [
      {
        id: "1",
        type: "start",
        data: { label: "Submit" },
        position: { x: 250, y: 50 },
      },
      {
        id: "2",
        type: "process",
        data: { label: "Review" },
        position: { x: 250, y: 150 },
      },
      {
        id: "3",
        type: "decision",
        data: { label: "Approved?" },
        position: { x: 200, y: 270 },
      },
      {
        id: "4",
        type: "process",
        data: { label: "Revise" },
        position: { x: 400, y: 350 },
      },
      {
        id: "5",
        type: "end",
        data: { label: "Complete" },
        position: { x: 100, y: 420 },
      },
    ],
    edges: [
      { id: "e1-2", source: "1", target: "2" },
      { id: "e2-3", source: "2", target: "3" },
      { id: "e3-5", source: "3", target: "5", label: "Yes" },
      { id: "e3-4", source: "3", target: "4", label: "No" },
      { id: "e4-2", source: "4", target: "2" },
    ],
  },
  {
    id: "parallel-tasks",
    name: "Parallel Tasks",
    description: "Execute multiple tasks simultaneously",
    icon: "⚡",
    nodes: [
      {
        id: "1",
        type: "start",
        data: { label: "Start" },
        position: { x: 250, y: 50 },
      },
      {
        id: "2",
        type: "process",
        data: { label: "Task A" },
        position: { x: 100, y: 180 },
      },
      {
        id: "3",
        type: "process",
        data: { label: "Task B" },
        position: { x: 250, y: 180 },
      },
      {
        id: "4",
        type: "process",
        data: { label: "Task C" },
        position: { x: 400, y: 180 },
      },
      {
        id: "5",
        type: "process",
        data: { label: "Merge Results" },
        position: { x: 250, y: 310 },
      },
      {
        id: "6",
        type: "end",
        data: { label: "End" },
        position: { x: 250, y: 410 },
      },
    ],
    edges: [
      { id: "e1-2", source: "1", target: "2" },
      { id: "e1-3", source: "1", target: "3" },
      { id: "e1-4", source: "1", target: "4" },
      { id: "e2-5", source: "2", target: "5" },
      { id: "e3-5", source: "3", target: "5" },
      { id: "e4-5", source: "4", target: "5" },
      { id: "e5-6", source: "5", target: "6" },
    ],
  },
];

const ProcessMapEditorContent: React.FC<
  ProcessMapEditorProps & { reactFlowWrapper: React.RefObject<HTMLDivElement> }
> = ({
  isOpen,
  onClose,
  document: documentData,
  onSave,
  isSaving,
  reactFlowWrapper,
}) => {
  const { t, lang, dir } = useTranslation();
  const { getNodes, getEdges, setViewport, fitView, zoomIn, zoomOut } =
    useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeType, setSelectedNodeType] = useState<
    "start" | "process" | "decision" | "end"
  >("process");
  const [nodeLabel, setNodeLabel] = useState("");
  const [showAddNodePanel, setShowAddNodePanel] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Advanced features
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedNodeForColor, setSelectedNodeForColor] = useState<
    string | null
  >(null);
  const [exportFormat, setExportFormat] = useState<"png" | "svg">("png");

  // Undo/Redo history
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Save current state to history
  const saveToHistory = useCallback(() => {
    const currentState = { nodes: getNodes(), edges: getEdges() };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(currentState);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex, getNodes, getEdges]);

  // Load existing process map data
  useEffect(() => {
    if (!isOpen) return; // Only load when modal is open

    if (documentData.processMapContent) {
      if (documentData.processMapContent.nodes?.length > 0) {
        const loadedNodes = documentData.processMapContent.nodes;
        const loadedEdges = documentData.processMapContent.edges || [];
        setNodes(loadedNodes);
        setEdges(loadedEdges);
        // Initialize history
        setHistory([{ nodes: loadedNodes, edges: loadedEdges }]);
        setHistoryIndex(0);
      } else {
        // Initialize with a start node if empty
        const initialNode: Node = {
          id: "1",
          type: "start",
          data: { label: t("start") || "Start" },
          position: { x: 250, y: 50 },
        };
        setNodes([initialNode]);
        setHistory([{ nodes: [initialNode], edges: [] }]);
        setHistoryIndex(0);
      }
    }
    // Only run when modal opens or document ID changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, documentData.id]);

  const onConnect = useCallback(
    (connection: Connection) => {
      const edge = {
        ...connection,
        type: "smoothstep",
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
        style: { stroke: "#3b82f6", strokeWidth: 2 },
      };
      setEdges((eds) => addEdge(edge, eds));
      setHasChanges(true);
      setTimeout(saveToHistory, 100);
    },
    [setEdges, saveToHistory],
  );

  const handleAddNode = () => {
    if (!nodeLabel.trim()) return;

    const newNode: Node = {
      id: `${Date.now()}`,
      type: selectedNodeType,
      data: { label: nodeLabel },
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 300 + 100,
      },
    };

    setNodes((nds) => [...nds, newNode]);
    setNodeLabel("");
    setShowAddNodePanel(false);
    setHasChanges(true);
    setTimeout(saveToHistory, 100);
  };

  const handleDeleteSelected = () => {
    const hasSelection =
      nodes.some((n) => n.selected) || edges.some((e) => e.selected);
    if (!hasSelection) return;

    setNodes((nds) => nds.filter((node) => !node.selected));
    setEdges((eds) => eds.filter((edge) => !edge.selected));
    setHasChanges(true);
    setTimeout(saveToHistory, 100);
  };

  const handleUndo = useCallback(() => {
    if (canUndo) {
      const newIndex = historyIndex - 1;
      const prevState = history[newIndex];
      setNodes(prevState.nodes);
      setEdges(prevState.edges);
      setHistoryIndex(newIndex);
      setHasChanges(true);
    }
  }, [canUndo, history, historyIndex, setNodes, setEdges]);

  const handleRedo = useCallback(() => {
    if (canRedo) {
      const newIndex = historyIndex + 1;
      const nextState = history[newIndex];
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      setHistoryIndex(newIndex);
      setHasChanges(true);
    }
  }, [canRedo, history, historyIndex, setNodes, setEdges]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isOpen) return;

      // Undo: Ctrl+Z / Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Redo: Ctrl+Shift+Z / Cmd+Shift+Z or Ctrl+Y
      if (
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "z") ||
        (e.ctrlKey && e.key === "y")
      ) {
        e.preventDefault();
        handleRedo();
      }
      // Delete: Delete/Backspace
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        handleDeleteSelected();
      }
      // Help: ?
      if (e.key === "?") {
        e.preventDefault();
        setShowHelp(true);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isOpen, handleUndo, handleRedo, handleDeleteSelected]);

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
    if (
      window.confirm(
        t("confirmClearProcessMap") ||
          "Are you sure you want to clear the entire process map?",
      )
    ) {
      setNodes([]);
      setEdges([]);
      setHasChanges(true);
      setTimeout(saveToHistory, 100);
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
    setTimeout(saveToHistory, 100);
  };

  const handleExportPNG = useCallback(async () => {
    if (!reactFlowWrapper.current) return;

    setIsExporting(true);
    try {
      const nodesBounds = getRectOfNodes(getNodes());
      const transform = getTransformForBounds(
        nodesBounds,
        1920,
        1080,
        0.5,
        2,
        0.1,
      );

      const dataUrl = await toPng(reactFlowWrapper.current, {
        backgroundColor: "#ffffff",
        width: 1920,
        height: 1080,
        style: {
          width: "1920px",
          height: "1080px",
          transform: `translate(${transform[0]}px, ${transform[1]}px) scale(${transform[2]})`,
        },
      });

      const link = document.createElement("a");
      link.download = `${documentData.name.en.replace(
        /\s+/g,
        "_",
      )}_process_map.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  }, [reactFlowWrapper, getNodes, documentData.name.en]);

  // SVG Export
  const handleExportSVG = useCallback(async () => {
    setIsExporting(true);
    try {
      const svg = reactFlowWrapper.current?.querySelector(
        ".react-flow__viewport",
      );
      if (!svg) return;

      const svgData = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([svgData], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.download = `${documentData.name.en.replace(
        /\\s+/g,
        "_",
      )}_process_map.svg`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("SVG Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  }, [reactFlowWrapper, documentData.name.en]);

  // Template loading
  const handleLoadTemplate = (template: Template) => {
    const newNodes = template.nodes.map((n) => ({
      ...n,
      id: `${Date.now()}-${Math.random()}`,
    })) as Node[];

    const newEdges = template.edges.map((e) => ({
      ...e,
      id: `e-${Date.now()}-${Math.random()}`,
      type: "smoothstep",
      animated: true,
      markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
      style: { stroke: "#3b82f6", strokeWidth: 2 },
    })) as Edge[];

    setNodes(newNodes);
    setEdges(newEdges);
    setShowTemplates(false);
    setHasChanges(true);
    setTimeout(saveToHistory, 100);
  };

  // Node color customization
  const handleChangeNodeColor = (color: string) => {
    if (!selectedNodeForColor) return;

    setNodes((nds) =>
      nds.map((node) =>
        node.id === selectedNodeForColor
          ? { ...node, data: { ...node.data, customColor: color } }
          : node,
      ),
    );
    setHasChanges(true);
    setShowColorPicker(false);
    setSelectedNodeForColor(null);
    setTimeout(saveToHistory, 100);
  };

  // Multi-select operations
  const handleDuplicateSelected = () => {
    const selectedNodes = nodes.filter((n) => n.selected);
    if (selectedNodes.length === 0) return;

    const duplicatedNodes = selectedNodes.map((node) => ({
      ...node,
      id: `${Date.now()}-${Math.random()}`,
      position: {
        x: node.position.x + 50,
        y: node.position.y + 50,
      },
      selected: false,
    }));

    setNodes((nds) => [
      ...nds.map((n) => ({ ...n, selected: false })),
      ...duplicatedNodes,
    ]);
    setHasChanges(true);
    setTimeout(saveToHistory, 100);
  };

  const handleAlignSelected = (direction: "horizontal" | "vertical") => {
    const selectedNodes = nodes.filter((n) => n.selected);
    if (selectedNodes.length < 2) return;

    if (direction === "horizontal") {
      const avgY =
        selectedNodes.reduce((sum, n) => sum + n.position.y, 0) /
        selectedNodes.length;
      setNodes((nds) =>
        nds.map((node) =>
          node.selected
            ? { ...node, position: { ...node.position, y: avgY } }
            : node,
        ),
      );
    } else {
      const avgX =
        selectedNodes.reduce((sum, n) => sum + n.position.x, 0) /
        selectedNodes.length;
      setNodes((nds) =>
        nds.map((node) =>
          node.selected
            ? { ...node, position: { ...node.position, x: avgX } }
            : node,
        ),
      );
    }

    setHasChanges(true);
    setTimeout(saveToHistory, 100);
  };

  return (
    <>
      <header className="p-4 border-b dark:border-dark-brand-border flex justify-between items-center flex-shrink-0 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div>
          <h3 className="text-xl font-semibold dark:text-dark-brand-text-primary flex items-center gap-2">
            <span className="text-2xl">🗺️</span>
            {documentData.name[lang]}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            v{documentData.currentVersion} -{" "}
            {t(
              (documentData.status.charAt(0).toLowerCase() +
                documentData.status.slice(1).replace(" ", "")) as any,
            )}
            {hasChanges && (
              <span className="ml-2 text-yellow-600 dark:text-yellow-500 animate-pulse">
                ● {t("unsavedChanges") || "Unsaved changes"}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHelp(true)}
            className="p-2 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-white dark:hover:bg-gray-700 transition-colors"
            title={t("help") || "Help (Press ?)"}
          >
            <QuestionMarkCircleIcon className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-2 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* AI-Powered Toolbar */}
      <div className="border-b border-gray-300 dark:border-gray-700 p-3 flex flex-wrap gap-2 bg-rose-50 dark:bg-pink-900/20">
        <div className="flex items-center gap-2 text-sm font-semibold text-pink-600 dark:text-rose-300">
          <span className="text-lg">✨</span>
          AI Tools:
        </div>
        <button
          onClick={() => setShowAIGenerator(true)}
          disabled={isAIProcessing}
          className="px-3 py-1.5 text-sm rounded bg-rose-600 text-white hover:bg-pink-600 disabled:opacity-50 transition-colors flex items-center gap-1.5"
        >
          🤖 Generate from Text
        </button>
        <button
          onClick={handleGetSuggestions}
          disabled={isAIProcessing || nodes.length === 0}
          className="px-3 py-1.5 text-sm rounded bg-rose-600 text-white hover:bg-pink-600 disabled:opacity-50 transition-colors flex items-center gap-1.5"
        >
          💡 Suggest Next Steps
        </button>
        <button
          onClick={handleOptimizeProcess}
          disabled={isAIProcessing || nodes.length === 0}
          className="px-3 py-1.5 text-sm rounded bg-rose-600 text-white hover:bg-pink-600 disabled:opacity-50 transition-colors flex items-center gap-1.5"
        >
          ⚡ Optimize Process
        </button>
        <button
          onClick={handleGenerateDocumentation}
          disabled={isAIProcessing || nodes.length === 0}
          className="px-3 py-1.5 text-sm rounded bg-rose-600 text-white hover:bg-pink-600 disabled:opacity-50 transition-colors flex items-center gap-1.5"
        >
          📄 Export to Document
        </button>
        <button
          onClick={() => setShowComplianceCheck(true)}
          disabled={isAIProcessing || nodes.length === 0}
          className="px-3 py-1.5 text-sm rounded bg-rose-600 text-white hover:bg-pink-600 disabled:opacity-50 transition-colors flex items-center gap-1.5"
        >
          ✅ Check Compliance
        </button>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowNodeSearch(true)}
            className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-1.5"
          >
            🔍 Search Nodes
          </button>
          <button
            onClick={() => setQuickAddMode(!quickAddMode)}
            className={`px-3 py-1.5 text-sm rounded transition-colors flex items-center gap-1.5 ${
              quickAddMode
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-gray-600 text-white hover:bg-gray-700"
            }`}
          >
            ⚡ Quick Add {quickAddMode && "(Active)"}
          </button>
          <button
            onClick={() => setShowSwimlanes(!showSwimlanes)}
            className="px-3 py-1.5 text-sm rounded bg-sky-600 text-white hover:bg-sky-700 transition-colors flex items-center gap-1.5"
          >
            🏊 Swimlanes
          </button>
          <button
            onClick={() => setShowMetrics(!showMetrics)}
            className="px-3 py-1.5 text-sm rounded bg-orange-600 text-white hover:bg-orange-700 transition-colors flex items-center gap-1.5"
          >
            📊 Metrics
          </button>
        </div>

        {isAIProcessing && (
          <div className="w-full flex items-center gap-2 text-sm text-pink-600 dark:text-rose-300 mt-2">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            AI is processing...
          </div>
        )}
      </div>
      <main className="flex-grow overflow-hidden relative">
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
          snapToGrid={snapToGrid}
          snapGrid={[15, 15]}
          className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800"
          defaultEdgeOptions={{
            type: "smoothstep",
            animated: true,
            style: { strokeWidth: 2 },
          }}
        >
          <Background
            color="#93c5fd"
            gap={snapToGrid ? 15 : 16}
            size={snapToGrid ? 2 : 1}
          />
          <Controls
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
            showInteractive={false}
          />
          <MiniMap
            nodeColor={(node) => {
              switch (node.type) {
                case "start":
                  return "#10b981";
                case "end":
                  return "#ef4444";
                case "decision":
                  return "#eab308";
                default:
                  return "#3b82f6";
              }
            }}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
            maskColor="rgba(0, 0, 0, 0.1)"
          />

          {/* Top Action Bar */}
          <Panel position="top-left" className="flex gap-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-2 flex gap-2 border border-gray-200 dark:border-gray-700">
              <button
                onClick={handleUndo}
                disabled={!canUndo}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title={t("undo") || "Undo (Ctrl+Z)"}
              >
                <ArrowUturnLeftIcon className="w-5 h-5" />
              </button>
              <button
                onClick={handleRedo}
                disabled={!canRedo}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title={t("redo") || "Redo (Ctrl+Shift+Z)"}
              >
                <ArrowUturnRightIcon className="w-5 h-5" />
              </button>
              <div className="w-px bg-gray-300 dark:bg-gray-600"></div>
              <button
                onClick={zoomIn}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                title={t("zoomIn") || "Zoom In"}
              >
                <MagnifyingGlassPlusIcon className="w-5 h-5" />
              </button>
              <button
                onClick={zoomOut}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                title={t("zoomOut") || "Zoom Out"}
              >
                <MagnifyingGlassMinusIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => fitView({ padding: 0.2, duration: 400 })}
                className="p-2 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all text-sm font-medium"
                title={t("fitView") || "Fit View"}
              >
                {t("fit") || "Fit"}
              </button>
              <div className="w-px bg-gray-300 dark:bg-gray-600"></div>
              <button
                onClick={
                  exportFormat === "png" ? handleExportPNG : handleExportSVG
                }
                disabled={isExporting}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all disabled:opacity-50"
                title={`Export as ${exportFormat.toUpperCase()}`}
              >
                <PhotoIcon className="w-5 h-5" />
              </button>
              <select
                value={exportFormat}
                onChange={(e) =>
                  setExportFormat(e.target.value as "png" | "svg")
                }
                className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 border-none focus:ring-2 focus:ring-sky-500"
                title="Export format"
              >
                <option value="png">PNG</option>
                <option value="svg">SVG</option>
              </select>
              <div className="w-px bg-gray-300 dark:bg-gray-600"></div>
              <button
                onClick={() => setSnapToGrid(!snapToGrid)}
                className={`p-2 rounded-lg transition-all ${
                  snapToGrid
                    ? "bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-300"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
                title={snapToGrid ? "Snap to Grid: ON" : "Snap to Grid: OFF"}
              >
                <span className="text-lg">⊞</span>
              </button>
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                title="Templates"
              >
                <span className="text-lg">📋</span>
              </button>
            </div>
          </Panel>

          {/* Node Controls Panel */}
          <Panel
            position="top-right"
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-3 space-y-2 border border-gray-200 dark:border-gray-700 max-w-xs"
          >
            <button
              onClick={() => setShowAddNodePanel(!showAddNodePanel)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-lg hover:from-sky-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <PlusIcon className="w-5 h-5" />
              <span className="font-semibold">
                {t("addNode") || "Add Node"}
              </span>
            </button>

            {showAddNodePanel && (
              <div className="space-y-3 p-4 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 rounded-lg border border-gray-200 dark:border-gray-600 animate-fadeIn">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t("nodeType") || "Node Type"}
                  </label>
                  <select
                    value={selectedNodeType}
                    onChange={(e) => setSelectedNodeType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-lg dark:bg-gray-800 dark:text-white text-sm focus:ring-2 focus:ring-sky-500 transition-all"
                  >
                    <option value="start">
                      ▶️ {t("startNode") || "Start"}
                    </option>
                    <option value="process">
                      ⚙️ {t("processNode") || "Process"}
                    </option>
                    <option value="decision">
                      ◆ {t("decisionNode") || "Decision"}
                    </option>
                    <option value="end">⏹️ {t("endNode") || "End"}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t("nodeLabel") || "Label"}
                  </label>
                  <input
                    type="text"
                    value={nodeLabel}
                    onChange={(e) => setNodeLabel(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddNode()}
                    placeholder={t("enterNodeLabel") || "Enter label..."}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-lg dark:bg-gray-800 dark:text-white text-sm focus:ring-2 focus:ring-sky-500 transition-all"
                    autoFocus
                  />
                </div>

                <button
                  onClick={handleAddNode}
                  disabled={!nodeLabel.trim()}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold shadow-md"
                >
                  <CheckIcon className="w-4 h-4" />
                  {t("add") || "Add"}
                </button>
              </div>
            )}

            <div className="w-full h-px bg-gray-300 dark:bg-gray-600"></div>

            {/* Multi-select operations */}
            {nodes.some((n) => n.selected) && (
              <div className="space-y-2 p-3 bg-sky-50 dark:bg-sky-900/20 rounded-lg border border-sky-200 dark:border-sky-800">
                <p className="text-xs font-bold text-sky-700 dark:text-sky-300 mb-2">
                  ✨ Multi-Select Tools
                </p>
                <button
                  onClick={handleDuplicateSelected}
                  className="w-full px-3 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all text-xs font-medium shadow-sm"
                >
                  📋 Duplicate
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAlignSelected("horizontal")}
                    className="flex-1 px-2 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all text-xs font-medium"
                    title="Align horizontally"
                  >
                    ↔️ Align H
                  </button>
                  <button
                    onClick={() => handleAlignSelected("vertical")}
                    className="flex-1 px-2 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all text-xs font-medium"
                    title="Align vertically"
                  >
                    ↕️ Align V
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={handleDeleteSelected}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all shadow-md font-medium"
              title={
                t("deleteSelectedHint") || "Delete selected nodes/edges (Del)"
              }
            >
              <TrashIcon className="w-4 h-4" />
              {t("deleteSelected") || "Delete Selected"}
            </button>

            <button
              onClick={handleAutoLayout}
              className="w-full px-4 py-2 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all text-sm font-medium shadow-md"
            >
              {t("autoLayout") || "✨ Auto Layout"}
            </button>

            <button
              onClick={handleClear}
              className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all text-sm font-medium border border-gray-300 dark:border-gray-600"
            >
              {t("clearAll") || "Clear All"}
            </button>
          </Panel>

          <Panel
            position="bottom-left"
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-5 border-2 border-gray-200 dark:border-gray-700 max-w-[220px]"
          >
            <div className="space-y-3">
              <div className="font-bold text-base text-gray-800 dark:text-gray-200 mb-3 flex flex-col gap-1 pb-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📋</span>
                  <span>{t("legend") || "Legend"}</span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">
                  Node types available
                </span>
              </div>
              <div className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 rounded-lg transition-colors cursor-default">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-green-600 shadow-lg flex items-center justify-center">
                  <span className="text-xs">▶️</span>
                </div>
                <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                  {t("startNode") || "Start"}
                </span>
              </div>
              <div className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 rounded-lg transition-colors cursor-default">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg flex items-center justify-center">
                  <span className="text-xs">⚙️</span>
                </div>
                <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                  {t("processNode") || "Process"}
                </span>
              </div>
              <div className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 rounded-lg transition-colors cursor-default">
                <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-yellow-500 transform rotate-45 shadow-lg flex items-center justify-center">
                  <span className="text-xs transform -rotate-45">◆</span>
                </div>
                <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                  {t("decisionNode") || "Decision"}
                </span>
              </div>
              <div className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 rounded-lg transition-colors cursor-default">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-500 to-red-600 shadow-lg flex items-center justify-center">
                  <span className="text-xs">⏹️</span>
                </div>
                <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                  {t("endNode") || "End"}
                </span>
              </div>
            </div>
          </Panel>

          <Panel position="bottom-center" className="hidden sm:block">
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/40 dark:to-cyan-900/40 rounded-xl shadow-2xl px-6 py-3 border-2 border-blue-200 dark:border-blue-700 backdrop-blur-sm">
              <div className="flex items-center gap-4 max-w-5xl">
                <span className="text-2xl flex-shrink-0">💡</span>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <span className="font-bold text-sky-700 dark:text-sky-300 text-sm whitespace-nowrap">
                    {t("quickTips") || "Quick Tips:"}
                  </span>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                      <span className="font-semibold">Move:</span> Drag nodes
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                      <span className="font-semibold">Connect:</span> Drag from{" "}
                      <span className="inline-block w-3 h-3 rounded-full bg-blue-500 border-2 border-white"></span>{" "}
                      to{" "}
                      <span className="inline-block w-3 h-3 rounded-full bg-blue-500 border-2 border-white"></span>
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                      <span className="font-semibold">Delete:</span> Select &
                      press Del
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      Press{" "}
                      <span className="px-1.5 py-0.5 bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 rounded font-mono text-xs">
                        ?
                      </span>{" "}
                      for help
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Panel>
        </ReactFlow>
      </main>

      <footer className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 px-6 py-4 flex justify-between items-center border-t dark:border-dark-brand-border flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <span className="text-sky-600 dark:text-sky-400 font-bold">
              {nodes.length}
            </span>{" "}
            {t("nodes") || "nodes"}
          </div>
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <span className="text-blue-600 dark:text-blue-400 font-bold">
              {edges.length}
            </span>{" "}
            {t("connections") || "connections"}
          </div>
          {isExporting && (
            <div className="text-sm text-sky-600 dark:text-sky-400 animate-pulse">
              {t("exporting") || "Exporting..."}
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-5 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
          >
            {t("close")}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="inline-flex items-center justify-center gap-2 py-2 px-6 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>{t("saving") || "Saving..."}</span>
              </>
            ) : (
              <>
                <CheckIcon className="w-4 h-4" />
                <span>{t("saveChanges") || "Save Changes"}</span>
              </>
            )}
          </button>
        </div>
      </footer>

      {/* Templates Modal */}
      {showTemplates && (
        <div
          className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm"
          onClick={() => setShowTemplates(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full m-4 p-6 border border-gray-200 dark:border-gray-700 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="text-3xl">📋</span>
                {t("processMapTemplates") || "Process Map Templates"}
              </h3>
              <button
                onClick={() => setShowTemplates(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label={t("close")}
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              {t("chooseTemplateDescription")}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="border-2 border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:border-sky-500 dark:hover:border-sky-400 transition-all cursor-pointer hover:shadow-lg group"
                  onClick={() => handleLoadTemplate(template)}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-5xl flex-shrink-0 group-hover:scale-110 transition-transform">
                      {template.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                        {t(template.id.replace(/-/g, "")) || template.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {t(`${template.id.replace(/-/g, "")}Description`) ||
                          template.description}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                          {template.nodes.length} {t("nodes")}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          {template.edges.length} {t("connections")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button className="w-full px-4 py-2 bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-lg hover:from-sky-700 hover:to-blue-700 transition-all font-medium text-sm">
                      {t("loadTemplate") || "Load Template"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                ⚠️ <strong>{t("note") || "Note"}:</strong>{" "}
                {t("templateWarning")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div
          className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full m-4 p-6 border border-gray-200 dark:border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="text-2xl">❓</span>
                {t("helpAndShortcuts") || "Help & Keyboard Shortcuts"}
              </h3>
              <button
                onClick={() => setShowHelp(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4 text-sm">
              <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
                  <span className="text-xl">🔗</span>
                  {t("howToConnect") || "How to Connect Nodes"}
                </h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      1
                    </span>
                    <p className="text-gray-700 dark:text-gray-300">
                      <strong>Find the colored dots</strong> (handles) on the
                      edges of each node. They look like this:{" "}
                      <span className="inline-block w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-md mx-1"></span>
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      2
                    </span>
                    <p className="text-gray-700 dark:text-gray-300">
                      <strong>Click and drag</strong> from one node's handle to
                      another node's handle
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      3
                    </span>
                    <p className="text-gray-700 dark:text-gray-300">
                      Release when you see the target handle{" "}
                      <strong>highlighted</strong> - a connection line will
                      appear!
                    </p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      💡 <strong>Tip:</strong> Handles get bigger when you hover
                      over them. If you select a node, its handles will pulse to
                      show where you can connect!
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {t("basicActions") || "Basic Actions"}
                </h4>
                <ul className="space-y-1 text-gray-700 dark:text-gray-300">
                  <li>
                    • <strong>{t("moveNodes") || "Move nodes"}:</strong>{" "}
                    {t("clickAndDrag") || "Click and drag"}
                  </li>
                  <li>
                    •{" "}
                    <strong>{t("selectMultiple") || "Select multiple"}:</strong>{" "}
                    {t("clickAndDragCanvas") || "Click and drag on canvas"}
                  </li>
                  <li>
                    • <strong>{t("pan") || "Pan"}:</strong>{" "}
                    {t("dragCanvas") || "Drag canvas background"}
                  </li>
                  <li>
                    • <strong>{t("zoom") || "Zoom"}:</strong>{" "}
                    {t("mouseWheel") || "Mouse wheel or pinch"}
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {t("keyboardShortcuts") || "Keyboard Shortcuts"}
                </h4>
                <ul className="space-y-1 text-gray-700 dark:text-gray-300">
                  <li>
                    •{" "}
                    <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">
                      Ctrl+Z
                    </kbd>{" "}
                    - {t("undo") || "Undo"}
                  </li>
                  <li>
                    •{" "}
                    <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">
                      Ctrl+Shift+Z
                    </kbd>{" "}
                    - {t("redo") || "Redo"}
                  </li>
                  <li>
                    •{" "}
                    <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">
                      Delete
                    </kbd>{" "}
                    - {t("deleteSelected") || "Delete selected"}
                  </li>
                  <li>
                    •{" "}
                    <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">
                      ?
                    </kbd>{" "}
                    - {t("showHelp") || "Show this help"}
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {t("nodeTypes") || "Node Types"}
                </h4>
                <ul className="space-y-1 text-gray-700 dark:text-gray-300">
                  <li>
                    •{" "}
                    <span className="text-green-600 dark:text-green-400">
                      ▶️ {t("start") || "Start"}
                    </span>{" "}
                    - {t("startDescription") || "Beginning of the process"}
                  </li>
                  <li>
                    •{" "}
                    <span className="text-blue-600 dark:text-blue-400">
                      ⚙️ {t("process") || "Process"}
                    </span>{" "}
                    - {t("processDescription") || "An action or step"}
                  </li>
                  <li>
                    •{" "}
                    <span className="text-yellow-600 dark:text-yellow-500">
                      ◆ {t("decision") || "Decision"}
                    </span>{" "}
                    - {t("decisionDescription") || "A decision point (yes/no)"}
                  </li>
                  <li>
                    •{" "}
                    <span className="text-red-600 dark:text-red-400">
                      ⏹️ {t("end") || "End"}
                    </span>{" "}
                    - {t("endDescription") || "End of the process"}
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowHelp(false)}
                className="px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors font-medium"
              >
                {t("gotIt") || "Got it!"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Generator Modal */}
      {showAIGenerator && (
        <div
          className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm"
          onClick={() => setShowAIGenerator(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full m-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-2xl">🤖</span>
              Generate Process Map from Description
            </h3>
            <textarea
              value={aiDescription}
              onChange={(e) => setAiDescription(e.target.value)}
              placeholder="Describe your process in detail. For example: 'Create a document review process where documents are submitted, reviewed by a manager, approved or rejected, and then either published or sent back for revision.'"
              className="w-full h-48 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none"
            />
            <div className="mt-4 flex gap-2 justify-end">
              <button
                onClick={() => setShowAIGenerator(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateFromAI}
                disabled={isAIProcessing || !aiDescription.trim()}
                className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50"
              >
                {isAIProcessing ? "Generating..." : "Generate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Suggestions Panel */}
      {aiSuggestions.length > 0 && (
        <div className="absolute top-20 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-4 max-w-sm z-40 border-2 border-rose-500">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-pink-600 dark:text-rose-300 flex items-center gap-2">
              <span>💡</span>
              Suggested Next Steps
            </h4>
            <button
              onClick={() => setAiSuggestions([])}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            {aiSuggestions.map((suggestion, idx) => (
              <div
                key={idx}
                className="p-3 bg-rose-50 dark:bg-pink-900/20 rounded-lg border border-rose-200 dark:border-pink-700"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">
                    {suggestion.type === "process" && "⚙️"}
                    {suggestion.type === "decision" && "◆"}
                    {suggestion.type === "end" && "⏹️"}
                  </span>
                  <strong className="text-sm">{suggestion.label}</strong>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  {suggestion.rationale}
                </p>
                <button
                  onClick={() => handleAddSuggestedNode(suggestion)}
                  className="w-full px-3 py-1 text-xs bg-rose-600 text-white rounded hover:bg-pink-600"
                >
                  Add This Step
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Optimizations Modal */}
      {showOptimizations && (
        <div
          className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm"
          onClick={() => setShowOptimizations(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full m-4 p-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              Process Optimization Suggestions
            </h3>
            {optimizations.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">
                No optimizations suggested. Your process looks good!
              </p>
            ) : (
              <div className="space-y-3">
                {optimizations.map((opt, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border-2 ${
                      opt.priority === "high"
                        ? "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800"
                        : opt.priority === "medium"
                          ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-800"
                          : "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-800"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">
                        {opt.category === "efficiency" && "⚡"}
                        {opt.category === "clarity" && "🔍"}
                        {opt.category === "compliance" && "✅"}
                        {opt.category === "structure" && "🏗️"}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 text-xs font-bold rounded ${
                              opt.priority === "high"
                                ? "bg-red-200 dark:bg-red-900 text-red-900 dark:text-red-100"
                                : opt.priority === "medium"
                                  ? "bg-yellow-200 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100"
                                  : "bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-100"
                            }`}
                          >
                            {opt.priority.toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {opt.category}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800 dark:text-gray-200">
                          {opt.suggestion}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowOptimizations(false)}
                className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-pink-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compliance Check Modal */}
      {showComplianceCheck && (
        <div
          className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm"
          onClick={() => setShowComplianceCheck(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full m-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-2xl">✅</span>
              Compliance Check
            </h3>
            {!complianceResult ? (
              <div>
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  Select a standard to check against:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleCheckCompliance("ISO 9001")}
                    className="p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30"
                  >
                    <div className="font-bold text-blue-900 dark:text-blue-100">
                      ISO 9001
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Quality Management
                    </div>
                  </button>
                  <button
                    onClick={() => handleCheckCompliance("ISO 27001")}
                    className="p-4 bg-rose-50 dark:bg-pink-900/20 border-2 border-rose-300 dark:border-pink-700 rounded-lg hover:bg-rose-100 dark:hover:bg-pink-900/30"
                  >
                    <div className="font-bold text-pink-900 dark:text-rose-100">
                      ISO 27001
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Information Security
                    </div>
                  </button>
                  <button
                    onClick={() => handleCheckCompliance("SOX")}
                    className="p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-800 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30"
                  >
                    <div className="font-bold text-green-900 dark:text-green-100">
                      SOX
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Financial Controls
                    </div>
                  </button>
                  <button
                    onClick={() => handleCheckCompliance("OHAS")}
                    className="p-4 bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-300 dark:border-orange-800 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30"
                  >
                    <div className="font-bold text-orange-900 dark:text-orange-100">
                      OHAS
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Health & Safety
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div
                  className={`p-4 rounded-lg mb-4 ${
                    complianceResult.compliant
                      ? "bg-green-50 dark:bg-green-900/20 border-2 border-green-300"
                      : "bg-red-50 dark:bg-red-900/20 border-2 border-red-300"
                  }`}
                >
                  <div className="flex items-center gap-2 text-lg font-bold mb-2">
                    <span>{complianceResult.compliant ? "✅" : "❌"}</span>
                    <span>
                      {complianceResult.compliant
                        ? "Compliant"
                        : "Non-Compliant"}
                    </span>
                  </div>
                </div>

                {complianceResult.issues?.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-bold text-red-700 dark:text-red-300 mb-2">
                      Issues Found:
                    </h4>
                    <ul className="space-y-1">
                      {complianceResult.issues.map(
                        (issue: string, idx: number) => (
                          <li
                            key={idx}
                            className="text-sm text-gray-700 dark:text-gray-300"
                          >
                            • {issue}
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                )}

                {complianceResult.recommendations?.length > 0 && (
                  <div>
                    <h4 className="font-bold text-blue-700 dark:text-blue-300 mb-2">
                      Recommendations:
                    </h4>
                    <ul className="space-y-1">
                      {complianceResult.recommendations.map(
                        (rec: string, idx: number) => (
                          <li
                            key={idx}
                            className="text-sm text-gray-700 dark:text-gray-300"
                          >
                            • {rec}
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}
            <div className="mt-4 flex gap-2 justify-end">
              {complianceResult && (
                <button
                  onClick={() => setComplianceResult(null)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Check Another
                </button>
              )}
              <button
                onClick={() => {
                  setShowComplianceCheck(false);
                  setComplianceResult(null);
                }}
                className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-pink-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Node Search Modal */}
      {showNodeSearch && (
        <div
          className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm"
          onClick={() => setShowNodeSearch(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full m-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-2xl">🔍</span>
              Search Nodes
            </h3>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleNodeSearch(e.target.value)}
              placeholder="Type to search node labels..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              autoFocus
            />
            <div className="mt-4 max-h-64 overflow-y-auto">
              {nodes
                .filter((n) =>
                  n.data.label.toLowerCase().includes(searchTerm.toLowerCase()),
                )
                .map((node) => (
                  <div
                    key={node.id}
                    className="p-3 mb-2 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer border border-gray-200 dark:border-gray-700"
                    onClick={() => {
                      setNodes((nds) =>
                        nds.map((n) => ({ ...n, selected: n.id === node.id })),
                      );
                      setViewport({
                        x: -node.position.x + 300,
                        y: -node.position.y + 200,
                        zoom: 1.5,
                      });
                      setShowNodeSearch(false);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">
                        {node.type === "start" && "▶️"}
                        {node.type === "end" && "⏹️"}
                        {node.type === "process" && "⚙️"}
                        {node.type === "decision" && "◆"}
                      </span>
                      <span className="font-medium">{node.data.label}</span>
                    </div>
                  </div>
                ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setShowNodeSearch(false);
                  setSearchTerm("");
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Documentation Modal */}
      {showExportDoc && (
        <div
          className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm"
          onClick={() => setShowExportDoc(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full m-4 p-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-2xl">📄</span>
              Process Documentation
            </h3>
            <div
              className="prose dark:prose-invert max-w-none bg-gray-50 dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(exportedDoc),
              }}
            />
            <div className="mt-4 flex gap-2 justify-end">
              <button
                onClick={() => {
                  const blob = new Blob([exportedDoc], { type: "text/html" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${documentData.name.en}_documentation.html`;
                  a.click();
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Download HTML
              </button>
              <button
                onClick={() => setShowExportDoc(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const ProcessMapEditor: React.FC<ProcessMapEditorProps> = (props) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  if (!props.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center backdrop-blur-sm">
      <div
        ref={reactFlowWrapper}
        className="bg-white dark:bg-dark-brand-surface rounded-xl shadow-2xl w-full max-w-7xl h-[90vh] m-4 flex flex-col overflow-hidden"
        dir={props.document.name.ar ? "rtl" : "ltr"}
      >
        <ReactFlowProvider>
          <ProcessMapEditorContent
            {...props}
            reactFlowWrapper={reactFlowWrapper}
          />
        </ReactFlowProvider>
      </div>
    </div>
  );
};

export default ProcessMapEditor;
