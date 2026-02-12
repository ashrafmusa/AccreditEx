import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { collection, query, getDocs, limit } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import { Link } from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Image } from "@tiptap/extension-image";
import { TextAlign } from "@tiptap/extension-text-align";
import { Underline } from "@tiptap/extension-underline";
import { Highlight } from "@tiptap/extension-highlight";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { Mention } from "@tiptap/extension-mention";
import { ReactRenderer } from "@tiptap/react";
import tippy, { Instance as TippyInstance } from "tippy.js";
import "tippy.js/dist/tippy.css";
import { marked } from "marked";
import { SlashCommandExtension } from "../../extensions/SlashCommandExtension";
import {
  aiWritingService,
  type AICommand,
} from "../../services/aiWritingService";
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
} from "../icons";

interface RichTextEditorEnhancedProps {
  content: string;
  onChange: (html: string) => void;
  editable?: boolean;
  placeholder?: string;
}

// Mention list component
const MentionList = React.forwardRef((props: any, ref) => {
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  React.useEffect(() => {
    setSelectedIndex(0);
  }, [props.items]);

  React.useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: any) => {
      if (event.key === "ArrowUp") {
        setSelectedIndex(
          (selectedIndex + props.items.length - 1) % props.items.length
        );
        return true;
      }

      if (event.key === "ArrowDown") {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
        return true;
      }

      if (event.key === "Enter") {
        const item = props.items[selectedIndex];
        if (item) {
          props.command(item);
        }
        return true;
      }

      return false;
    },
  }));

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg overflow-hidden max-h-80 overflow-y-auto">
      {props.items.length ? (
        props.items.map((item: any, index: number) => (
          <button
            key={item.id}
            onClick={() => props.command(item)}
            className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 ${
              index === selectedIndex ? "bg-gray-100 dark:bg-gray-700" : ""
            }`}
          >
            {item.photoURL ? (
              <img
                src={item.photoURL}
                alt={item.name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary font-semibold text-sm">
                {item.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="font-medium text-sm">{item.name}</div>
              {item.email && (
                <div className="text-xs text-gray-500">{item.email}</div>
              )}
            </div>
          </button>
        ))
      ) : (
        <div className="px-4 py-2 text-sm text-gray-500">No users found</div>
      )}
    </div>
  );
});

MentionList.displayName = "MentionList";

const RichTextEditorEnhanced: React.FC<RichTextEditorEnhancedProps> = ({
  content,
  onChange,
  editable = true,
  placeholder = "Start typing... (type / for commands, @ to mention)",
}) => {
  const [isAILoading, setIsAILoading] = React.useState(false);
  const [aiError, setAiError] = React.useState<string | null>(null);
  const [pendingAICommand, setPendingAICommand] = React.useState<{
    command: AICommand;
    text: string;
    range: { from: number; to: number };
  } | null>(null);

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
      Highlight.configure({
        multicolor: true,
      }),
      TextStyle,
      Color,
      // Mention extension for @user comments
      Mention.configure({
        HTMLAttributes: {
          class:
            "mention bg-brand-primary/10 text-brand-primary px-1 rounded font-medium",
        },
        suggestion: {
          items: async ({ query: searchQuery }) => {
            try {
              // Fetch real users from Firebase
              const usersRef = collection(db, "users");
              const q = searchQuery ? usersRef : query(usersRef, limit(10));

              const snapshot = await getDocs(q);
              const users = snapshot.docs.map((doc) => ({
                id: doc.id,
                name: doc.data().name || doc.data().email || "Unknown User",
                email: doc.data().email,
                photoURL: doc.data().photoURL,
              }));

              // Filter by search query if provided
              const filtered = searchQuery?.toLowerCase()
                ? users.filter(
                    (user) =>
                      user.name
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                      user.email
                        ?.toLowerCase()
                        .includes(searchQuery.toLowerCase())
                  )
                : users;

              return filtered.slice(0, 5);
            } catch (error) {
              console.error("Failed to fetch users:", error);
              return [];
            }
          },
          render: () => {
            let component: ReactRenderer;
            let popup: TippyInstance[];

            return {
              onStart: (props: any) => {
                component = new ReactRenderer(MentionList, {
                  props,
                  editor: props.editor,
                });

                popup = tippy("body", {
                  getReferenceClientRect: props.clientRect,
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: "manual",
                  placement: "bottom-start",
                });
              },
              onUpdate(props: any) {
                component.updateProps(props);

                popup[0].setProps({
                  getReferenceClientRect: props.clientRect,
                });
              },
              onKeyDown(props: any) {
                if (props.event.key === "Escape") {
                  popup[0].hide();
                  return true;
                }

                return (component.ref as any)?.onKeyDown(props);
              },
              onExit() {
                popup[0].destroy();
                component.destroy();
              },
            };
          },
        },
      }),
      // Slash commands extension
      SlashCommandExtension,
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

  // Convert markdown to HTML for better UX
  const convertMarkdownToHtml = (markdown: string): string => {
    try {
      // Configure marked to be more permissive and user-friendly
      marked.setOptions({
        breaks: true, // Convert \n to <br>
        gfm: true, // GitHub Flavored Markdown
      });

      const html = marked.parse(markdown) as string;
      return html;
    } catch (error) {
      console.error("Markdown conversion error:", error);
      // If markdown parsing fails, return the original text wrapped in <p>
      return `<p>${markdown}</p>`;
    }
  };

  // AI Writing Assistant functions
  const handleAICommand = async (command: AICommand, isRetry = false) => {
    if (!editor) return;

    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, " ");

    if (!selectedText.trim() && !isRetry) {
      setAiError("Please select some text first");
      setTimeout(() => setAiError(null), 3000);
      return;
    }

    // Store pending command for retry
    if (!isRetry) {
      setPendingAICommand({ command, text: selectedText, range: { from, to } });
    }

    setIsAILoading(true);
    setAiError(null);

    try {
      const result = await aiWritingService.processText({
        command,
        text:
          isRetry && pendingAICommand ? pendingAICommand.text : selectedText,
      });

      if (result) {
        // Convert markdown to HTML for better formatting
        const htmlContent = convertMarkdownToHtml(result);
        editor
          .chain()
          .focus()
          .deleteSelection()
          .insertContent(htmlContent)
          .run();

        // Clear pending command on success
        setPendingAICommand(null);
        setAiError(null);
      } else {
        throw new Error("No response from AI service");
      }
    } catch (error: any) {
      console.error("AI command error:", error);

      // Provide user-friendly error messages
      let errorMessage = "AI service is temporarily unavailable. ";

      if (
        error.message?.includes("timeout") ||
        error.message?.includes("ECONNABORTED")
      ) {
        errorMessage =
          "Request timed out. The AI service is taking longer than expected. ";
      } else if (
        error.message?.includes("Network Error") ||
        error.message?.includes("Failed to fetch")
      ) {
        errorMessage = "Network error. Please check your internet connection. ";
      } else if (error.response?.status === 503) {
        errorMessage = "AI service is currently unavailable. ";
      } else if (error.response?.status === 429) {
        errorMessage = "Too many requests. Please wait a moment. ";
      }

      setAiError(errorMessage);
      // Keep the error visible but auto-hide after 10 seconds
      setTimeout(() => {
        if (aiError === errorMessage) {
          setAiError(null);
        }
      }, 10000);
    } finally {
      setIsAILoading(false);
    }
  };

  const retryAICommand = () => {
    if (pendingAICommand && editor) {
      // Restore selection
      editor.commands.setTextSelection({
        from: pendingAICommand.range.from,
        to: pendingAICommand.range.to,
      });
      handleAICommand(pendingAICommand.command, true);
    }
  };

  const cancelAICommand = () => {
    setIsAILoading(false);
    setAiError(null);
    setPendingAICommand(null);
  };

  const addLink = () => {
    const url = window.prompt("Enter URL:");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const addImage = () => {
    const url = window.prompt("Enter image URL:");
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

  const MenuButton = ({ onClick, active, disabled, children, title }: any) => (
    <button
      onClick={onClick}
      disabled={disabled || isAILoading}
      title={title}
      className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors ${
        active ? "bg-gray-200 dark:bg-gray-600" : ""
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
      {editable && (
        <>
          {/* AI Assistant Toolbar */}
          <div className="border-b border-gray-300 dark:border-gray-600 p-2 flex flex-wrap gap-2 bg-rose-50 dark:bg-pink-900/20">
            <div className="flex items-center gap-2 text-sm font-semibold text-pink-600 dark:text-rose-300">
              <span className="text-lg">✨</span>
              AI Assistant:
            </div>
            <button
              onClick={() => handleAICommand("improve")}
              disabled={isAILoading}
              className="px-3 py-1 text-sm rounded bg-rose-600 text-white hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isAILoading ? "Processing..." : "Improve"}
            </button>
            <button
              onClick={() => handleAICommand("fix-grammar")}
              disabled={isAILoading}
              className="px-3 py-1 text-sm rounded bg-rose-600 text-white hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Fix Grammar
            </button>
            <button
              onClick={() => handleAICommand("simplify")}
              disabled={isAILoading}
              className="px-3 py-1 text-sm rounded bg-rose-600 text-white hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Simplify
            </button>
            <button
              onClick={() => handleAICommand("professional")}
              disabled={isAILoading}
              className="px-3 py-1 text-sm rounded bg-rose-600 text-white hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Make Professional
            </button>
            <button
              onClick={() => handleAICommand("summarize")}
              disabled={isAILoading}
              className="px-3 py-1 text-sm rounded bg-rose-600 text-white hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Summarize
            </button>
            <button
              onClick={() => handleAICommand("expand")}
              disabled={isAILoading}
              className="px-3 py-1 text-sm rounded bg-rose-600 text-white hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Expand
            </button>
            <span className="text-xs text-gray-500 dark:text-gray-400 self-center">
              (Select text first)
            </span>
          </div>

          {/* AI Error/Loading Notification */}
          {(aiError || (isAILoading && pendingAICommand)) && (
            <div
              className={`border-b border-gray-300 dark:border-gray-600 p-3 ${
                aiError
                  ? "bg-red-50 dark:bg-red-900/20"
                  : "bg-blue-50 dark:bg-blue-900/20"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1">
                  {isAILoading ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-blue-600 dark:text-blue-400"
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
                      <span className="text-sm text-blue-700 dark:text-blue-300">
                        Processing with AI... This may take a few seconds.
                      </span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="h-5 w-5 text-red-600 dark:text-red-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-sm text-red-700 dark:text-red-300">
                        {aiError}
                      </span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {aiError && pendingAICommand && (
                    <button
                      onClick={retryAICommand}
                      className="px-3 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700 transition-colors font-medium"
                    >
                      Retry
                    </button>
                  )}
                  {isAILoading && (
                    <button
                      onClick={cancelAICommand}
                      className="px-3 py-1 text-xs rounded bg-gray-600 text-white hover:bg-gray-700 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  )}
                  {aiError && (
                    <button
                      onClick={() => setAiError(null)}
                      className="p-1 hover:bg-red-200 dark:hover:bg-red-800 rounded transition-colors"
                      aria-label="Dismiss"
                    >
                      <svg
                        className="w-4 h-4 text-red-600 dark:text-red-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Standard Formatting Toolbar */}
          <div className="border-b border-gray-300 dark:border-gray-600 p-2 flex flex-wrap gap-1 bg-gray-50 dark:bg-gray-900">
            {/* Text Formatting */}
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
              onClick={() => editor.chain().focus().toggleCode().run()}
              active={editor.isActive("code")}
              title="Code"
            >
              <CodeIcon className="w-4 h-4" />
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              active={editor.isActive("highlight")}
              title="Highlight"
            >
              <span className="text-sm font-bold">H</span>
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
                title={`Heading ${level}`}
              >
                <span className="text-sm font-semibold">H{level}</span>
              </MenuButton>
            ))}

            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

            {/* Lists */}
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

            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

            {/* Block Elements */}
            <MenuButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              active={editor.isActive("blockquote")}
              title="Quote"
            >
              <QuoteIcon className="w-4 h-4" />
            </MenuButton>
            <MenuButton
              onClick={addLink}
              active={editor.isActive("link")}
              title="Add Link"
            >
              <LinkIcon className="w-4 h-4" />
            </MenuButton>
            <MenuButton onClick={addImage} title="Add Image">
              <ImageIcon className="w-4 h-4" />
            </MenuButton>
            <MenuButton onClick={addTable} title="Insert Table">
              <TableIcon className="w-4 h-4" />
            </MenuButton>

            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

            {/* Undo/Redo */}
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
          </div>

          {/* Helper Text */}
          <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 border-b border-gray-300 dark:border-gray-600">
            <strong>Tip:</strong> Type{" "}
            <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">
              /
            </kbd>{" "}
            for quick commands • Type{" "}
            <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">
              @
            </kbd>{" "}
            to mention users
          </div>
        </>
      )}
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditorEnhanced;
