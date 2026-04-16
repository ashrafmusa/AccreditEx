import { useToast } from "@/hooks/useToast";
import { useTranslation } from "@/hooks/useTranslation";
import type { AICommand } from "@/services/aiWritingService";
import { aiWritingService } from "@/services/aiWritingService";
import { Color } from "@tiptap/extension-color";
import { Highlight } from "@tiptap/extension-highlight";
import { Image } from "@tiptap/extension-image";
import { Link } from "@tiptap/extension-link";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { Table } from "@tiptap/extension-table";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableRow } from "@tiptap/extension-table-row";
import { TextAlign } from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Underline } from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import React from "react";
import {
  BoldIcon,
  CodeIcon,
  ImageIcon,
  ItalicIcon,
  LinkIcon,
  ListBulletIcon,
  ListNumberIcon,
  PaintBrushIcon,
  QuoteIcon,
  RedoIcon,
  SparklesIcon,
  StrikethroughIcon,
  TableIcon,
  UnderlineIcon,
  UndoIcon,
  XMarkIcon,
} from "../icons";

// ── Inline SVG mini-icons for toolbar buttons not in the global icons file ──

const AlignLeftIcon = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
    <rect x="1" y="2" width="14" height="2" rx="1" />
    <rect x="1" y="6" width="9" height="2" rx="1" />
    <rect x="1" y="10" width="12" height="2" rx="1" />
    <rect x="1" y="14" width="7" height="2" rx="1" />
  </svg>
);

const AlignCenterIcon = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
    <rect x="1" y="2" width="14" height="2" rx="1" />
    <rect x="3.5" y="6" width="9" height="2" rx="1" />
    <rect x="2" y="10" width="12" height="2" rx="1" />
    <rect x="4.5" y="14" width="7" height="2" rx="1" />
  </svg>
);

const AlignRightIcon = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
    <rect x="1" y="2" width="14" height="2" rx="1" />
    <rect x="6" y="6" width="9" height="2" rx="1" />
    <rect x="3" y="10" width="12" height="2" rx="1" />
    <rect x="8" y="14" width="7" height="2" rx="1" />
  </svg>
);

const AlignJustifyIcon = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
    <rect x="1" y="2" width="14" height="2" rx="1" />
    <rect x="1" y="6" width="14" height="2" rx="1" />
    <rect x="1" y="10" width="14" height="2" rx="1" />
    <rect x="1" y="14" width="9" height="2" rx="1" />
  </svg>
);

const HRuleIcon = () => (
  <svg
    viewBox="0 0 16 16"
    width="14"
    height="14"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <line x1="1" y1="8" x2="15" y2="8" strokeLinecap="round" />
    <line
      x1="1"
      y1="3"
      x2="15"
      y2="3"
      strokeLinecap="round"
      strokeOpacity="0.35"
    />
    <line
      x1="1"
      y1="13"
      x2="15"
      y2="13"
      strokeLinecap="round"
      strokeOpacity="0.35"
    />
  </svg>
);

const CodeBlockIcon = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
    <rect x="0" y="1" width="16" height="14" rx="2" fillOpacity="0.12" />
    <path
      d="M5 5 L2 8 L5 11"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M11 5 L14 8 L11 11"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <line
      x1="9"
      y1="4"
      x2="7"
      y2="12"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const ClearFormatIcon = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
    <path d="M3 2h8l-3 5h3l-6 8 1.5-5H4L3 2z" fillOpacity="0.8" />
    <line
      x1="13"
      y1="11"
      x2="9"
      y2="15"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <line
      x1="9"
      y1="11"
      x2="13"
      y2="15"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const IndentIcon = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
    <rect x="1" y="2" width="14" height="2" rx="1" />
    <rect x="5" y="6" width="10" height="2" rx="1" />
    <rect x="5" y="10" width="8" height="2" rx="1" />
    <rect x="1" y="14" width="14" height="2" rx="1" />
    <path d="M1 7 L4 8.5 L1 10 Z" />
  </svg>
);

const OutdentIcon = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
    <rect x="1" y="2" width="14" height="2" rx="1" />
    <rect x="5" y="6" width="10" height="2" rx="1" />
    <rect x="5" y="10" width="8" height="2" rx="1" />
    <rect x="1" y="14" width="14" height="2" rx="1" />
    <path d="M4 7 L1 8.5 L4 10 Z" />
  </svg>
);

const SubscriptIcon = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
    <text x="0" y="10" fontSize="11" fontWeight="700">
      A
    </text>
    <text x="9" y="15" fontSize="7" fontWeight="600">
      2
    </text>
  </svg>
);

const SuperscriptIcon = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
    <text x="0" y="13" fontSize="11" fontWeight="700">
      A
    </text>
    <text x="9" y="6" fontSize="7" fontWeight="600">
      2
    </text>
  </svg>
);

const TableAddRowBeforeIcon = () => (
  <svg
    viewBox="0 0 16 16"
    width="14"
    height="14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.3"
  >
    <rect x="1" y="5" width="14" height="9" rx="1" />
    <line x1="1" y1="9.5" x2="15" y2="9.5" />
    <line x1="8" y1="5" x2="8" y2="14" />
    <line x1="8" y1="2" x2="8" y2="4" strokeWidth="1.6" strokeLinecap="round" />
    <line
      x1="6"
      y1="3"
      x2="10"
      y2="3"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

const TableAddRowAfterIcon = () => (
  <svg
    viewBox="0 0 16 16"
    width="14"
    height="14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.3"
  >
    <rect x="1" y="2" width="14" height="9" rx="1" />
    <line x1="1" y1="6.5" x2="15" y2="6.5" />
    <line x1="8" y1="2" x2="8" y2="11" />
    <line
      x1="8"
      y1="12"
      x2="8"
      y2="14"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <line
      x1="6"
      y1="13"
      x2="10"
      y2="13"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

const TableAddColBeforeIcon = () => (
  <svg
    viewBox="0 0 16 16"
    width="14"
    height="14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.3"
  >
    <rect x="5" y="1" width="9" height="14" rx="1" />
    <line x1="9.5" y1="1" x2="9.5" y2="15" />
    <line x1="5" y1="8" x2="14" y2="8" />
    <line x1="2" y1="8" x2="4" y2="8" strokeWidth="1.6" strokeLinecap="round" />
    <line
      x1="3"
      y1="6"
      x2="3"
      y2="10"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

const TableAddColAfterIcon = () => (
  <svg
    viewBox="0 0 16 16"
    width="14"
    height="14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.3"
  >
    <rect x="2" y="1" width="9" height="14" rx="1" />
    <line x1="6.5" y1="1" x2="6.5" y2="15" />
    <line x1="2" y1="8" x2="11" y2="8" />
    <line
      x1="12"
      y1="8"
      x2="14"
      y2="8"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <line
      x1="13"
      y1="6"
      x2="13"
      y2="10"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

const TableDelRowIcon = () => (
  <svg
    viewBox="0 0 16 16"
    width="14"
    height="14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.3"
  >
    <rect x="1" y="2" width="14" height="12" rx="1" />
    <line x1="1" y1="8" x2="15" y2="8" />
    <line x1="8" y1="2" x2="8" y2="14" />
    <line
      x1="13"
      y1="10.5"
      x2="15.5"
      y2="13"
      stroke="#ef4444"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <line
      x1="15.5"
      y1="10.5"
      x2="13"
      y2="13"
      stroke="#ef4444"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const TableDelColIcon = () => (
  <svg
    viewBox="0 0 16 16"
    width="14"
    height="14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.3"
  >
    <rect x="1" y="2" width="12" height="12" rx="1" />
    <line x1="1" y1="8" x2="13" y2="8" />
    <line x1="7" y1="2" x2="7" y2="14" />
    <line
      x1="14"
      y1="9.5"
      x2="16.5"
      y2="12"
      stroke="#ef4444"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <line
      x1="16.5"
      y1="9.5"
      x2="14"
      y2="12"
      stroke="#ef4444"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

// ── MenuButton helper ──
const MenuButton = ({
  onClick,
  active,
  disabled,
  children,
  title,
  danger,
}: {
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
  danger?: boolean;
}) => (
  <button
    type="button"
    onMouseDown={(e) => {
      e.preventDefault(); // keep editor focus
      onClick?.();
    }}
    disabled={disabled}
    title={title}
    className={`p-1.5 rounded transition-colors flex items-center justify-center
      ${disabled ? "opacity-30 cursor-not-allowed" : ""}
      ${
        active
          ? danger
            ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
            : "bg-brand-primary/10 text-brand-primary dark:bg-sky-900/30 dark:text-sky-400"
          : danger
            ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
      }`}
  >
    {children}
  </button>
);

const Divider = () => <div className="editor-toolbar-divider" />;

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  editable?: boolean;
  placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  editable = true,
}) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [aiProcessing, setAiProcessing] = React.useState<string | null>(null);
  const [showAiDropdown, setShowAiDropdown] = React.useState(false);
  const aiDropdownRef = React.useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
        code: { HTMLAttributes: { class: "not-prose" } },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-brand-primary underline cursor-pointer",
        },
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Image.configure({
        HTMLAttributes: { class: "max-w-full h-auto rounded-lg" },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Subscript,
      Superscript,
    ],
    content,
    editable,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "outline-none",
        spellcheck: "true",
      },
    },
  });

  // Close AI dropdown on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        aiDropdownRef.current &&
        !aiDropdownRef.current.contains(e.target as Node)
      ) {
        setShowAiDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  React.useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  React.useEffect(() => {
    if (editor) editor.setEditable(editable);
  }, [editable, editor]);

  if (!editor) return null;

  // ── Helpers ──
  const isInTable =
    editor.isActive("table") ||
    editor.isActive("tableCell") ||
    editor.isActive("tableHeader");

  const addLink = () => {
    const url = window.prompt(t("enterUrl") || "Enter URL:");
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  const addImage = () => {
    const url = window.prompt(t("enterImageUrl") || "Enter image URL:");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  const addTable = () => {
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  };

  const currentTextColor =
    (editor.getAttributes("textStyle") as { color?: string }).color ||
    "#000000";
  const currentHighlight =
    (editor.getAttributes("highlight") as { color?: string }).color ||
    "#ffff00";

  // Heading label helper
  const getActiveHeadingLabel = () => {
    for (const l of [1, 2, 3, 4, 5, 6] as const) {
      if (editor.isActive("heading", { level: l })) return `H${l}`;
    }
    return "P";
  };

  // ── AI actions ──
  const AI_ACTIONS: { command: AICommand; label: string }[] = [
    { command: "improve", label: t("improve") || "Improve" },
    { command: "simplify", label: t("simplify") || "Simplify" },
    { command: "expand", label: t("expand") || "Expand" },
    { command: "formalize", label: t("formalize") || "Formalize" },
    { command: "fix_grammar", label: t("fixGrammar") || "Fix Grammar" },
  ];

  const handleAiOnSelection = async (command: AICommand, label: string) => {
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, " ");
    if (!selectedText.trim()) {
      toast.error(t("selectTextFirst") || "Select text first");
      return;
    }
    setAiProcessing(command);
    setShowAiDropdown(false);
    try {
      const result = await aiWritingService.processText({
        command,
        text: selectedText,
      });
      editor
        .chain()
        .focus()
        .deleteRange({ from, to })
        .insertContentAt(from, result)
        .run();
      toast.success(
        `${label} ${t("appliedToSelection") || "applied to selection."}`,
      );
    } catch {
      toast.error(`${t("failedTo") || "Failed to"} ${label.toLowerCase()}.`);
    } finally {
      setAiProcessing(null);
    }
  };

  return (
    <div className="flex flex-col h-full rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      {/* ══════════════════════════════════════════════════════
          TOOLBAR — Row 1: Main formatting (always visible)
          ══════════════════════════════════════════════════ */}
      {editable && (
        <div className="shrink-0 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
          {/* Primary toolbar row */}
          <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5">
            {/* History */}
            <MenuButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="Undo (Ctrl+Z)"
            >
              <UndoIcon className="w-4 h-4" />
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="Redo (Ctrl+Y)"
            >
              <RedoIcon className="w-4 h-4" />
            </MenuButton>

            <Divider />

            {/* Paragraph / Heading style selector */}
            <select
              value={getActiveHeadingLabel()}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "P") {
                  editor.chain().focus().setParagraph().run();
                } else {
                  editor
                    .chain()
                    .focus()
                    .toggleHeading({
                      level: parseInt(v[1]) as 1 | 2 | 3 | 4 | 5 | 6,
                    })
                    .run();
                }
              }}
              title="Paragraph Style"
              className="h-7 pl-2 pr-5 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-brand-primary cursor-pointer"
            >
              <option value="P">Normal</option>
              <option value="H1">Heading 1</option>
              <option value="H2">Heading 2</option>
              <option value="H3">Heading 3</option>
              <option value="H4">Heading 4</option>
              <option value="H5">Heading 5</option>
              <option value="H6">Heading 6</option>
            </select>

            <Divider />

            {/* Character formatting */}
            <MenuButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              active={editor.isActive("bold")}
              title="Bold (Ctrl+B)"
            >
              <BoldIcon className="w-4 h-4" />
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              active={editor.isActive("italic")}
              title="Italic (Ctrl+I)"
            >
              <ItalicIcon className="w-4 h-4" />
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              active={editor.isActive("underline")}
              title="Underline (Ctrl+U)"
            >
              <UnderlineIcon className="w-4 h-4" />
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              active={editor.isActive("strike")}
              title="Strikethrough"
            >
              <StrikethroughIcon className="w-4 h-4" />
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().toggleSubscript().run()}
              active={editor.isActive("subscript")}
              title="Subscript"
            >
              <SubscriptIcon />
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().toggleSuperscript().run()}
              active={editor.isActive("superscript")}
              title="Superscript"
            >
              <SuperscriptIcon />
            </MenuButton>
            <MenuButton
              onClick={() =>
                editor.chain().focus().unsetAllMarks().clearNodes().run()
              }
              title="Clear Formatting"
            >
              <ClearFormatIcon />
            </MenuButton>

            <Divider />

            {/* Color */}
            <label
              title="Text Color"
              className="relative p-1.5 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-0.5"
            >
              <span className="flex flex-col items-center">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 leading-none">
                  A
                </span>
                <span
                  className="w-4 h-1 rounded-sm mt-0.5"
                  style={{ backgroundColor: currentTextColor }}
                />
              </span>
              <input
                type="color"
                value={currentTextColor}
                onChange={(e) =>
                  editor.chain().focus().setColor(e.target.value).run()
                }
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                title="Text Color"
              />
            </label>
            <label
              title="Highlight Color"
              className="relative p-1.5 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center"
            >
              <span className="relative">
                <PaintBrushIcon className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                <span
                  className="absolute -bottom-0.5 left-0 w-4 h-1 rounded-sm"
                  style={{ backgroundColor: currentHighlight }}
                />
              </span>
              <input
                type="color"
                value={currentHighlight}
                onChange={(e) =>
                  editor
                    .chain()
                    .focus()
                    .setHighlight({ color: e.target.value })
                    .run()
                }
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                title="Highlight Color"
              />
            </label>

            <Divider />

            {/* Alignment */}
            <MenuButton
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
              active={editor.isActive({ textAlign: "left" })}
              title="Align Left"
            >
              <AlignLeftIcon />
            </MenuButton>
            <MenuButton
              onClick={() =>
                editor.chain().focus().setTextAlign("center").run()
              }
              active={editor.isActive({ textAlign: "center" })}
              title="Align Center"
            >
              <AlignCenterIcon />
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
              active={editor.isActive({ textAlign: "right" })}
              title="Align Right"
            >
              <AlignRightIcon />
            </MenuButton>
            <MenuButton
              onClick={() =>
                editor.chain().focus().setTextAlign("justify").run()
              }
              active={editor.isActive({ textAlign: "justify" })}
              title="Justify"
            >
              <AlignJustifyIcon />
            </MenuButton>

            <Divider />

            {/* Lists & Indent */}
            <MenuButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              active={editor.isActive("bulletList")}
              title="Bullet List"
            >
              <ListBulletIcon className="w-4 h-4" />
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              active={editor.isActive("orderedList")}
              title="Numbered List"
            >
              <ListNumberIcon className="w-4 h-4" />
            </MenuButton>
            <MenuButton
              onClick={() =>
                editor.chain().focus().sinkListItem("listItem").run()
              }
              disabled={!editor.can().sinkListItem("listItem")}
              title="Increase Indent"
            >
              <IndentIcon />
            </MenuButton>
            <MenuButton
              onClick={() =>
                editor.chain().focus().liftListItem("listItem").run()
              }
              disabled={!editor.can().liftListItem("listItem")}
              title="Decrease Indent"
            >
              <OutdentIcon />
            </MenuButton>

            <Divider />

            {/* Insert group */}
            <MenuButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              active={editor.isActive("blockquote")}
              title="Blockquote"
            >
              <QuoteIcon className="w-4 h-4" />
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().toggleCode().run()}
              active={editor.isActive("code")}
              title="Inline Code"
            >
              <CodeIcon className="w-4 h-4" />
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              active={editor.isActive("codeBlock")}
              title="Code Block"
            >
              <CodeBlockIcon />
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              title="Horizontal Rule"
            >
              <HRuleIcon />
            </MenuButton>
            <MenuButton
              onClick={addLink}
              active={editor.isActive("link")}
              title="Add Link"
            >
              <LinkIcon className="w-4 h-4" />
            </MenuButton>
            {editor.isActive("link") && (
              <MenuButton
                onClick={() => editor.chain().focus().unsetLink().run()}
                title="Remove Link"
                danger
              >
                <XMarkIcon className="w-3.5 h-3.5" />
              </MenuButton>
            )}
            <MenuButton onClick={addImage} title="Insert Image">
              <ImageIcon className="w-4 h-4" />
            </MenuButton>
            <MenuButton onClick={addTable} title="Insert Table (3×3)">
              <TableIcon className="w-4 h-4" />
            </MenuButton>

            <Divider />

            {/* AI dropdown */}
            <div className="relative" ref={aiDropdownRef}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setShowAiDropdown((v) => !v);
                }}
                disabled={aiProcessing !== null}
                title="AI Writing Assistant"
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors
                  ${
                    aiProcessing
                      ? "bg-brand-primary/10 text-brand-primary animate-pulse"
                      : "text-brand-primary hover:bg-brand-primary/10 dark:hover:bg-sky-900/30"
                  }`}
              >
                <SparklesIcon className="w-3.5 h-3.5" />
                <span>{aiProcessing ? "..." : "AI"}</span>
              </button>
              {showAiDropdown && (
                <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl py-1 min-w-[140px]">
                  {AI_ACTIONS.map(({ command, label }) => (
                    <button
                      key={command}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleAiOnSelection(command, label);
                      }}
                      className="w-full text-left px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════
              TOOLBAR — Row 2: Table context bar (only when in table)
              ══════════════════════════════════════════════════ */}
          {isInTable && (
            <div className="flex flex-wrap items-center gap-0.5 px-2 py-1 border-t border-amber-200 dark:border-amber-800/50 bg-amber-50/60 dark:bg-amber-900/10">
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 mr-1 flex items-center gap-1">
                <TableIcon className="w-3.5 h-3.5" />
                Table:
              </span>

              <MenuButton
                onClick={() => editor.chain().focus().addRowBefore().run()}
                title="Add Row Above"
              >
                <TableAddRowBeforeIcon />
              </MenuButton>
              <MenuButton
                onClick={() => editor.chain().focus().addRowAfter().run()}
                title="Add Row Below"
              >
                <TableAddRowAfterIcon />
              </MenuButton>

              <Divider />

              <MenuButton
                onClick={() => editor.chain().focus().addColumnBefore().run()}
                title="Add Column Left"
              >
                <TableAddColBeforeIcon />
              </MenuButton>
              <MenuButton
                onClick={() => editor.chain().focus().addColumnAfter().run()}
                title="Add Column Right"
              >
                <TableAddColAfterIcon />
              </MenuButton>

              <Divider />

              <MenuButton
                onClick={() => editor.chain().focus().deleteRow().run()}
                title="Delete Row"
                danger
              >
                <TableDelRowIcon />
              </MenuButton>
              <MenuButton
                onClick={() => editor.chain().focus().deleteColumn().run()}
                title="Delete Column"
                danger
              >
                <TableDelColIcon />
              </MenuButton>

              <Divider />

              <MenuButton
                onClick={() => {
                  if (editor.can().mergeCells())
                    editor.chain().focus().mergeCells().run();
                  else editor.chain().focus().splitCell().run();
                }}
                active={false}
                title={
                  editor.can().mergeCells()
                    ? "Merge Selected Cells"
                    : "Split Cell"
                }
              >
                <span className="text-xs font-semibold px-0.5">
                  {editor.can().mergeCells() ? "Merge" : "Split"}
                </span>
              </MenuButton>

              <Divider />

              <MenuButton
                onClick={() => editor.chain().focus().deleteTable().run()}
                title="Delete Table"
                danger
              >
                <span className="text-xs font-semibold text-red-600 dark:text-red-400 px-0.5">
                  Del Table
                </span>
              </MenuButton>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          EDITOR CANVAS — LibreOffice-style grey canvas + white paper
          ══════════════════════════════════════════════════ */}
      <div className={editable ? "editor-canvas" : "p-6"}>
        {editable ? (
          <div className="editor-paper">
            <EditorContent editor={editor} />
          </div>
        ) : (
          <EditorContent editor={editor} />
        )}
      </div>

      {/* AI Floating Toolbar — appears on text selection */}
      {editable && (
        <AISelectionToolbar
          editor={editor}
          aiProcessing={aiProcessing}
          aiActions={AI_ACTIONS}
          onAction={handleAiOnSelection}
        />
      )}
    </div>
  );
};

/** Custom floating toolbar that appears on text selection (no BubbleMenu dep) */
const AISelectionToolbar: React.FC<{
  editor: ReturnType<typeof useEditor>;
  aiProcessing: string | null;
  aiActions: { command: AICommand; label: string }[];
  onAction: (command: AICommand, label: string) => void;
}> = ({ editor, aiProcessing, aiActions, onAction }) => {
  const [coords, setCoords] = React.useState<{
    top: number;
    left: number;
  } | null>(null);

  React.useEffect(() => {
    if (!editor) return;

    const handleSelectionUpdate = () => {
      const { from, to } = editor.state.selection;
      if (from === to) {
        setCoords(null);
        return;
      }
      // Get bounding rect of the selection end
      const domAtPos = editor.view.coordsAtPos(to);
      // Position above the selection
      const editorDom = editor.view.dom.closest(
        ".border",
      ) as HTMLElement | null;
      if (!editorDom) {
        setCoords(null);
        return;
      }
      const editorRect = editorDom.getBoundingClientRect();
      setCoords({
        top: domAtPos.top - editorRect.top - 44,
        left: Math.max(0, domAtPos.left - editorRect.left - 100),
      });
    };

    editor.on("selectionUpdate", handleSelectionUpdate);
    editor.on("blur", () => setCoords(null));
    return () => {
      editor.off("selectionUpdate", handleSelectionUpdate);
      editor.off("blur", () => setCoords(null));
    };
  }, [editor]);

  if (!coords) return null;

  return (
    <div
      className="absolute z-50 flex items-center gap-0.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl p-1"
      style={{ top: coords.top, left: coords.left }}
    >
      <span className="flex items-center gap-1 px-1.5 text-brand-primary dark:text-sky-400">
        <SparklesIcon className="w-3.5 h-3.5" />
      </span>
      <div className="w-px h-5 bg-gray-200 dark:bg-gray-600" />
      {aiActions.map(({ command, label }) => (
        <button
          key={command}
          type="button"
          onMouseDown={(e) => {
            e.preventDefault(); // prevent blur
            onAction(command, label);
          }}
          disabled={aiProcessing !== null}
          title={label}
          className={`px-2 py-1 text-xs font-medium rounded transition-colors
            ${
              aiProcessing === command
                ? "bg-brand-primary/10 dark:bg-sky-900/30 text-brand-primary dark:text-sky-400 animate-pulse"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }
            disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {aiProcessing === command ? "..." : label}
        </button>
      ))}
    </div>
  );
};

export default RichTextEditor;
