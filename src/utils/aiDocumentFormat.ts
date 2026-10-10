import DOMPurify from "dompurify";
import { marked } from "marked";

export type AIDocumentFormat = "html" | "markdown" | "text";

export const documentDownload: Record<AIDocumentFormat, { mime: string; extension: string }> = {
  html: { mime: "text/html;charset=utf-8", extension: "html" },
  markdown: { mime: "text/markdown;charset=utf-8", extension: "md" },
  text: { mime: "text/plain;charset=utf-8", extension: "txt" },
};

export function aiDocumentToHtml(content: string, format: AIDocumentFormat = "html"): string {
  const html = format === "markdown" ? marked.parse(content, { async: false })
    : format === "text" ? `<p>${content.replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/\r?\n/g, "<br>")}</p>` : content;
  return DOMPurify.sanitize(html);
}
