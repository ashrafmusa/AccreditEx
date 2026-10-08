import { extractActions, validateAction } from "@/utils/aiActions";

const block = (json: string) => "```accreditex-action\n" + json + "\n```";

describe("aiActions", () => {
  it("extracts a valid create_risk action and strips the block from text", () => {
    // Arrange
    const reply =
      "Here is a risk.\n" +
      block(
        '{"type":"create_risk","title":"Expired fire safety training","description":"d","likelihood":4,"impact":9,"mitigationPlan":"Retrain"}',
      );

    // Act
    const { text, actions } = extractActions(reply);

    // Assert
    expect(text).toBe("Here is a risk.");
    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({
      type: "create_risk",
      likelihood: 4,
      impact: 5,
    });
  });

  it("drops malformed JSON and unknown action types", () => {
    // Arrange
    const reply =
      "Hi" + block("{not json") + block('{"type":"delete_everything"}');

    // Act
    const { text, actions } = extractActions(reply);

    // Assert
    expect(text).toBe("Hi");
    expect(actions).toEqual([]);
  });

  it("accepts single-backtick fences produced by the model", () => {
    const reply =
      'Ready.\n`accreditex-action {"type":"create_risk","title":"Fridge","likelihood":3,"impact":4,"mitigationPlan":"## Controls\\n- alarm"}`';
    const { text, actions } = extractActions(reply);
    expect(actions).toHaveLength(1);
    expect(actions[0].title).toBe("Fridge");
    expect(text).toBe("Ready.");
  });

  it("repairs JSON with raw line breaks inside strings", () => {
    const reply =
      'ok `accreditex-action {"type":"create_risk","title":"Fridge","likelihood":3,"impact":4,"mitigationPlan":"## Controls\n- alarm\n\n## Timeline\n- 30 days"}`';
    const { actions } = extractActions(reply);
    expect(actions).toHaveLength(1);
    expect(actions[0].mitigationPlan).toContain("Timeline");
  });

  it("rejects actions missing a title or scores", () => {
    // Arrange / Act / Assert
    expect(validateAction({ type: "create_risk", likelihood: 3, impact: 3 })).toBeNull();
    expect(validateAction({ type: "create_risk", title: "x", impact: 3 })).toBeNull();
    expect(validateAction(null)).toBeNull();
  });
});
