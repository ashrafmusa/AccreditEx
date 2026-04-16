import { render } from "@testing-library/react";
import React from "react";

import { useKeyboardShortcuts } from "@/hooks/useKeyboardNavigation";

const TestHarness: React.FC<{ onShortcut: () => void }> = ({ onShortcut }) => {
  useKeyboardShortcuts([
    {
      key: "a",
      handler: onShortcut,
    },
  ]);

  return (
    <div>
      <input aria-label="editable-input" />
      <textarea aria-label="editable-textarea" />
      <div aria-label="editable-div" contentEditable>
        editable
      </div>
      <button type="button">outside</button>
    </div>
  );
};

describe("useKeyboardShortcuts", () => {
  it("does not trigger single-key shortcuts while typing in inputs", () => {
    const onShortcut = jest.fn();
    const { getByLabelText } = render(<TestHarness onShortcut={onShortcut} />);

    const input = getByLabelText("editable-input");
    input.dispatchEvent(
      new KeyboardEvent("keydown", { key: "a", bubbles: true }),
    );

    expect(onShortcut).not.toHaveBeenCalled();
  });

  it("does not trigger single-key shortcuts while typing in textareas", () => {
    const onShortcut = jest.fn();
    const { getByLabelText } = render(<TestHarness onShortcut={onShortcut} />);

    const textarea = getByLabelText("editable-textarea");
    textarea.dispatchEvent(
      new KeyboardEvent("keydown", { key: "a", bubbles: true }),
    );

    expect(onShortcut).not.toHaveBeenCalled();
  });

  it("still triggers shortcuts outside editable targets", () => {
    const onShortcut = jest.fn();
    render(<TestHarness onShortcut={onShortcut} />);

    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "a", bubbles: true }),
    );

    expect(onShortcut).toHaveBeenCalledTimes(1);
  });
});
