import React from "react";

/** Jest stand-in for the ESM-only react-markdown: renders the raw markdown text. */
const ReactMarkdown = ({ children }: { children?: React.ReactNode }) => (
  <div data-testid="md">{children}</div>
);

export default ReactMarkdown;
export type Components = Record<string, unknown>;
