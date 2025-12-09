import React, { useState } from "react";
import { TrainingProgram, NavigationState } from "../types";
import { useTranslation } from "../hooks/useTranslation";
import { useSanitizedHTML } from "../hooks/useSanitizedHTML";
import { useAppStore } from "../stores/useAppStore";
import { useToast } from "../hooks/useToast";
import { AcademicCapIcon } from "../components/icons";
import { Button } from "@/components/ui";

interface TrainingDetailPageProps {
  trainingProgram: TrainingProgram;
  setNavigation: (state: NavigationState) => void;
}

const TrainingDetailPage: React.FC<TrainingDetailPageProps> = ({
  trainingProgram,
  setNavigation,
}) => {
  const { t, lang } = useTranslation();
  const toast = useToast();
  const submitQuiz = useAppStore((state) => state.submitQuiz);
  const [answers, setAnswers] = useState<{ [key: string]: number }>({});
  const [quizResult, setQuizResult] = useState<{
    score: number;
    passed: boolean;
  } | null>(null);

  const handleAnswerChange = (questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(answers).length !== trainingProgram.quiz.length) {
      toast.error("Please answer all questions.");
      return;
    }
    const { score, passed, certificateId } = await submitQuiz(
      trainingProgram.id,
      answers
    );
    setQuizResult({ score, passed });
    if (passed && certificateId) {
      toast.success(`Quiz passed! Score: ${score}%. Certificate generated.`);
      setTimeout(
        () => setNavigation({ view: "certificate", certificateId }),
        2000
      );
    } else if (passed) {
      toast.success(`Quiz passed! Score: ${score}%.`);
    } else {
      toast.error(
        `Quiz failed. Score: ${score}%. A score of ${trainingProgram.passingScore}% is required to pass.`
      );
    }
  };

  if (quizResult) {
    return (
      <div className="max-w-4xl mx-auto text-center bg-brand-surface dark:bg-dark-brand-surface p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold">{t("quizResults")}</h1>
        <p className="mt-4">
          {t("yourScore")}:{" "}
          <span className="font-bold text-3xl">{quizResult.score}%</span>
        </p>
        <p
          className={`mt-2 font-semibold text-xl ${
            quizResult.passed ? "text-green-600" : "text-red-600"
          }`}
        >
          {quizResult.passed ? t("passed") : t("failed")}
        </p>
        <Button
          onClick={() =>
            quizResult.passed
              ? setNavigation({ view: "trainingHub" })
              : setQuizResult(null)
          }
          className="mt-6"
        >
          {quizResult.passed ? t("backToHub") : t("retakeQuiz")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center space-x-3 rtl:space-x-reverse self-start">
        <AcademicCapIcon className="h-8 w-8 text-brand-primary" />
        <div>
          <h1 className="text-3xl font-bold dark:text-dark-brand-text-primary">
            {trainingProgram.title[lang]}
          </h1>
        </div>
      </div>

      <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-lg shadow-sm border border-brand-border dark:border-dark-brand-border">
        <h2 className="text-xl font-semibold mb-4">{t("content")}</h2>
        <SanitizedContent content={trainingProgram.content[lang]} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-lg shadow-sm border border-brand-border dark:border-dark-brand-border space-y-6"
      >
        <h2 className="text-xl font-semibold">{t("quizSection")}</h2>
        {trainingProgram.quiz.map((q, qIndex) => (
          <div key={q.id}>
            <p className="font-semibold">
              {qIndex + 1}. {q.question[lang]}
            </p>
            <div className="mt-2 space-y-2">
              {q.options.map((opt, oIndex) => (
                <label
                  key={oIndex}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <input
                    type="radio"
                    name={q.id}
                    value={oIndex}
                    onChange={() => handleAnswerChange(q.id, oIndex)}
                    className="text-brand-primary focus:ring-brand-primary"
                  />
                  <span>{opt[lang]}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
        <div className="text-right">
          <Button type="submit">{t("submitAnswers")}</Button>
        </div>
      </form>
    </div>
  );
};

// Helper component to render sanitized HTML
const SanitizedContent: React.FC<{ content: string }> = ({ content }) => {
  const sanitizedContent = useSanitizedHTML(content);
  return (
    <div
      className="prose dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
};

export default TrainingDetailPage;
