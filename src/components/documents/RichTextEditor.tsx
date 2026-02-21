import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { useTranslation } from "@/hooks/useTranslation";
import StarterKit from "@tiptap/starter-kit";
import { Link } from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Image } from "@tiptap/extension-image";
import { TextAlign } from "@tiptap/extension-text-align";
import { Underline } from "@tiptap/extension-underline";
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  StrikethroughIcon,
  CodeIcon,
  ListBulletIcon,
  ListNumberIcon,
  QuoteIcon,
  LinkIcon,
  ImageIcon,
  TableIcon,
  UndoIcon,
  RedoIcon,
  SparklesIcon,
} from "../icons";
import { aiWritingService } from "@/services/aiWritingService";
import type { AICommand } from "@/services/aiWritingService";
import { useToast } from "@/hooks/useToast";

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
  placeholder = "Start typing...",
}) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [aiProcessing, setAiProcessing] = React.useState<string | null>(null);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-brand-primary underline cursor-pointer",
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-lg",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Underline,
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose dark:prose-invert max-w-none focus:outline-none min-h-[400px] p-4",
      },
    },
  });

  React.useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  React.useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editable, editor]);

  if (!editor) {
    return null;
  }

  const addLink = () => {
    const url = window.prompt(t("enterUrl") || "Enter URL:");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const addImage = () => {
    const url = window.prompt(t("enterImageUrl") || "Enter image URL:");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const addTable = () => {
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  };

  /** Run an AI writing command on the currently selected text */
  const handleAiOnSelection = async (command: AICommand, label: string) => {
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, " ");
    if (!selectedText.trim()) return;

    setAiProcessing(command);
    try {
      const result = await aiWritingService.processText({
        command,
        text: selectedText,
      });
      // Replace the selection with the AI result
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

  const AI_ACTIONS: { command: AICommand; label: string }[] = [
    { command: "improve", label: t("improve") || "Improve" },
    { command: "simplify", label: t("simplify") || "Simplify" },
    { command: "expand", label: t("expand") || "Expand" },
    { command: "formalize", label: t("formalize") || "Formalize" },
    { command: "fix_grammar", label: t("fixGrammar") || "Fix Grammar" },
  ];

  const MenuButton = ({ onClick, active, disabled, children, title }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors ${
        active ? "bg-gray-200 dark:bg-gray-600" : ""
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="relative border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
      {editable && (
        <div className="border-b border-gray-300 dark:border-gray-600 p-2 flex flex-wrap gap-1 bg-gray-50 dark:bg-gray-900">
          {/* Text Formatting */}
          <MenuButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            title={t("boldCtrlB") || "Bold (Ctrl+B)"}
          >
            <BoldIcon className="w-4 h-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            title={t("italicCtrlI") || "Italic (Ctrl+I)"}
          >
            <ItalicIcon className="w-4 h-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive("underline")}
            title={t("underlineCtrlU") || "Underline (Ctrl+U)"}
          >
            <UnderlineIcon className="w-4 h-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive("strike")}
            title={t("strikethrough") || "Strikethrough"}
          >
            <StrikethroughIcon className="w-4 h-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            active={editor.isActive("code")}
            title={t("code") || "Code"}
          >
            <CodeIcon className="w-4 h-4" />
          </MenuButton>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

          {/* Headings */}
          {([1, 2, 3] as const).map((level) => (
            <MenuButton
              key={level}
              onClick={() =>
                editor.chain().focus().toggleHeading({ level }).run()
              }
              active={editor.isActive("heading", { level })}
              title={t(`heading${level}` as any) || `Heading ${level}`}
            >
              <span className="text-sm font-semibold">H{level}</span>
            </MenuButton>
          ))}

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

          {/* Lists */}
          <MenuButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")}
            title={t("bulletList") || "Bullet List"}
          >
            <ListBulletIcon className="w-4 h-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")}
            title={t("numberedList") || "Numbered List"}
          >
            <ListNumberIcon className="w-4 h-4" />
          </MenuButton>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

          {/* Block Elements */}
          <MenuButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive("blockquote")}
            title={t("quote") || "Quote"}
          >
            <QuoteIcon className="w-4 h-4" />
          </MenuButton>
          <MenuButton
            onClick={addLink}
            active={editor.isActive("link")}
            title={t("addLink") || "Add Link"}
          >
            <LinkIcon className="w-4 h-4" />
          </MenuButton>
          <MenuButton onClick={addImage} title={t("addImage") || "Add Image"}>
            <ImageIcon className="w-4 h-4" />
          </MenuButton>
          <MenuButton
            onClick={addTable}
            title={t("insertTable") || "Insert Table"}
          >
            <TableIcon className="w-4 h-4" />
          </MenuButton>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

          {/* Undo/Redo */}
          <MenuButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title={t("undoCtrlZ") || "Undo (Ctrl+Z)"}
          >
            <UndoIcon className="w-4 h-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title={t("redoCtrlY") || "Redo (Ctrl+Y)"}
          >
            <RedoIcon className="w-4 h-4" />
          </MenuButton>
        </div>
      )}
      <EditorContent editor={editor} />

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
      <span className="flex items-center gap-1 px-1.5 text-violet-500">
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
                ? "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 animate-pulse"
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
