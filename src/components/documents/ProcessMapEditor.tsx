import React, { useState, useCallback, useEffect, useRef } from "react";
import DOMPurify from "dompurify";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  BackgroundVariant,
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
  Handle,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";
import { toPng } from "html-to-image";
import { AppDocument } from "../../types";
import { useTranslation } from "../../hooks/useTranslation";
import { aiAgentService } from "@/services/aiAgentService";
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
  SparklesIcon,
  DocumentDuplicateIcon,
  Squares2X2Icon,
} from "../icons";

// ─── Props ────────────────────────────────────────────────────────────────────
interface ProcessMapEditorProps {
  isOpen: boolean;
  onClose: () => void;
  document: AppDocument;
  onSave: (document: AppDocument) => void;
  isSaving?: boolean;
}

// ─── Professional Flat Node Components ────────────────────────────────────────
const handleClass =
  "!w-2.5 !h-2.5 !bg-slate-300 hover:!bg-blue-400 !border-2 !border-white !shadow-sm !transition-colors";

const CustomStartNode = ({ data, selected }: any) => (
  <div className="group relative">
    <Handle type="target" position={Position.Top} className={handleClass} />
    <div
      className={`px-7 py-3 rounded-full shadow-sm min-w-[140px] text-center transition-all duration-150
        bg-emerald-50 dark:bg-emerald-900/30 border
        ${selected ? "border-emerald-400 ring-2 ring-emerald-200/60 dark:ring-emerald-800/40 shadow-md" : "border-emerald-200 dark:border-emerald-700 hover:shadow-md"}`}
    >
      <div className="flex items-center justify-center gap-2.5">
        <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {data.label}
        </span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} className={handleClass} />
  </div>
);

const CustomEndNode = ({ data, selected }: any) => (
  <div className="group relative">
    <Handle type="target" position={Position.Top} className={handleClass} />
    <div
      className={`px-7 py-3 rounded-full shadow-sm min-w-[140px] text-center transition-all duration-150
        bg-rose-50 dark:bg-rose-900/30 border
        ${selected ? "border-rose-400 ring-2 ring-rose-200/60 dark:ring-rose-800/40 shadow-md" : "border-rose-200 dark:border-rose-700 hover:shadow-md"}`}
    >
      <div className="flex items-center justify-center gap-2.5">
        <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {data.label}
        </span>
      </div>
    </div>
  </div>
);

const CustomProcessNode = ({ data, selected }: any) => (
  <div className="group relative">
    <Handle type="target" position={Position.Top} className={handleClass} />
    <div
      className={`relative px-7 py-3.5 rounded-lg shadow-sm min-w-40 text-center transition-all duration-150
        bg-white dark:bg-slate-800 border overflow-hidden
        ${selected ? "border-blue-400 ring-2 ring-blue-200/60 dark:ring-blue-800/40 shadow-md" : "border-slate-200 dark:border-slate-600 hover:shadow-md"}`}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400 rounded-l-lg" />
      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
        {data.label}
      </span>
    </div>
    <Handle type="source" position={Position.Bottom} className={handleClass} />
  </div>
);

const CustomDecisionNode = ({ data, selected }: any) => (
  <div className="group relative" style={{ width: 120, height: 120 }}>
    <Handle
      type="target"
      position={Position.Top}
      className={handleClass}
      style={{ top: -2 }}
    />
    <div
      className={`absolute inset-0 rotate-45 shadow-sm transition-all duration-150
        bg-amber-50 dark:bg-amber-900/30 border rounded-md
        ${selected ? "border-amber-400 ring-2 ring-amber-200/60 dark:ring-amber-800/40 shadow-md" : "border-amber-200 dark:border-amber-700 hover:shadow-md"}`}
    />
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-200 text-center leading-tight px-3">
        {data.label}
      </span>
    </div>
    <Handle
      type="source"
      position={Position.Bottom}
      className={handleClass}
      style={{ bottom: -2 }}
    />
    <Handle
      type="source"
      position={Position.Right}
      id="right"
      className={handleClass}
      style={{ right: -2 }}
    />
    <Handle
      type="source"
      position={Position.Left}
      id="left"
      className={handleClass}
      style={{ left: -2 }}
    />
  </div>
);

const nodeTypes: NodeTypes = {
  start: CustomStartNode,
  end: CustomEndNode,
  process: CustomProcessNode,
  decision: CustomDecisionNode,
};

// ─── History ──────────────────────────────────────────────────────────────────
interface HistoryState {
  nodes: Node[];
  edges: Edge[];
}

// ─── Templates ────────────────────────────────────────────────────────────────
interface Template {
  id: string;
  name: string;
  description: string;
  nodes: Partial<Node>[];
  edges: Partial<Edge>[];
}

const templates: Template[] = [
  {
    id: "simple-flow",
    name: "Simple Flow",
    description: "Start → Process → End",
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
        data: { label: "Process" },
        position: { x: 250, y: 180 },
      },
      {
        id: "3",
        type: "end",
        data: { label: "End" },
        position: { x: 250, y: 310 },
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
    nodes: [
      {
        id: "1",
        type: "start",
        data: { label: "Start" },
        position: { x: 300, y: 50 },
      },
      {
        id: "2",
        type: "decision",
        data: { label: "Decision?" },
        position: { x: 240, y: 180 },
      },
      {
        id: "3",
        type: "process",
        data: { label: "Yes Path" },
        position: { x: 100, y: 370 },
      },
      {
        id: "4",
        type: "process",
        data: { label: "No Path" },
        position: { x: 420, y: 370 },
      },
      {
        id: "5",
        type: "end",
        data: { label: "End" },
        position: { x: 300, y: 520 },
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
    description: "Submit → Review → Approve / Reject",
    nodes: [
      {
        id: "1",
        type: "start",
        data: { label: "Submit" },
        position: { x: 300, y: 50 },
      },
      {
        id: "2",
        type: "process",
        data: { label: "Review" },
        position: { x: 300, y: 180 },
      },
      {
        id: "3",
        type: "decision",
        data: { label: "Approved?" },
        position: { x: 240, y: 330 },
      },
      {
        id: "4",
        type: "process",
        data: { label: "Revise" },
        position: { x: 460, y: 420 },
      },
      {
        id: "5",
        type: "end",
        data: { label: "Complete" },
        position: { x: 160, y: 520 },
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
    description: "Execute tasks simultaneously",
    nodes: [
      {
        id: "1",
        type: "start",
        data: { label: "Start" },
        position: { x: 300, y: 50 },
      },
      {
        id: "2",
        type: "process",
        data: { label: "Task A" },
        position: { x: 100, y: 200 },
      },
      {
        id: "3",
        type: "process",
        data: { label: "Task B" },
        position: { x: 300, y: 200 },
      },
      {
        id: "4",
        type: "process",
        data: { label: "Task C" },
        position: { x: 500, y: 200 },
      },
      {
        id: "5",
        type: "process",
        data: { label: "Merge" },
        position: { x: 300, y: 350 },
      },
      {
        id: "6",
        type: "end",
        data: { label: "End" },
        position: { x: 300, y: 480 },
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

// ─── Default edge style ───────────────────────────────────────────────────────
const defaultEdgeOpts = {
  type: "simplebezier" as const,
  animated: false,
  style: { stroke: "#94a3b8", strokeWidth: 1.5 },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 16,
    height: 16,
    color: "#94a3b8",
  },
};

// ─── Glass panel utility classes ──────────────────────────────────────────────
const glass =
  "bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-700/60 shadow-sm";
const glassRound = `${glass} rounded-lg`;

// ─── Main Content ─────────────────────────────────────────────────────────────
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
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedNodeForColor, setSelectedNodeForColor] = useState<
    string | null
  >(null);
  const [exportFormat, setExportFormat] = useState<"png" | "svg">("png");
  const addPanelRef = useRef<HTMLDivElement>(null);

  // AI states
  const [showAIMenu, setShowAIMenu] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [aiDescription, setAiDescription] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [showOptimizations, setShowOptimizations] = useState(false);
  const [optimizations, setOptimizations] = useState<any[]>([]);
  const [showComplianceCheck, setShowComplianceCheck] = useState(false);
  const [complianceResult, setComplianceResult] = useState<any>(null);
  const [showNodeSearch, setShowNodeSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showExportDoc, setShowExportDoc] = useState(false);
  const [exportedDoc, setExportedDoc] = useState<string | null>(null);
  const aiMenuRef = useRef<HTMLDivElement>(null);

  // Close AI menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        aiMenuRef.current &&
        !aiMenuRef.current.contains(e.target as HTMLElement)
      ) {
        setShowAIMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close add-node panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        addPanelRef.current &&
        !addPanelRef.current.contains(e.target as HTMLElement)
      ) {
        setShowAddNodePanel(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ─── Compliance Check ────────────────────────────────────────────────────
  const handleCheckCompliance = async (standard: string) => {
    setIsAIProcessing(true);
    try {
      const { nodesDesc, edgesDesc } = describeGraph();
      const prompt = `You are a healthcare compliance auditor. Analyze this process map for compliance with the ${standard} standard.
Steps: [${nodesDesc}]
Flow: [${edgesDesc}]

Return ONLY a JSON object (no markdown) with:
- "compliant": boolean
- "score": number 0-100
- "issues": array of specific issue strings
- "recommendations": array of actionable recommendation strings`;
      const response = await aiAgentService.chat(prompt, true);
      const parsed = extractJSON(response.response || "");
      if (parsed && typeof parsed === "object") {
        setComplianceResult({ ...parsed, standard });
      } else {
        setComplianceResult({
          compliant: true,
          standard,
          issues: [],
          recommendations: [response.response || "No issues found."],
        });
      }
    } catch {
      setComplianceResult({
        compliant: false,
        standard,
        issues: [
          t("complianceCheckFailed") ||
            "Compliance check failed. Please try again.",
        ],
        recommendations: [],
      });
    } finally {
      setIsAIProcessing(false);
    }
  };

  const handleNodeSearch = (query: string) => setSearchTerm(query);

  // ─── Undo / Redo ─────────────────────────────────────────────────────────
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const saveToHistory = useCallback(() => {
    const currentState = { nodes: getNodes(), edges: getEdges() };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(currentState);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex, getNodes, getEdges]);

  // ─── Load data ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    if (documentData.processMapContent) {
      if (documentData.processMapContent.nodes?.length > 0) {
        const loadedNodes = documentData.processMapContent.nodes;
        const loadedEdges = documentData.processMapContent.edges || [];
        setNodes(loadedNodes);
        setEdges(loadedEdges);
        setHistory([{ nodes: loadedNodes, edges: loadedEdges }]);
        setHistoryIndex(0);
      } else {
        const initialNode: Node = {
          id: "1",
          type: "start",
          data: { label: t("start") || "Start" },
          position: { x: 300, y: 80 },
        };
        setNodes([initialNode]);
        setHistory([{ nodes: [initialNode], edges: [] }]);
        setHistoryIndex(0);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, documentData.id]);

  // ─── Edge connect ─────────────────────────────────────────────────────────
  const onConnect = useCallback(
    (connection: Connection) => {
      const edge = { ...connection, ...defaultEdgeOpts };
      setEdges((eds) => addEdge(edge, eds));
      setHasChanges(true);
      setTimeout(saveToHistory, 100);
    },
    [setEdges, saveToHistory],
  );

  // ─── Add node ─────────────────────────────────────────────────────────────
  const handleAddNode = () => {
    if (!nodeLabel.trim()) return;
    const newNode: Node = {
      id: `${Date.now()}`,
      type: selectedNodeType,
      data: { label: nodeLabel },
      position: { x: Math.random() * 400 + 150, y: Math.random() * 300 + 100 },
    };
    setNodes((nds) => [...nds, newNode]);
    setNodeLabel("");
    setShowAddNodePanel(false);
    setHasChanges(true);
    setTimeout(saveToHistory, 100);
  };

  // ─── AI Handlers ──────────────────────────────────────────────────────────

  // Helper: extract JSON object from a string that may contain prose around it
  const extractJSON = (text: string): any | null => {
    // Strip markdown fences
    let cleaned = text
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();
    // Try direct parse first
    try {
      return JSON.parse(cleaned);
    } catch {
      /* continue */
    }
    // Find the outermost { ... } block
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        /* continue */
      }
    }
    // Find the outermost [ ... ] block (in case AI returns an array)
    const aStart = cleaned.indexOf("[");
    const aEnd = cleaned.lastIndexOf("]");
    if (aStart !== -1 && aEnd > aStart) {
      try {
        const arr = JSON.parse(cleaned.slice(aStart, aEnd + 1));
        if (Array.isArray(arr)) return arr;
      } catch {
        /* continue */
      }
    }
    return null;
  };

  const describeGraph = useCallback(() => {
    const currentNodes = getNodes();
    const currentEdges = getEdges();
    const nodeMap: Record<string, string> = {};
    currentNodes.forEach((n) => {
      nodeMap[n.id] = `[${n.type}] ${n.data.label}`;
    });
    const nodesDesc = currentNodes
      .map((n) => `${n.type}: "${n.data.label}"`)
      .join(", ");
    const edgesDesc = currentEdges
      .map((e) => {
        const src = nodeMap[e.source] || e.source;
        const tgt = nodeMap[e.target] || e.target;
        return `${src} → ${tgt}${e.label ? ` (${e.label})` : ""}`;
      })
      .join("; ");
    return { nodesDesc, edgesDesc, nodeCount: currentNodes.length };
  }, [getNodes, getEdges]);

  const handleGetSuggestions = useCallback(async () => {
    setIsAIProcessing(true);
    setShowAIMenu(false);
    try {
      const { nodesDesc, edgesDesc } = describeGraph();
      const prompt = `You are a process-map assistant. Given this process map:
Steps: [${nodesDesc}]
Connections: [${edgesDesc}]

Suggest 2-3 logical next steps that would improve or complete this process. Return ONLY a JSON array (no markdown, no commentary). Each item must have:
- "type": one of "process", "decision", or "end"
- "label": short descriptive name (2-5 words)
- "rationale": one sentence explanation
- "connectAfter": the label of the existing node this should connect from`;
      const response = await aiAgentService.chat(prompt, true);
      const parsed = extractJSON(response.response || "");
      if (parsed) {
        const arr = Array.isArray(parsed)
          ? parsed
          : parsed.suggestions || parsed.nodes || [];
        setAiSuggestions(arr.length > 0 ? arr : []);
      } else {
        setAiSuggestions([]);
      }
    } catch {
      setAiSuggestions([]);
    } finally {
      setIsAIProcessing(false);
    }
  }, [describeGraph, extractJSON]);

  const handleOptimizeProcess = useCallback(async () => {
    setIsAIProcessing(true);
    setShowAIMenu(false);
    try {
      const { nodesDesc, edgesDesc } = describeGraph();
      const prompt = `You are a process-map optimization expert. Analyze this process map:
Steps: [${nodesDesc}]
Connections: [${edgesDesc}]

Suggest improvements. Return ONLY a JSON array (no markdown). EVERY item MUST have ALL of these fields:
- "category": one of "efficiency", "clarity", "compliance", "structure"
- "priority": one of "high", "medium", "low"
- "suggestion": one-two sentence actionable recommendation
- "action": REQUIRED object with { "type": "add_node" or "remove_node" or "rename_node", "nodeLabel": "exact label of existing node", "newLabel": "new label (for rename_node and add_node)" }

Every suggestion MUST have a concrete action. For "add_node", nodeLabel is the new node name. For "rename_node", nodeLabel is the current name and newLabel is the improved name. For "remove_node", nodeLabel is the node to remove.`;
      const response = await aiAgentService.chat(prompt, true);
      const parsed = extractJSON(response.response || "");
      if (parsed) {
        const arr = Array.isArray(parsed)
          ? parsed
          : parsed.optimizations || parsed.suggestions || [];
        setOptimizations(
          arr.length > 0
            ? arr
            : [
                {
                  category: "clarity",
                  priority: "medium",
                  suggestion: response.response || "No issues found.",
                },
              ],
        );
      } else {
        setOptimizations([
          {
            category: "clarity",
            priority: "medium",
            suggestion: response.response || "No issues found.",
          },
        ]);
      }
      setShowOptimizations(true);
    } catch {
      setOptimizations([]);
      setShowOptimizations(true);
    } finally {
      setIsAIProcessing(false);
    }
  }, [describeGraph, extractJSON]);

  const handleGenerateDocumentation = useCallback(async () => {
    setIsAIProcessing(true);
    setShowAIMenu(false);
    try {
      const { nodesDesc, edgesDesc } = describeGraph();
      const prompt = `Generate a professional HTML document describing this process map.
Process name: "${documentData.name[lang]}"
Steps: [${nodesDesc}]
Flow: [${edgesDesc}]

Include these sections with proper HTML (h2, h3, p, ul, li, table tags):
1. Overview - brief summary
2. Steps Description - describe each step's purpose
3. Decision Points - explain each decision and its branches
4. Flow Summary - overall flow narrative
5. Recommendations - any improvements

Return ONLY the HTML content. No markdown fences.`;
      const response = await aiAgentService.chat(prompt, true);
      let html = (response.response || "")
        .replace(/```html\s*/gi, "")
        .replace(/```\s*/g, "")
        .trim();
      setExportedDoc(html);
      setShowExportDoc(true);
    } catch {
      setExportedDoc(
        `<p>${t("documentationGenerationFailed") || "Failed to generate documentation. Please try again."}</p>`,
      );
      setShowExportDoc(true);
    } finally {
      setIsAIProcessing(false);
    }
  }, [describeGraph, documentData.name, lang, t]);

  // Helper: build nodes & edges from a parsed AI response and apply them
  const applyGeneratedMap = useCallback(
    (parsed: any) => {
      const rawNodes: any[] = Array.isArray(parsed)
        ? parsed
        : parsed.nodes || parsed.steps || [];
      if (rawNodes.length === 0) return false;

      const ts = Date.now();
      const newNodes: Node[] = rawNodes.map((n: any, i: number) => {
        // Normalise type
        let type = (n.type || "process").toLowerCase();
        if (!["start", "process", "decision", "end"].includes(type))
          type = "process";
        // First node should be start, last should be end if not already set
        if (i === 0 && type === "process") type = "start";
        if (i === rawNodes.length - 1 && type === "process") type = "end";
        // Position: honour AI positions or auto-layout vertically
        const x = typeof n.x === "number" ? n.x : 300;
        const y = typeof n.y === "number" ? n.y : i * 160 + 80;
        return {
          id: `ai-${ts}-${i}`,
          type,
          data: { label: n.label || n.name || n.title || `Step ${i + 1}` },
          position: { x, y },
        };
      });

      // Build id mapping from AI ids → our ids
      const idMap: Record<string, string> = {};
      rawNodes.forEach((n: any, i: number) => {
        const key = String(n.id ?? i);
        idMap[key] = newNodes[i].id;
        // Also map by label in case edges reference labels
        if (n.label) idMap[n.label] = newNodes[i].id;
        if (n.name) idMap[n.name] = newNodes[i].id;
      });

      let newEdges: Edge[] = [];
      if (
        parsed.edges &&
        Array.isArray(parsed.edges) &&
        parsed.edges.length > 0
      ) {
        newEdges = parsed.edges.map((e: any, i: number) => ({
          id: `ai-e-${ts}-${i}`,
          source:
            idMap[String(e.source)] ||
            idMap[e.from] ||
            newNodes[Math.min(i, newNodes.length - 2)]?.id ||
            "",
          target:
            idMap[String(e.target)] ||
            idMap[e.to] ||
            newNodes[Math.min(i + 1, newNodes.length - 1)]?.id ||
            "",
          label: e.label || undefined,
          ...defaultEdgeOpts,
        }));
      } else {
        // No edges provided — connect sequentially
        newEdges = newNodes.slice(0, -1).map((node, i) => ({
          id: `ai-e-${ts}-${i}`,
          source: node.id,
          target: newNodes[i + 1].id,
          ...defaultEdgeOpts,
        }));
      }

      setNodes(newNodes);
      setEdges(newEdges);
      setHasChanges(true);
      setShowAIGenerator(false);
      setAiDescription("");
      setTimeout(saveToHistory, 100);
      setTimeout(() => fitView({ padding: 0.2, duration: 400 }), 250);
      return true;
    },
    [setNodes, setEdges, saveToHistory, fitView],
  );

  // Fallback: convert a plain-text response into a simple linear flowchart
  const buildMapFromText = useCallback(
    (text: string) => {
      // Try to find numbered/bulleted list items
      const lines = text
        .split(/\n/)
        .map((l) => l.replace(/^[\s\-\*\d\.\)]+/, "").trim())
        .filter((l) => l.length > 0 && l.length < 120);
      if (lines.length < 2) return false;
      // Cap at 15 steps for sanity
      const steps = lines.slice(0, 15);
      const ts = Date.now();
      const newNodes: Node[] = steps.map((label, i) => ({
        id: `ai-${ts}-${i}`,
        type: i === 0 ? "start" : i === steps.length - 1 ? "end" : "process",
        data: { label },
        position: { x: 300, y: i * 160 + 80 },
      }));
      const newEdges: Edge[] = newNodes.slice(0, -1).map((node, i) => ({
        id: `ai-e-${ts}-${i}`,
        source: node.id,
        target: newNodes[i + 1].id,
        ...defaultEdgeOpts,
      }));
      setNodes(newNodes);
      setEdges(newEdges);
      setHasChanges(true);
      setShowAIGenerator(false);
      setAiDescription("");
      setTimeout(saveToHistory, 100);
      setTimeout(() => fitView({ padding: 0.2, duration: 400 }), 250);
      return true;
    },
    [setNodes, setEdges, saveToHistory, fitView],
  );

  const [aiGenerateError, setAiGenerateError] = useState<string | null>(null);

  const handleGenerateFromAI = useCallback(async () => {
    if (!aiDescription.trim()) return;
    setIsAIProcessing(true);
    setAiGenerateError(null);
    try {
      const prompt = `You are a process-map generator. Given the user's description, output ONLY a valid JSON object — no explanation, no markdown, no text before or after.

The JSON schema:
{
  "nodes": [
    { "id": "1", "type": "start|process|decision|end", "label": "short name", "x": 300, "y": 80 }
  ],
  "edges": [
    { "source": "1", "target": "2", "label": "optional edge label" }
  ]
}

Rules:
- First node MUST be type "start". Last node MUST be type "end".
- Use "decision" for any yes/no or branching step; connect both branches with labeled edges ("Yes"/"No").
- Position: keep all x at 300 for linear flows. For branches, use x=150 for left path and x=450 for right path.
- Increment y by 160 for each row of nodes.
- Every node must be connected. Every edge source/target must reference a valid node id.
- Return ONLY the JSON object. No markdown fences. No commentary.

User description:
${aiDescription}`;

      const response = await aiAgentService.chat(prompt, true);
      const raw = response.response || "";

      // Strategy 1: Parse structured JSON from the response
      const parsed = extractJSON(raw);
      if (parsed && applyGeneratedMap(parsed)) return;

      // Strategy 2: AI returned prose — try to build a map from text lines
      if (buildMapFromText(raw)) return;

      // Everything failed — show error
      setAiGenerateError(
        t("aiGenerateError") ||
          "Could not generate a process map. Try a more specific description (e.g. 'A patient admission process with triage, registration, assessment, and discharge steps').",
      );
    } catch {
      setAiGenerateError(
        t("aiGenerateError") ||
          "Failed to connect to AI service. Please try again.",
      );
    } finally {
      setIsAIProcessing(false);
    }
  }, [aiDescription, applyGeneratedMap, buildMapFromText, t]);

  const handleAddSuggestedNode = useCallback(
    (suggestion: any) => {
      const existingNodes = getNodes();
      const existingEdges = getEdges();
      const maxY = existingNodes.reduce(
        (max, n) => Math.max(max, n.position.y),
        0,
      );

      // Find the node to connect from
      let connectFromId: string | null = null;
      if (suggestion.connectAfter) {
        const match = existingNodes.find(
          (n) => n.data.label === suggestion.connectAfter,
        );
        if (match) connectFromId = match.id;
      }
      // Fallback: find the last node not already connected as a source to anything
      if (!connectFromId) {
        const sourcesUsed = new Set(existingEdges.map((e) => e.source));
        const leafNodes = existingNodes.filter((n) => !sourcesUsed.has(n.id));
        if (leafNodes.length > 0) {
          // Prefer the one furthest down
          connectFromId = leafNodes.reduce(
            (best, n) => (n.position.y > best.position.y ? n : best),
            leafNodes[0],
          ).id;
        } else if (existingNodes.length > 0) {
          connectFromId = existingNodes[existingNodes.length - 1].id;
        }
      }

      const ts = Date.now();
      const newNode: Node = {
        id: `sug-${ts}`,
        type: suggestion.type || "process",
        data: { label: suggestion.label || "New Node" },
        position: { x: 300, y: maxY + 160 },
      };
      setNodes((nds) => [...nds, newNode]);

      // Auto-connect
      if (connectFromId) {
        const newEdge: Edge = {
          id: `sug-e-${ts}`,
          source: connectFromId,
          target: newNode.id,
          ...defaultEdgeOpts,
        };
        setEdges((eds) => [...eds, newEdge]);
      }

      setHasChanges(true);
      setTimeout(saveToHistory, 100);
      setTimeout(() => fitView({ padding: 0.2, duration: 400 }), 200);
    },
    [setNodes, setEdges, getNodes, getEdges, saveToHistory, fitView],
  );

  const [applyingOptIdx, setApplyingOptIdx] = useState<number | null>(null);

  const handleApplyOptimization = useCallback(
    async (optimization: any, idx: number) => {
      const currentNodes = getNodes();
      let action = optimization.action;

      // If no structured action, ask AI to produce one
      if (!action || !action.type) {
        setApplyingOptIdx(idx);
        try {
          const { nodesDesc } = describeGraph();
          const prompt = `Given this process map with steps: [${nodesDesc}], implement this optimization: "${optimization.suggestion}"

Return ONLY a JSON object with: { "type": "add_node" or "remove_node" or "rename_node", "nodeLabel": "exact existing node label or new node name", "newLabel": "new label for rename" }`;
          const resp = await aiAgentService.chat(prompt, true);
          action = extractJSON(resp.response || "");
        } catch {
          setApplyingOptIdx(null);
          return;
        }
        setApplyingOptIdx(null);
        if (!action || !action.type) return;
      }

      if (
        action.type === "rename_node" &&
        action.nodeLabel &&
        action.newLabel
      ) {
        setNodes((nds) =>
          nds.map((n) =>
            n.data.label === action.nodeLabel
              ? { ...n, data: { ...n.data, label: action.newLabel } }
              : n,
          ),
        );
        setHasChanges(true);
        setTimeout(saveToHistory, 100);
      } else if (action.type === "remove_node" && action.nodeLabel) {
        const target = currentNodes.find(
          (n) => n.data.label === action.nodeLabel,
        );
        if (target) {
          setNodes((nds) => nds.filter((n) => n.id !== target.id));
          setEdges((eds) =>
            eds.filter((e) => e.source !== target.id && e.target !== target.id),
          );
          setHasChanges(true);
          setTimeout(saveToHistory, 100);
        }
      } else if (action.type === "add_node" && action.nodeLabel) {
        const maxY = currentNodes.reduce(
          (max, n) => Math.max(max, n.position.y),
          0,
        );
        const newNode: Node = {
          id: `opt-${Date.now()}`,
          type: "process",
          data: { label: action.nodeLabel || action.newLabel },
          position: { x: 300, y: maxY + 160 },
        };
        setNodes((nds) => [...nds, newNode]);
        setHasChanges(true);
        setTimeout(saveToHistory, 100);
        setTimeout(() => fitView({ padding: 0.2, duration: 400 }), 200);
      }

      // Mark this optimization as applied in the list
      setOptimizations((prev) =>
        prev.map((o, i) => (i === idx ? { ...o, _applied: true } : o)),
      );
    },
    [
      getNodes,
      setNodes,
      setEdges,
      saveToHistory,
      fitView,
      describeGraph,
      extractJSON,
    ],
  );

  // ─── Node operations ──────────────────────────────────────────────────────
  const handleDeleteSelected = useCallback(() => {
    const hasSelection =
      nodes.some((n) => n.selected) || edges.some((e) => e.selected);
    if (!hasSelection) return;
    setNodes((nds) => nds.filter((node) => !node.selected));
    setEdges((eds) => eds.filter((edge) => !edge.selected));
    setHasChanges(true);
    setTimeout(saveToHistory, 100);
  }, [nodes, edges, setNodes, setEdges, saveToHistory]);

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

  const handleDuplicateSelected = () => {
    const selectedNodes = nodes.filter((n) => n.selected);
    if (selectedNodes.length === 0) return;
    const duplicatedNodes = selectedNodes.map((node) => ({
      ...node,
      id: `${Date.now()}-${Math.random()}`,
      position: { x: node.position.x + 50, y: node.position.y + 50 },
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

  // ─── Keyboard shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      if (
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "z") ||
        (e.ctrlKey && e.key === "y")
      ) {
        e.preventDefault();
        handleRedo();
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        const active = document.activeElement;
        if (
          active &&
          (active.tagName === "INPUT" || active.tagName === "TEXTAREA")
        )
          return;
        e.preventDefault();
        handleDeleteSelected();
      }
      if (
        e.key === "?" &&
        !(
          document.activeElement?.tagName === "INPUT" ||
          document.activeElement?.tagName === "TEXTAREA"
        )
      ) {
        e.preventDefault();
        setShowHelp(true);
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isOpen, handleUndo, handleRedo, handleDeleteSelected]);

  // ─── Save / Clear / Auto-Layout ───────────────────────────────────────────
  const handleSave = () => {
    onSave({ ...documentData, processMapContent: { nodes, edges } });
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
    const sorted = [...nodes];
    const layoutNodes = sorted.map((node, index) => ({
      ...node,
      position: { x: 300, y: index * 160 + 80 },
    }));
    setNodes(layoutNodes);
    setHasChanges(true);
    setTimeout(saveToHistory, 100);
    setTimeout(() => fitView({ padding: 0.2, duration: 400 }), 150);
  };

  // ─── Export ───────────────────────────────────────────────────────────────
  const handleExportPNG = useCallback(async () => {
    if (!reactFlowWrapper.current) return;
    setIsExporting(true);
    try {
      // Target the actual flow element, not the outer wrapper
      const flowEl = reactFlowWrapper.current.querySelector(
        ".react-flow",
      ) as HTMLElement;
      if (!flowEl) {
        setIsExporting(false);
        return;
      }

      const currentNodes = getNodes();
      if (currentNodes.length === 0) {
        setIsExporting(false);
        return;
      }

      const nodesBounds = getRectOfNodes(currentNodes);
      // Add padding around nodes
      const padding = 80;
      const imgWidth = Math.max(nodesBounds.width + padding * 2, 800);
      const imgHeight = Math.max(nodesBounds.height + padding * 2, 600);
      const transform = getTransformForBounds(
        nodesBounds,
        imgWidth,
        imgHeight,
        0.5,
        2,
        padding / Math.max(imgWidth, imgHeight),
      );

      const dataUrl = await toPng(flowEl, {
        backgroundColor: "#f8fafc",
        width: imgWidth,
        height: imgHeight,
        skipFonts: true,
        pixelRatio: 2,
        style: {
          width: `${imgWidth}px`,
          height: `${imgHeight}px`,
          transform: `translate(${transform[0]}px, ${transform[1]}px) scale(${transform[2]})`,
        },
      });
      const link = document.createElement("a");
      link.download = `${documentData.name.en.replace(/\s+/g, "_")}_process_map.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Export PNG failed:", error);
    } finally {
      setIsExporting(false);
    }
  }, [reactFlowWrapper, getNodes, documentData.name.en]);

  const handleExportSVG = useCallback(async () => {
    if (!reactFlowWrapper.current) return;
    setIsExporting(true);
    try {
      const currentNodes = getNodes();
      if (currentNodes.length === 0) {
        setIsExporting(false);
        return;
      }

      const nodesBounds = getRectOfNodes(currentNodes);
      const padding = 80;
      const svgWidth = Math.max(nodesBounds.width + padding * 2, 800);
      const svgHeight = Math.max(nodesBounds.height + padding * 2, 600);
      const transform = getTransformForBounds(
        nodesBounds,
        svgWidth,
        svgHeight,
        0.5,
        2,
        padding / Math.max(svgWidth, svgHeight),
      );

      const viewport = reactFlowWrapper.current.querySelector(
        ".react-flow__viewport",
      );
      if (!viewport) {
        setIsExporting(false);
        return;
      }

      const viewportClone = viewport.cloneNode(true) as Element;
      // Build a proper SVG wrapper
      const svgEl = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg",
      );
      svgEl.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      svgEl.setAttribute("width", String(svgWidth));
      svgEl.setAttribute("height", String(svgHeight));
      svgEl.setAttribute("viewBox", `0 0 ${svgWidth} ${svgHeight}`);

      // White background
      const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      bg.setAttribute("width", "100%");
      bg.setAttribute("height", "100%");
      bg.setAttribute("fill", "#f8fafc");
      svgEl.appendChild(bg);

      // Apply transform to position content
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute(
        "transform",
        `translate(${transform[0]}, ${transform[1]}) scale(${transform[2]})`,
      );

      // Inline basic styles
      const style = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "style",
      );
      style.textContent = `
        .react-flow__node { font-family: system-ui, -apple-system, sans-serif; font-size: 14px; }
        .react-flow__edge-path { fill: none; stroke: #94a3b8; stroke-width: 1.5px; }
        .react-flow__arrowhead { fill: #94a3b8; }
        text { font-family: system-ui, -apple-system, sans-serif; }
      `;
      svgEl.appendChild(style);

      // Move cloned viewport content into the g element
      while (viewportClone.firstChild) g.appendChild(viewportClone.firstChild);
      svgEl.appendChild(g);

      const svgData = new XMLSerializer().serializeToString(svgEl);
      const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `${documentData.name.en.replace(/\s+/g, "_")}_process_map.svg`;
      link.href = url;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error("SVG Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  }, [reactFlowWrapper, getNodes, documentData.name.en]);

  // ─── Template loading ─────────────────────────────────────────────────────
  const handleLoadTemplate = (template: Template) => {
    const newNodes = template.nodes.map((n) => ({
      ...n,
      id: `${Date.now()}-${Math.random()}`,
    })) as Node[];
    const newEdges = template.edges.map((e) => ({
      ...e,
      id: `e-${Date.now()}-${Math.random()}`,
      ...defaultEdgeOpts,
    })) as Edge[];
    setNodes(newNodes);
    setEdges(newEdges);
    setShowTemplates(false);
    setHasChanges(true);
    setTimeout(saveToHistory, 100);
    setTimeout(() => fitView({ padding: 0.2, duration: 400 }), 150);
  };

  // ─── Node color ───────────────────────────────────────────────────────────
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

  const hasSelectedNodes = nodes.some((n) => n.selected);

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <>
      {/* ─── Unified Slim Header ──────────────────────────────────────────── */}
      <header
        className={`h-12 px-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-4 shrink-0 relative z-20 ${glass}`}
      >
        {/* Left: title */}
        <div className="flex items-center gap-2.5 min-w-0 shrink">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
            {documentData.name[lang]}
          </h3>
          <span className="text-[11px] text-slate-400 shrink-0">
            v{documentData.currentVersion}
          </span>
          {hasChanges && (
            <span
              className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0"
              title={t("unsavedChanges") || "Unsaved changes"}
            />
          )}
        </div>

        {/* Center: Tool buttons */}
        <div className="flex items-center gap-0.5 flex-1 justify-center">
          {/* Undo / Redo */}
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-25 transition-colors"
            title={t("undo") || "Undo (Ctrl+Z)"}
          >
            <ArrowUturnLeftIcon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-25 transition-colors"
            title={t("redo") || "Redo (Ctrl+Shift+Z)"}
          >
            <ArrowUturnRightIcon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          </button>
          <div className="w-px h-4 bg-slate-200 dark:bg-slate-600 mx-1" />

          {/* Zoom */}
          <button
            onClick={() => zoomIn()}
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title={t("zoomIn") || "Zoom In"}
          >
            <MagnifyingGlassPlusIcon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          </button>
          <button
            onClick={() => zoomOut()}
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title={t("zoomOut") || "Zoom Out"}
          >
            <MagnifyingGlassMinusIcon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          </button>
          <button
            onClick={() => fitView({ padding: 0.2, duration: 400 })}
            className="px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-xs font-medium text-slate-600 dark:text-slate-300"
            title={t("fitView") || "Fit View"}
          >
            {t("fit") || "Fit"}
          </button>
          <div className="w-px h-4 bg-slate-200 dark:bg-slate-600 mx-1" />

          {/* Grid */}
          <button
            onClick={() => setSnapToGrid(!snapToGrid)}
            className={`p-1.5 rounded-md transition-colors ${snapToGrid ? "bg-slate-200 dark:bg-slate-600" : "hover:bg-slate-100 dark:hover:bg-slate-700"}`}
            title={snapToGrid ? "Grid: ON" : "Grid: OFF"}
          >
            <Squares2X2Icon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          </button>
          {/* Export */}
          <button
            onClick={exportFormat === "png" ? handleExportPNG : handleExportSVG}
            disabled={isExporting}
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-40"
            title={`Export ${exportFormat.toUpperCase()}`}
          >
            <PhotoIcon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          </button>
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as "png" | "svg")}
            className="text-[11px] bg-transparent text-slate-500 border-none focus:ring-0 p-0 cursor-pointer"
          >
            <option value="png">PNG</option>
            <option value="svg">SVG</option>
          </select>
          <div className="w-px h-4 bg-slate-200 dark:bg-slate-600 mx-1" />

          {/* Templates */}
          <button
            onClick={() => setShowTemplates(true)}
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title={t("processMapTemplates") || "Templates"}
          >
            <DocumentDuplicateIcon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          </button>
          {/* Auto Layout */}
          <button
            onClick={handleAutoLayout}
            className="px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-xs font-medium text-slate-600 dark:text-slate-300"
            title={t("autoLayout") || "Auto Layout"}
          >
            {t("autoLayout") || "Layout"}
          </button>
          {/* Clear */}
          <button
            onClick={handleClear}
            className="px-2 py-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-xs font-medium text-slate-500 hover:text-red-600"
            title={t("clearAll") || "Clear All"}
          >
            {t("clearAll") || "Clear"}
          </button>
          <div className="w-px h-4 bg-slate-200 dark:bg-slate-600 mx-1" />

          {/* Search */}
          <button
            onClick={() => setShowNodeSearch(true)}
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title={t("searchNodes") || "Search Nodes"}
          >
            <MagnifyingGlassPlusIcon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          </button>

          {/* AI Dropdown */}
          <div className="relative" ref={aiMenuRef}>
            <button
              onClick={() => setShowAIMenu(!showAIMenu)}
              disabled={isAIProcessing}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                showAIMenu || isAIProcessing
                  ? "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300"
                  : "bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/40"
              }`}
            >
              {isAIProcessing ? (
                <svg
                  className="animate-spin w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                <SparklesIcon className="w-3.5 h-3.5" />
              )}
              AI
            </button>
            {showAIMenu && (
              <div
                className={`absolute top-full mt-1 right-0 w-52 py-1 rounded-lg z-50 ${glassRound} shadow-lg`}
              >
                <button
                  onClick={() => {
                    setShowAIGenerator(true);
                    setShowAIMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
                >
                  <SparklesIcon className="w-4 h-4 text-violet-500" />
                  {t("generateFromText") || "Generate from Text"}
                </button>
                <button
                  onClick={handleGetSuggestions}
                  disabled={nodes.length === 0}
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 disabled:opacity-40"
                >
                  <SparklesIcon className="w-4 h-4 text-blue-500" />
                  {t("suggestNextSteps") || "Suggest Next Steps"}
                </button>
                <button
                  onClick={handleOptimizeProcess}
                  disabled={nodes.length === 0}
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 disabled:opacity-40"
                >
                  <SparklesIcon className="w-4 h-4 text-amber-500" />
                  {t("optimizeProcess") || "Optimize Process"}
                </button>
                <button
                  onClick={handleGenerateDocumentation}
                  disabled={nodes.length === 0}
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 disabled:opacity-40"
                >
                  <SparklesIcon className="w-4 h-4 text-emerald-500" />
                  {t("exportToDocument") || "Export Documentation"}
                </button>
                <div className="h-px bg-slate-200 dark:bg-slate-600 my-1" />
                <button
                  onClick={() => {
                    setShowComplianceCheck(true);
                    setShowAIMenu(false);
                  }}
                  disabled={nodes.length === 0}
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 disabled:opacity-40"
                >
                  <CheckIcon className="w-4 h-4 text-emerald-500" />
                  {t("checkCompliance") || "Check Compliance"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Help + Save + Close */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setShowHelp(true)}
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title={t("help") || "Help (?)"}
          >
            <QuestionMarkCircleIcon className="w-4 h-4 text-slate-400" />
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="px-3 py-1.5 rounded-md text-xs font-semibold bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 hover:bg-slate-700 dark:hover:bg-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? t("saving") || "Saving..." : t("saveChanges") || "Save"}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" />
          </button>
        </div>
      </header>

      {/* ─── Canvas ───────────────────────────────────────────────────────── */}
      <main className="grow overflow-hidden relative">
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
          snapGrid={[20, 20]}
          className="bg-slate-50! dark:bg-slate-900!"
          defaultEdgeOptions={defaultEdgeOpts}
          deleteKeyCode={null}
        >
          <Background
            color="#cbd5e1"
            gap={20}
            size={1}
            variant={BackgroundVariant.Dots}
          />
          <Controls
            className={`!${glass} rounded-lg!`}
            showInteractive={false}
          />
          <MiniMap
            nodeColor={(node) => {
              switch (node.type) {
                case "start":
                  return "#34d399";
                case "end":
                  return "#fb7185";
                case "decision":
                  return "#fbbf24";
                default:
                  return "#60a5fa";
              }
            }}
            className={`bg-white/70! dark:bg-slate-800/70! backdrop-blur-md! border! border-slate-200/50! dark:border-slate-700/50! rounded-lg! shadow-sm!`}
            maskColor="rgba(0, 0, 0, 0.04)"
          />
        </ReactFlow>

        {/* ─── Contextual Floating Toolbar (appears when nodes selected) ─── */}
        {hasSelectedNodes && (
          <div
            className={`absolute top-3 left-1/2 -translate-x-1/2 z-10 ${glassRound} px-1.5 py-1 flex items-center gap-0.5`}
          >
            <button
              onClick={handleDeleteSelected}
              className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors"
              title={t("deleteSelected") || "Delete (Del)"}
            >
              <TrashIcon className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-600" />
            <button
              onClick={handleDuplicateSelected}
              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition-colors"
              title={t("duplicate") || "Duplicate"}
            >
              <DocumentDuplicateIcon className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-600" />
            <button
              onClick={() => handleAlignSelected("horizontal")}
              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition-colors text-xs font-medium"
              title={t("alignH") || "Align Horizontally"}
            >
              H
            </button>
            <button
              onClick={() => handleAlignSelected("vertical")}
              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition-colors text-xs font-medium"
              title={t("alignV") || "Align Vertically"}
            >
              V
            </button>
          </div>
        )}

        {/* ─── Floating Add-Node Button + Panel ───────────────────────────── */}
        <div className="absolute bottom-6 right-6 z-10" ref={addPanelRef}>
          {showAddNodePanel && (
            <div
              className={`absolute bottom-14 right-0 w-64 p-4 ${glassRound} shadow-lg mb-2`}
            >
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                    {t("nodeType") || "Type"}
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(["start", "process", "decision", "end"] as const).map(
                      (type) => {
                        const colors: Record<string, string> = {
                          start: "bg-emerald-500",
                          process: "bg-blue-400",
                          decision: "bg-amber-400",
                          end: "bg-rose-500",
                        };
                        const shapes: Record<string, string> = {
                          start: "rounded-full",
                          process: "rounded",
                          decision: "rotate-45 rounded-sm",
                          end: "rounded-full",
                        };
                        return (
                          <button
                            key={type}
                            onClick={() => setSelectedNodeType(type)}
                            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors text-[10px] font-medium capitalize
                            ${selectedNodeType === type ? "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50"}`}
                          >
                            <div
                              className={`w-3 h-3 ${colors[type]} ${shapes[type]}`}
                            />
                            {type === "start"
                              ? t("start") || "Start"
                              : type === "process"
                                ? t("process") || "Step"
                                : type === "decision"
                                  ? t("decision") || "If"
                                  : t("end") || "End"}
                          </button>
                        );
                      },
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                    {t("nodeLabel") || "Label"}
                  </label>
                  <input
                    type="text"
                    value={nodeLabel}
                    onChange={(e) => setNodeLabel(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddNode()}
                    placeholder={t("enterNodeLabel") || "Enter label..."}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-300 dark:focus:border-blue-600 transition-all"
                    autoFocus
                  />
                </div>
                <button
                  onClick={handleAddNode}
                  disabled={!nodeLabel.trim()}
                  className="w-full py-2 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 rounded-lg text-sm font-semibold hover:bg-slate-700 dark:hover:bg-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {t("add") || "Add"}
                </button>
              </div>
            </div>
          )}
          <button
            onClick={() => setShowAddNodePanel(!showAddNodePanel)}
            className={`w-11 h-11 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ${
              showAddNodePanel
                ? "bg-slate-600 text-white rotate-45 scale-110"
                : "bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 hover:bg-slate-700 dark:hover:bg-slate-300 hover:scale-105"
            }`}
            title={t("addNode") || "Add Node"}
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>

        {/* ─── AI Suggestions Floating Panel ──────────────────────────────── */}
        {aiSuggestions.length > 0 && (
          <div
            className={`absolute top-3 right-4 max-w-xs z-20 ${glassRound} shadow-lg p-3`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 flex items-center gap-1.5">
                <SparklesIcon className="w-3.5 h-3.5" />
                {t("suggestedNextSteps") || "Suggestions"}
              </span>
              <button
                onClick={() => setAiSuggestions([])}
                className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
              >
                <XMarkIcon className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
            <div className="space-y-1.5">
              {aiSuggestions.map((s, idx) => {
                const typeColor: Record<string, string> = {
                  process: "bg-blue-400",
                  decision: "bg-amber-400",
                  end: "bg-rose-500",
                };
                return (
                  <div
                    key={idx}
                    className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${typeColor[s.type] || "bg-blue-400"} mt-1.5 shrink-0`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {s.label}
                      </p>
                      <p className="text-[11px] text-slate-400 leading-tight">
                        {s.rationale}
                      </p>
                    </div>
                    <button
                      onClick={() => handleAddSuggestedNode(s)}
                      className="shrink-0 px-2 py-1 text-[11px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                      {t("add") || "Add"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* ─── Compact Footer ───────────────────────────────────────────────── */}
      <footer
        className={`h-9 px-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px] text-slate-400 shrink-0 ${glass}`}
      >
        <div className="flex items-center gap-4">
          <span>
            <strong className="text-slate-600 dark:text-slate-300">
              {nodes.length}
            </strong>{" "}
            {t("nodes") || "nodes"}
          </span>
          <span>
            <strong className="text-slate-600 dark:text-slate-300">
              {edges.length}
            </strong>{" "}
            {t("connections") || "edges"}
          </span>
          {isExporting && (
            <span className="text-violet-500 animate-pulse">
              {t("exporting") || "Exporting..."}
            </span>
          )}
          {isAIProcessing && (
            <span className="text-violet-500 animate-pulse">
              {t("aiProcessing") || "AI processing..."}
            </span>
          )}
        </div>
        <span className="text-slate-300 dark:text-slate-600">
          <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[10px]">
            ?
          </kbd>{" "}
          {t("pressForHelp") || "for help"}
        </span>
      </footer>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODALS                                                             */}
      {/* ═══════════════════════════════════════════════════════════════════ */}

      {/* ─── Templates Modal ──────────────────────────────────────────────── */}
      {showTemplates && (
        <div
          className="absolute inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm"
          onClick={() => setShowTemplates(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full m-4 p-6 border border-slate-200 dark:border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                {t("processMapTemplates") || "Templates"}
              </h3>
              <button
                onClick={() => setShowTemplates(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
              >
                <XMarkIcon className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleLoadTemplate(template)}
                  className="text-left p-4 border border-slate-200 dark:border-slate-600 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all group"
                >
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {t(template.id.replace(/-/g, "")) || template.name}
                  </h4>
                  <p className="text-xs text-slate-400 mb-2">
                    {t(`${template.id.replace(/-/g, "")}Description`) ||
                      template.description}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span>
                      {template.nodes.length} {t("nodes") || "nodes"}
                    </span>
                    <span>
                      {template.edges.length} {t("connections") || "edges"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
            <p className="mt-4 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-lg px-3 py-2">
              {t("templateWarning") ||
                "Loading a template will replace your current process map."}
            </p>
          </div>
        </div>
      )}

      {/* ─── Help Modal ───────────────────────────────────────────────────── */}
      {showHelp && (
        <div
          className="absolute inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-lg w-full m-4 p-6 border border-slate-200 dark:border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                {t("helpAndShortcuts") || "Keyboard Shortcuts"}
              </h3>
              <button
                onClick={() => setShowHelp(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
              >
                <XMarkIcon className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-3">
                <p className="font-medium text-blue-700 dark:text-blue-300 mb-1">
                  {t("howToConnect") || "Connecting Nodes"}
                </p>
                <p className="text-xs text-blue-600/70 dark:text-blue-300/70">
                  {t("clickAndDrag") ||
                    "Drag from any handle (dot) on a node to another node's handle to create a connection."}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ["Ctrl+Z", t("undo") || "Undo"],
                  ["Ctrl+Shift+Z", t("redo") || "Redo"],
                  ["Delete", t("deleteSelected") || "Delete selected"],
                  ["?", t("showHelp") || "Show help"],
                ].map(([key, action]) => (
                  <div key={key} className="flex items-center gap-2">
                    <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[11px] font-mono text-slate-500">
                      {key}
                    </kbd>
                    <span className="text-xs text-slate-500">{action}</span>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  {t("nodeTypes") || "Node Types"}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      color: "bg-emerald-500",
                      shape: "rounded-full",
                      name: t("start") || "Start",
                    },
                    {
                      color: "bg-blue-400",
                      shape: "rounded",
                      name: t("process") || "Process",
                    },
                    {
                      color: "bg-amber-400",
                      shape: "rotate-45 rounded-sm",
                      name: t("decision") || "Decision",
                    },
                    {
                      color: "bg-rose-500",
                      shape: "rounded-full",
                      name: t("end") || "End",
                    },
                  ].map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className={`w-3 h-3 ${item.color} ${item.shape}`} />
                      <span className="text-xs text-slate-600 dark:text-slate-300">
                        {item.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowHelp(false)}
                className="px-4 py-1.5 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 rounded-lg text-sm font-medium hover:bg-slate-700 dark:hover:bg-slate-300 transition-colors"
              >
                {t("gotIt") || "Got it"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── AI Generator Modal ───────────────────────────────────────────── */}
      {showAIGenerator && (
        <div
          className="absolute inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm"
          onClick={() => setShowAIGenerator(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-xl w-full m-4 p-6 border border-slate-200 dark:border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-1">
              {t("generateProcessMapDesc") || "Generate from Description"}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              {t("describeProcessPlaceholder") ||
                "Describe your process and AI will create the flowchart."}
            </p>
            <textarea
              value={aiDescription}
              onChange={(e) => {
                setAiDescription(e.target.value);
                setAiGenerateError(null);
              }}
              placeholder={
                "e.g. A patient admission process:\n1. Patient arrives at reception\n2. Triage nurse assesses urgency\n3. If emergency → go to ER, else → register in OPD\n4. Doctor consultation\n5. Discharge or admit to ward"
              }
              className="w-full h-36 p-3 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 resize-none focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-800 focus:border-violet-300 dark:focus:border-violet-600"
            />
            {aiGenerateError && (
              <p className="mt-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg px-3 py-2">
                {aiGenerateError}
              </p>
            )}
            <p className="mt-2 text-[11px] text-slate-400">
              {t("aiGenerateTip") ||
                "Tip: Be specific — mention each step, decision point, and branch. The AI will create actual nodes and connections on the canvas."}
            </p>
            <div className="mt-4 flex gap-2 justify-end">
              <button
                onClick={() => setShowAIGenerator(false)}
                className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                {t("cancel") || "Cancel"}
              </button>
              <button
                onClick={handleGenerateFromAI}
                disabled={isAIProcessing || !aiDescription.trim()}
                className="px-4 py-2 text-sm font-semibold bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-40 transition-colors"
              >
                {isAIProcessing
                  ? t("generating") || "Generating..."
                  : t("generate") || "Generate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Optimizations Modal ──────────────────────────────────────────── */}
      {showOptimizations && (
        <div
          className="absolute inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm"
          onClick={() => setShowOptimizations(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full m-4 p-6 max-h-[80vh] overflow-y-auto border border-slate-200 dark:border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
              {t("processOptimizations") || "Optimization Suggestions"}
            </h3>
            {optimizations.length === 0 ? (
              <p className="text-sm text-slate-400">
                {t("noOptimizationsSuggested") ||
                  "No optimizations needed — your process looks good!"}
              </p>
            ) : (
              <div className="space-y-2">
                {optimizations.map((opt, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border ${
                      opt.priority === "high"
                        ? "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10"
                        : opt.priority === "medium"
                          ? "border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10"
                          : "border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-700/30"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-1.5 py-0.5 text-[10px] font-bold uppercase rounded ${
                          opt.priority === "high"
                            ? "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200"
                            : opt.priority === "medium"
                              ? "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-200"
                              : "bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {opt.priority}
                      </span>
                      <span className="text-[11px] text-slate-400 capitalize">
                        {opt.category}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      {opt.suggestion}
                    </p>
                    <button
                      onClick={() => handleApplyOptimization(opt, idx)}
                      disabled={opt._applied || applyingOptIdx === idx}
                      className={`mt-2 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                        opt._applied
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200 cursor-default"
                          : applyingOptIdx === idx
                            ? "bg-blue-400 text-white cursor-wait"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {opt._applied
                        ? t("applied") || "✓ Applied"
                        : applyingOptIdx === idx
                          ? t("applying") || "Applying..."
                          : t("apply") || "Apply"}
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowOptimizations(false)}
                className="px-4 py-1.5 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 rounded-lg text-sm font-medium hover:bg-slate-700 dark:hover:bg-slate-300 transition-colors"
              >
                {t("close") || "Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Compliance Check Modal ───────────────────────────────────────── */}
      {showComplianceCheck && (
        <div
          className="absolute inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm"
          onClick={() => setShowComplianceCheck(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-lg w-full m-4 p-6 border border-slate-200 dark:border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
              {t("complianceCheck") || "Compliance Check"}
            </h3>
            {!complianceResult ? (
              <div>
                <p className="text-sm text-slate-500 mb-3">
                  {t("selectStandardToCheck") ||
                    "Select a standard to check against:"}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      code: "CBAHI",
                      desc:
                        t("cbahiDesc") || "Healthcare Facility Accreditation",
                      color:
                        "border-sky-200 hover:border-sky-400 hover:bg-sky-50/50 dark:border-sky-700 dark:hover:border-sky-500 dark:hover:bg-sky-900/20",
                    },
                    {
                      code: "JCI",
                      desc: t("jciDesc") || "International Hospital Standards",
                      color:
                        "border-blue-200 hover:border-blue-400 hover:bg-blue-50/50 dark:border-blue-700 dark:hover:border-blue-500 dark:hover:bg-blue-900/20",
                    },
                    {
                      code: "MOH",
                      desc: t("mohDesc") || "Saudi Health Regulations",
                      color:
                        "border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50/50 dark:border-emerald-700 dark:hover:border-emerald-500 dark:hover:bg-emerald-900/20",
                    },
                    {
                      code: "HESN",
                      desc: t("hesnDesc") || "Health Electronic Surveillance",
                      color:
                        "border-teal-200 hover:border-teal-400 hover:bg-teal-50/50 dark:border-teal-700 dark:hover:border-teal-500 dark:hover:bg-teal-900/20",
                    },
                  ].map((std) => (
                    <button
                      key={std.code}
                      onClick={() => handleCheckCompliance(std.code)}
                      className={`p-3 rounded-lg border text-left transition-all ${std.color}`}
                    >
                      <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
                        {std.code}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {std.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div
                  className={`p-3 rounded-lg mb-3 border ${complianceResult.compliant ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-700 dark:bg-emerald-900/10" : "border-red-200 bg-red-50/50 dark:border-red-700 dark:bg-red-900/10"}`}
                >
                  <span className="text-sm font-semibold">
                    {complianceResult.compliant
                      ? `✓ ${t("compliant") || "Compliant"}`
                      : `✗ ${t("nonCompliant") || "Non-Compliant"}`}
                  </span>
                </div>
                {complianceResult.issues?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">
                      {t("issuesFound") || "Issues:"}
                    </p>
                    <ul className="space-y-0.5">
                      {complianceResult.issues.map(
                        (issue: string, idx: number) => (
                          <li
                            key={idx}
                            className="text-sm text-slate-600 dark:text-slate-300"
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
                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                      {t("recommendations") || "Recommendations:"}
                    </p>
                    <ul className="space-y-0.5">
                      {complianceResult.recommendations.map(
                        (rec: string, idx: number) => (
                          <li
                            key={idx}
                            className="text-sm text-slate-600 dark:text-slate-300"
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
                  className="px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  {t("checkAnother") || "Check Another"}
                </button>
              )}
              <button
                onClick={() => {
                  setShowComplianceCheck(false);
                  setComplianceResult(null);
                }}
                className="px-4 py-1.5 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 rounded-lg text-sm font-medium hover:bg-slate-700 dark:hover:bg-slate-300 transition-colors"
              >
                {t("close") || "Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Node Search Modal ────────────────────────────────────────────── */}
      {showNodeSearch && (
        <div
          className="absolute inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm"
          onClick={() => setShowNodeSearch(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-sm w-full m-4 p-5 border border-slate-200 dark:border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">
              {t("searchNodes") || "Search Nodes"}
            </h3>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleNodeSearch(e.target.value)}
              placeholder={t("typeToSearchNodes") || "Type to search..."}
              className="w-full p-2.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800"
              autoFocus
            />
            <div className="mt-3 max-h-48 overflow-y-auto space-y-1">
              {nodes
                .filter((n) =>
                  n.data.label.toLowerCase().includes(searchTerm.toLowerCase()),
                )
                .map((node) => {
                  const typeColor: Record<string, string> = {
                    start: "bg-emerald-500",
                    process: "bg-blue-400",
                    decision: "bg-amber-400",
                    end: "bg-rose-500",
                  };
                  return (
                    <div
                      key={node.id}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                      onClick={() => {
                        setNodes((nds) =>
                          nds.map((n) => ({
                            ...n,
                            selected: n.id === node.id,
                          })),
                        );
                        setViewport({
                          x: -node.position.x + 300,
                          y: -node.position.y + 200,
                          zoom: 1.5,
                        });
                        setShowNodeSearch(false);
                      }}
                    >
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${typeColor[node.type || "process"] || "bg-blue-400"}`}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-200">
                        {node.data.label}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-auto capitalize">
                        {node.type}
                      </span>
                    </div>
                  );
                })}
            </div>
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => {
                  setShowNodeSearch(false);
                  setSearchTerm("");
                }}
                className="px-4 py-1.5 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 rounded-lg text-sm font-medium hover:bg-slate-700 dark:hover:bg-slate-300 transition-colors"
              >
                {t("close") || "Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Export Documentation Modal ───────────────────────────────────── */}
      {showExportDoc && (
        <div
          className="absolute inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm"
          onClick={() => setShowExportDoc(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-3xl w-full m-4 p-6 max-h-[80vh] overflow-y-auto border border-slate-200 dark:border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
              {t("processDocumentation") || "Documentation"}
            </h3>
            <div
              className="prose dark:prose-invert prose-sm max-w-none bg-slate-50 dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-700"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(exportedDoc || ""),
              }}
            />
            <div className="mt-4 flex gap-2 justify-end">
              <button
                onClick={() => {
                  const blob = new Blob([exportedDoc || ""], {
                    type: "text/html",
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${documentData.name.en}_documentation.html`;
                  a.click();
                }}
                className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
              >
                {t("downloadHTML") || "Download HTML"}
              </button>
              <button
                onClick={() => setShowExportDoc(false)}
                className="px-4 py-1.5 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
              >
                {t("close") || "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ─── Wrapper ──────────────────────────────────────────────────────────────────
const ProcessMapEditor: React.FC<ProcessMapEditorProps> = (props) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { dir } = useTranslation();

  if (!props.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center backdrop-blur-sm">
      <div
        ref={reactFlowWrapper}
        className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-7xl h-[92vh] m-4 flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700"
        dir={dir}
      >
        <ReactFlowProvider>
          <ProcessMapEditorContent
            {...props}
            reactFlowWrapper={reactFlowWrapper as any}
          />
        </ReactFlowProvider>
      </div>
    </div>
  );
};

export default ProcessMapEditor;
