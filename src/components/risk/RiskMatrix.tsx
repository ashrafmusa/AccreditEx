import React from "react";
import { Risk } from "../../types";
import { useTranslation } from "../../hooks/useTranslation";
import { getRiskLevel } from "../../utils/riskUtils";

interface RiskMatrixProps {
  risks: Risk[];
}

const RiskMatrix: React.FC<RiskMatrixProps> = ({ risks }) => {
  const { t } = useTranslation();
  const activeRisks = risks.filter(
    (r) => r.status === "Open" || r.status === "Mitigated",
  );

  const matrix: Risk[][][] = Array(5)
    .fill(null)
    .map(() =>
      Array(5)
        .fill(null)
        .map(() => []),
    );

  activeRisks.forEach((risk) => {
    const impactIndex = 5 - risk.impact; // Higher impact at the top
    const likelihoodIndex = risk.likelihood - 1; // Higher likelihood to the right
    if (
      impactIndex >= 0 &&
      impactIndex < 5 &&
      likelihoodIndex >= 0 &&
      likelihoodIndex < 5
    ) {
      matrix[impactIndex][likelihoodIndex].push(risk);
    }
  });

  return (
    <div className="bg-brand-surface dark:bg-dark-brand-surface p-4 rounded-lg shadow-sm border border-gray-200 dark:border-dark-brand-border">
      <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-4">
        {t("riskMatrix")}
      </h3>
      <div className="flex">
        <div className="flex flex-col justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 py-4 pr-2 text-right">
          <span className="h-1/5 flex items-center justify-end">
            {t("high")}
          </span>
          <span className="h-1/5 flex items-center justify-end"></span>
          <span className="h-1/5 flex items-center justify-end">
            {t("impact")}
          </span>
          <span className="h-1/5 flex items-center justify-end"></span>
          <span className="h-1/5 flex items-center justify-end">
            {t("low")}
          </span>
        </div>
        <div className="flex-1">
          <div className="grid grid-cols-5 gap-1">
            {matrix.flatMap((row, rowIndex) =>
              row.map((risksInCell, colIndex) => {
                const likelihood = colIndex + 1;
                const impact = 5 - rowIndex;
                const score = likelihood * impact;
                const level = getRiskLevel(score);
                const riskCount = risksInCell.length;
                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`h-16 w-full rounded flex items-center justify-center ${level.color} ${level.textColor} font-bold text-xl relative group`}
                    title={`${riskCount} ${t("risks")} - ${t("likelihood")}: ${likelihood}, ${t("impact")}: ${impact}`}
                  >
                    {riskCount > 0 ? riskCount : ""}
                    {riskCount > 0 && (
                      <div className="absolute bottom-full mb-2 w-48 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        <ul className="list-disc list-inside">
                          {risksInCell.map((r) => (
                            <li key={r.id} className="truncate">
                              {r.title}
                            </li>
                          ))}
                        </ul>
                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div>
                      </div>
                    )}
                  </div>
                );
              }),
            )}
          </div>
          <div className="grid grid-cols-5 text-xs font-semibold text-gray-500 dark:text-gray-400 pt-2 text-center">
            <span>{t("low")}</span>
            <span></span>
            <span>{t("likelihood")}</span>
            <span></span>
            <span>{t("high")}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskMatrix;
