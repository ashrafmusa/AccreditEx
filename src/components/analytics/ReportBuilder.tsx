import React, { useState, useCallback, useMemo } from "react";
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Handle,
  Position,
  Node,
  Edge,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  LayoutGrid,
  BarChart3,
  LineChart,
  PieChart,
  Table as TableIcon,
  Download,
  Save,
  Plus,
  Settings,
  Trash2,
  MousePointer2,
} from "lucide-react";

// Custom node types for report building
const TextNode = ({ data, selected }: { data: any; selected: boolean }) => {
  return (
    <div
      className={`bg-white rounded-lg shadow border-2 ${selected ? "border-blue-500" : "border-gray-200"} min-w-[200px]`}
    >
      <Handle type="target" position={Position.Top} />
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-sm mb-2">Text Block</h3>
        <input
          type="text"
          value={data.text || "Enter text..."}
          onChange={(e) => data.onTextChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

const ChartNode = ({
  data,
  selected,
  type,
}: {
  data: any;
  selected: boolean;
  type: string;
}) => {
  const chartIcons = {
    bar: <BarChart3 size={16} />,
    line: <LineChart size={16} />,
    pie: <PieChart size={16} />,
  };

  const chartNames = {
    bar: "Bar Chart",
    line: "Line Chart",
    pie: "Pie Chart",
  };

  return (
    <div
      className={`bg-white rounded-lg shadow border-2 ${selected ? "border-blue-500" : "border-gray-200"} min-w-[250px]`}
    >
      <Handle type="target" position={Position.Top} />
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          {chartIcons[type as keyof typeof chartIcons]}
          <h3 className="font-semibold text-gray-900 text-sm">
            {chartNames[type as keyof typeof chartNames]}
          </h3>
        </div>
        <select
          value={data.dataSource || "compliance"}
          onChange={(e) => data.onDataSourceChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="compliance">Compliance Data</option>
          <option value="projects">Projects Data</option>
          <option value="tasks">Tasks Data</option>
          <option value="capa">CAPA Reports</option>
          <option value="audits">Audits</option>
        </select>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

const TableNode = ({ data, selected }: { data: any; selected: boolean }) => {
  return (
    <div
      className={`bg-white rounded-lg shadow border-2 ${selected ? "border-blue-500" : "border-gray-200"} min-w-[250px]`}
    >
      <Handle type="target" position={Position.Top} />
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <TableIcon size={16} />
          <h3 className="font-semibold text-gray-900 text-sm">Data Table</h3>
        </div>
        <select
          value={data.dataSource || "projects"}
          onChange={(e) => data.onDataSourceChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="projects">Projects</option>
          <option value="tasks">Tasks</option>
          <option value="users">Users</option>
          <option value="departments">Departments</option>
          <option value="documents">Documents</option>
        </select>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

const nodeTypes = {
  text: TextNode,
  barChart: (props: any) => <ChartNode {...props} type="bar" />,
  lineChart: (props: any) => <ChartNode {...props} type="line" />,
  pieChart: (props: any) => <ChartNode {...props} type="pie" />,
  table: TableNode,
};

// Sidebar component for adding new nodes
const NodeSidebar: React.FC = () => {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow/type", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  const nodeItems = [
    {
      type: "text",
      label: "Text Block",
      icon: <MousePointer2 size={18} />,
      color: "bg-gray-500",
    },
    {
      type: "barChart",
      label: "Bar Chart",
      icon: <BarChart3 size={18} />,
      color: "bg-blue-500",
    },
    {
      type: "lineChart",
      label: "Line Chart",
      icon: <LineChart size={18} />,
      color: "bg-green-500",
    },
    {
      type: "pieChart",
      label: "Pie Chart",
      icon: <PieChart size={18} />,
      color: "bg-yellow-500",
    },
    {
      type: "table",
      label: "Data Table",
      icon: <TableIcon size={18} />,
      color: "bg-rose-500",
    },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
      <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">
        Add Elements
      </h3>
      <div className="space-y-3">
        {nodeItems.map((item) => (
          <div
            key={item.type}
            draggable
            onDragStart={(e) => onDragStart(e, item.type)}
            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-grab active:cursor-grabbing transition-colors"
          >
            <div
              className={`w-8 h-8 ${item.color} text-white rounded-full flex items-center justify-center`}
            >
              {item.icon}
            </div>
            <span className="text-sm text-gray-700">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Main report builder component
const ReportBuilder: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [reportName, setReportName] = useState("Untitled Report");
  const [isSaving, setIsSaving] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const onConnect = useCallback(
    (params: any) =>
      setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      const type = event.dataTransfer.getData("application/reactflow/type");

      if (!type) {
        return;
      }

      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const position = {
        x: event.clientX - reactFlowBounds.left - 100,
        y: event.clientY - reactFlowBounds.top - 50,
      };

      const newNode: Node = {
        id: `node_${Date.now()}`,
        type,
        position,
        data: {
          text: "Enter text...",
          dataSource: "compliance",
          onTextChange: (value: string) => {
            setNodes((nds) =>
              nds.map((node) => {
                if (node.id === `node_${Date.now()}`) {
                  return { ...node, data: { ...node.data, text: value } };
                }
                return node;
              }),
            );
          },
          onDataSourceChange: (value: string) => {
            setNodes((nds) =>
              nds.map((node) => {
                if (node.id === `node_${Date.now()}`) {
                  return { ...node, data: { ...node.data, dataSource: value } };
                }
                return node;
              }),
            );
          },
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes],
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    alert("Report saved successfully!");
  };

  const handleDownload = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    alert("Report downloaded successfully!");
  };

  const handleDeleteNode = () => {
    if (!selectedNode) return;

    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) =>
      eds.filter(
        (e) => e.source !== selectedNode.id && e.target !== selectedNode.id,
      ),
    );
    setSelectedNode(null);
  };

  return (
    <div className="flex h-[calc(100vh-160px)]">
      <NodeSidebar />

      <div className="flex-1 bg-gray-50 relative">
        <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Report Builder
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Drag and drop elements to create your report
          </p>
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
          className="bg-transparent"
        >
          <Background gap={16} size={1} />
          <Controls />
        </ReactFlow>

        <div className="absolute bottom-4 right-4 z-10 flex gap-2">
          {selectedNode && (
            <button
              onClick={handleDeleteNode}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 size={18} />
              Delete
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save size={18} />
            {isSaving ? "Saving..." : "Save"}
          </button>

          <button
            onClick={handleDownload}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <Download size={18} />
            {isSaving ? "Downloading..." : "Download"}
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Settings size={18} />
            Settings
          </button>
        </div>
      </div>
    </div>
  );
};

// Provider wrapper component
const ReportBuilderWrapper: React.FC = () => {
  return (
    <ReactFlowProvider>
      <ReportBuilder />
    </ReactFlowProvider>
  );
};

export default ReportBuilderWrapper;
