import React from 'react';
import { Project, NavigationState, MockSurvey } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';
import { useProjectStore } from '@/stores/useProjectStore';
import { ClipboardDocumentSearchIcon, PlusIcon } from '@/components/icons';
import { Button } from "@/components/ui/Button";
import { TableContainer } from "@/components/ui/ScrollableContainer";
import { EmptyState } from "@/components/ui/FeedbackStates";

interface SurveyListComponentProps {
  project: Project;
  setNavigation: (state: NavigationState) => void;
}

const SurveyListComponent: React.FC<SurveyListComponentProps> = ({
  project,
  setNavigation,
}) => {
  const { t } = useTranslation();
  const { startMockSurvey } = useProjectStore();

  const surveys = project.mockSurveys || [];

  const handleStartSurvey = async () => {
    const { newSurvey } = await startMockSurvey(project.id);
    setNavigation({
      view: "mockSurvey",
      projectId: project.id,
      surveyId: newSurvey.id,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">{t("mockSurveys")}</h2>
        <Button onClick={handleStartSurvey} size="sm">
          <PlusIcon className="w-4 h-4 mr-2" aria-hidden="true" />
          {t("startNewSurvey")}
        </Button>
      </div>

      {surveys.length === 0 ? (
        <EmptyState
          icon={<ClipboardDocumentSearchIcon className="w-16 h-16" />}
          title={t("noMockSurveys")}
          description={
            t("noMockSurveysDescription") ||
            "Start your first mock survey to begin the assessment process."
          }
          action={{
            label: t("startNewSurvey"),
            onClick: handleStartSurvey,
          }}
        />
      ) : (
        <div className="bg-brand-surface dark:bg-dark-brand-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-brand-border">
          <TableContainer>
            <table
              className="min-w-full divide-y divide-gray-200 dark:divide-dark-brand-border"
              role="table"
              aria-label={t("mockSurveys")}
            >
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-700 dark:text-gray-300"
                  >
                    {t("date")}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-700 dark:text-gray-300"
                  >
                    {t("status")}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-700 dark:text-gray-300"
                  >
                    {t("actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-dark-brand-border">
                {surveys.map((survey: MockSurvey) => (
                  <tr key={survey.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(survey.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          survey.status === "Completed"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        }`}
                      >
                        {survey.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {survey.status === "In Progress" ? (
                        <Button
                          onClick={() =>
                            setNavigation({
                              view: "mockSurvey",
                              projectId: project.id,
                              surveyId: survey.id,
                            })
                          }
                          variant="ghost"
                          size="sm"
                          aria-label={`${t("continueSurvey")} ${new Date(
                            survey.date
                          ).toLocaleDateString()}`}
                        >
                          {t("continueSurvey")}
                        </Button>
                      ) : (
                        <Button
                          onClick={() =>
                            setNavigation({
                              view: "surveyReport",
                              projectId: project.id,
                              surveyId: survey.id,
                            })
                          }
                          variant="ghost"
                          size="sm"
                          aria-label={`${t("viewReport")} ${new Date(
                            survey.date
                          ).toLocaleDateString()}`}
                        >
                          {t("viewReport")}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableContainer>
        </div>
      )}
    </div>
  );
};

export default SurveyListComponent;
