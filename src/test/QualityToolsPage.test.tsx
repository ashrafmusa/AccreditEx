import React from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import QualityToolsPage from "@/pages/QualityToolsPage";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { en } from "@/data/locales/en/qualityInsights";
import { ar } from "@/data/locales/ar/qualityInsights";
import { NavigationState } from "@/types";
import { useModuleStore } from "@/stores/useModuleStore";

let language: "en" | "ar" = "en";
let allowRead = true;
jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: translate }),
}));
const translate = (key: string) => {
  const messages: Record<string, string> = language === "en" ? en : ar;
  return messages[key] || key;
};
jest.mock("@/hooks/usePermission", () => ({
  ...jest.requireActual("@/hooks/usePermission"),
  usePermission: () => ({ can: () => allowRead }),
}));
jest.mock("@/components/clinical/EwsScoreModal", () => ({
  __esModule: true,
  default: ({ onClose }: { onClose: () => void }) => (
    <div role="dialog" aria-label="NEWS2">
      <button onClick={onClose}>Close NEWS2</button>
    </div>
  ),
}));
jest.mock("@/components/clinical/BurnsCalculatorModal", () => ({
  __esModule: true,
  default: ({ onClose }: { onClose: () => void }) => (
    <div role="dialog" aria-label="Burns">
      <button onClick={onClose}>Close burns</button>
    </div>
  ),
}));

describe("Quality Tools journey", () => {
  beforeEach(() => {
    language = "en";
    useModuleStore.getState().reset();
    allowRead = true;
  });

  it("shows real catalogue counts without claiming standards coverage or promising unavailable tools", () => {
    // Act
    render(<QualityToolsPage setNavigation={jest.fn()} />);
    // Assert
    expect(screen.getAllByRole("article")).toHaveLength(4);
    expect(screen.getByRole("status")).toHaveTextContent("4 tools shown");
    expect(
      screen.getByText(en.qualityToolsCatalogueCount).parentElement,
    ).toHaveTextContent("4Catalogue tools");
    expect(
      screen.getByText(en.qualityAidToolsStatClinicalCalculators).parentElement,
    ).toHaveTextContent("2Clinical Calculators");
    expect(
      screen.getByText(en.qualityToolsWorkspaceCount).parentElement,
    ).toHaveTextContent("2Linked workspaces");
    expect(screen.queryByText("9+")).not.toBeInTheDocument();
    expect(screen.queryByText("Coming Soon")).not.toBeInTheDocument();
    expect(
      screen.queryByText(en.qualityAidToolsStatDepartmentsSupported),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(en.qualityAidToolsStatSmcsStandardsCovered),
    ).not.toBeInTheDocument();
    expect(screen.getByText(en.qualityToolsUseNotice)).toBeInTheDocument();
  });

  it.each(["en", "ar"] as const)(
    "filters tools and navigates to the accurately labelled training workspace in %s",
    (lang) => {
      // Arrange
      language = lang;
      const messages = lang === "en" ? en : ar;
      const navigate = jest.fn();
      render(<QualityToolsPage setNavigation={navigate} />);
      // Act
      fireEvent.click(
        screen.getByRole("button", {
          name: `${messages.qualityAidToolsBadgeTraining} (1)`,
        }),
      );
      // Assert
      expect(screen.getAllByRole("article")).toHaveLength(1);
      expect(screen.getByRole("status")).toHaveTextContent(
        messages.qualityToolsShowing.replace("{count}", "1"),
      );
      // Act
      fireEvent.click(
        screen.getByRole("button", { name: messages.qualityToolsOpenTraining }),
      );
      // Assert
      expect(navigate).toHaveBeenCalledWith({ view: "trainingHub" });
    },
  );

  it("respects disabled modules in both catalogue actions and follow-through links", () => {
    // Arrange
    useModuleStore.setState({
      enabledModules: new Set(
        [...useModuleStore.getState().enabledModules].filter(
          (id) => id !== "trainingHub" && id !== "riskManagement",
        ),
      ),
    });
    const navigate = jest.fn();
    render(<QualityToolsPage setNavigation={navigate} />);
    // Assert
    expect(screen.getAllByRole("article")).toHaveLength(3);
    expect(
      screen.queryByRole("button", { name: en.qualityToolsOpenTraining }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: en.qualityToolsOpenImprovement }),
    ).not.toBeInTheDocument();
    // Act
    fireEvent.click(screen.getByRole("button", { name: "Training (0)" }));
    // Assert
    expect(screen.getByText(en.qualityToolsNoCategory)).toBeInTheDocument();
    // Act
    fireEvent.click(
      screen.getByRole("button", { name: en.qualityToolsShowAll }),
    );
    // Assert
    expect(screen.getAllByRole("article")).toHaveLength(3);
    expect(navigate).not.toHaveBeenCalled();
  });

  it("updates catalogue availability when organization modules change without remounting", () => {
    // Arrange
    render(<QualityToolsPage setNavigation={jest.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Training (1)" }));
    // Act
    fireEvent.click(screen.getByRole("button", { name: "All tools (4)" }));
    act(() => {
      useModuleStore.setState({
        enabledModules: new Set(
          [...useModuleStore.getState().enabledModules].filter(
            (id) => id !== "trainingHub",
          ),
        ),
      });
    });
    // Assert
    expect(screen.getAllByRole("article")).toHaveLength(3);
    expect(
      screen.getByRole("button", { name: "Training (0)" }),
    ).toBeInTheDocument();
  });

  it("does not offer workspace navigation without read access", () => {
    // Arrange
    allowRead = false;
    // Act
    render(<QualityToolsPage setNavigation={jest.fn()} />);
    // Assert
    expect(screen.getAllByRole("article")).toHaveLength(2);
    expect(
      screen.queryByRole("button", { name: en.qualityToolsOpenProjects }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: en.qualityToolsOpenEvidence }),
    ).not.toBeInTheDocument();
  });

  it("opens and closes the existing reference tools without navigating or saving data", async () => {
    // Arrange
    const navigate = jest.fn();
    render(<QualityToolsPage setNavigation={navigate} />);
    // Act
    fireEvent.click(
      screen.getByRole("button", { name: en.qualityToolsOpenNews2 }),
    );
    const news = await screen.findByRole("dialog", { name: "NEWS2" });
    fireEvent.click(within(news).getByRole("button", { name: "Close NEWS2" }));
    // Assert
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    // Act
    fireEvent.click(
      screen.getByRole("button", { name: en.qualityToolsOpenBurns }),
    );
    const burns = await screen.findByRole("dialog", { name: "Burns" });
    fireEvent.click(within(burns).getByRole("button", { name: "Close burns" }));
    // Assert
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
  });

  it.each([
    [en.qualityToolsOpenTemplates, "templateLibrary"],
    [en.qualityToolsOpenProjects, "projects"],
    [en.qualityToolsOpenEvidence, "documentControl"],
    [en.qualityToolsOpenImprovement, "riskHub"],
  ] as const)("opens the correct destination for %s", (label, view) => {
    // Arrange
    const navigate = jest.fn();
    render(<QualityToolsPage setNavigation={navigate} />);
    // Act
    fireEvent.click(screen.getByRole("button", { name: label }));
    // Assert
    expect(navigate).toHaveBeenCalledWith({ view });
  });

  it("uses the Quality Tools browser title in both languages instead of Dashboard", () => {
    // Arrange
    const Title = ({ navigation }: { navigation: NavigationState }) => {
      useDocumentTitle(navigation);
      return null;
    };
    const navigation: NavigationState = { view: "qualityTools" };
    const { rerender } = render(<Title navigation={navigation} />);
    // Assert
    expect(document.title).toBe(`${en.qualityAidTools} | AccreditEx`);
    expect(document.querySelector('meta[name="description"]')).toHaveAttribute(
      "content",
      en.qualityAidToolsDescription,
    );
    // Act
    language = "ar";
    rerender(<Title navigation={navigation} />);
    // Assert
    expect(document.title).toBe(`${ar.qualityAidTools} | AccreditEx`);
    expect(document.querySelector('meta[name="description"]')).toHaveAttribute(
      "content",
      ar.qualityAidToolsDescription,
    );
  });
});
