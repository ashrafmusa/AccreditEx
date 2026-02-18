import React, { useState, useEffect, FC } from "react";
import { TrainingProgram, LocalizedString } from "../../types";
import { useTranslation } from "../../hooks/useTranslation";
import { PlusIcon, TrashIcon } from "../icons";

type QuizQuestion = TrainingProgram["quiz"][0];

interface TrainingProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (program: TrainingProgram | Omit<TrainingProgram, "id">) => void;
  existingProgram: TrainingProgram | null;
}

const TrainingProgramModal: FC<TrainingProgramModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingProgram,
}) => {
  const { t, dir } = useTranslation();
  const isEditMode = !!existingProgram;

  const [title, setTitle] = useState<LocalizedString>({ en: "", ar: "" });
  const [description, setDescription] = useState<LocalizedString>({
    en: "",
    ar: "",
  });
  const [content, setContent] = useState<LocalizedString>({ en: "", ar: "" });
  const [passingScore, setPassingScore] = useState(80);
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);

  useEffect(() => {
    if (existingProgram) {
      setTitle(existingProgram.title);
      setDescription(existingProgram.description);
      setContent(existingProgram.content);
      setPassingScore(existingProgram.passingScore);
      setQuiz(existingProgram.quiz);
    } else {
      setTitle({ en: "", ar: "" });
      setDescription({ en: "", ar: "" });
      setContent({ en: "", ar: "" });
      setPassingScore(80);
      setQuiz([]);
    }
  }, [existingProgram, isOpen]);

  const handleQuizChange = <K extends keyof QuizQuestion>(
    index: number,
    field: K,
    value: QuizQuestion[K],
  ) => {
    const newQuiz = [...quiz];
    newQuiz[index] = { ...newQuiz[index], [field]: value };
    setQuiz(newQuiz);
  };

  const handleOptionChange = (
    qIndex: number,
    oIndex: number,
    lang: "en" | "ar",
    value: string,
  ) => {
    const newQuiz = [...quiz];
    newQuiz[qIndex].options[oIndex][lang] = value;
    setQuiz(newQuiz);
  };

  const addQuestion = () =>
    setQuiz([
      ...quiz,
      {
        id: `q-${Date.now()}`,
        question: { en: "", ar: "" },
        options: [{ en: "", ar: "" }],
        correctOptionIndex: 0,
      },
    ]);
  const removeQuestion = (index: number) =>
    setQuiz(quiz.filter((_, i) => i !== index));
  const addOption = (qIndex: number) => {
    const newQuiz = [...quiz];
    newQuiz[qIndex].options.push({ en: "", ar: "" });
    setQuiz(newQuiz);
  };
  const removeOption = (qIndex: number, oIndex: number) => {
    const newQuiz = [...quiz];
    newQuiz[qIndex].options = newQuiz[qIndex].options.filter(
      (_, i) => i !== oIndex,
    );
    if (newQuiz[qIndex].correctOptionIndex === oIndex) {
      newQuiz[qIndex].correctOptionIndex = 0;
    }
    setQuiz(newQuiz);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const programData = { title, description, content, passingScore, quiz };
    if (isEditMode) onSave({ ...programData, id: existingProgram.id });
    else onSave(programData);
  };

  if (!isOpen) return null;

  const inputClasses =
    "mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm bg-white dark:bg-gray-700";
  const labelClasses =
    "block text-sm font-medium text-gray-700 dark:text-gray-300";

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center backdrop-blur-sm modal-enter"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-dark-brand-surface rounded-lg shadow-xl w-full max-w-4xl h-[90vh] m-4 flex flex-col modal-content-enter"
        onClick={(e) => e.stopPropagation()}
        dir={dir}
      >
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="p-6 border-b dark:border-dark-brand-border">
            <h3 className="text-lg font-medium">
              {isEditMode ? t("editTraining") : t("createNewTraining")}
            </h3>
          </div>
          <div className="p-6 space-y-4 overflow-y-auto flex-grow">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="titleEn" className={labelClasses}>
                  {t("trainingTitle")} (EN)
                </label>
                <input
                  type="text"
                  id="titleEn"
                  value={title.en}
                  onChange={(e) =>
                    setTitle((p) => ({ ...p, en: e.target.value }))
                  }
                  className={inputClasses}
                  required
                />
              </div>
              <div>
                <label htmlFor="titleAr" className={labelClasses}>
                  {t("trainingTitle")} (AR)
                </label>
                <input
                  type="text"
                  id="titleAr"
                  value={title.ar}
                  onChange={(e) =>
                    setTitle((p) => ({ ...p, ar: e.target.value }))
                  }
                  className={inputClasses}
                  required
                  dir="rtl"
                />
              </div>
              <div>
                <label htmlFor="descEn" className={labelClasses}>
                  {t("trainingDescription")} (EN)
                </label>
                <textarea
                  id="descEn"
                  value={description.en}
                  onChange={(e) =>
                    setDescription((p) => ({ ...p, en: e.target.value }))
                  }
                  rows={2}
                  className={inputClasses}
                />
              </div>
              <div>
                <label htmlFor="descAr" className={labelClasses}>
                  {t("trainingDescription")} (AR)
                </label>
                <textarea
                  id="descAr"
                  value={description.ar}
                  onChange={(e) =>
                    setDescription((p) => ({ ...p, ar: e.target.value }))
                  }
                  rows={2}
                  className={inputClasses}
                  dir="rtl"
                />
              </div>
              <div>
                <label htmlFor="contentEn" className={labelClasses}>
                  {t("content")} (EN)
                </label>
                <textarea
                  id="contentEn"
                  value={content.en}
                  onChange={(e) =>
                    setContent((p) => ({ ...p, en: e.target.value }))
                  }
                  rows={5}
                  className={inputClasses}
                  placeholder={
                    t("htmlContentSupported") || "HTML content is supported"
                  }
                />
              </div>
              <div>
                <label htmlFor="contentAr" className={labelClasses}>
                  {t("content")} (AR)
                </label>
                <textarea
                  id="contentAr"
                  value={content.ar}
                  onChange={(e) =>
                    setContent((p) => ({ ...p, ar: e.target.value }))
                  }
                  rows={5}
                  className={inputClasses}
                  dir="rtl"
                  placeholder={
                    t("htmlContentSupportedAr") || "محتوى HTML مدعوم"
                  }
                />
              </div>
            </div>
            <div className="border-t pt-4">
              <h4 className="font-semibold">{t("quizSection")}</h4>
              <div>
                <label htmlFor="passingScore" className={labelClasses}>
                  {t("passingScore")} (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  id="passingScore"
                  value={passingScore}
                  onChange={(e) => setPassingScore(parseInt(e.target.value))}
                  className={inputClasses + " w-24"}
                />
              </div>
              <div className="space-y-4 mt-4">
                {quiz.map((q, qIndex) => (
                  <div
                    key={q.id}
                    className="p-4 border rounded-md bg-gray-50 dark:bg-gray-800 space-y-3"
                  >
                    <div className="flex justify-between items-center">
                      <label className="font-medium">
                        Question {qIndex + 1}
                      </label>
                      <button
                        type="button"
                        onClick={() => removeQuestion(qIndex)}
                        className="text-red-500"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder={t("questionEn") || "Question (EN)"}
                        value={q.question.en}
                        onChange={(e) =>
                          handleQuizChange(qIndex, "question", {
                            ...q.question,
                            en: e.target.value,
                          })
                        }
                        className={inputClasses}
                      />
                      <input
                        type="text"
                        placeholder={t("questionAr") || "Question (AR)"}
                        value={q.question.ar}
                        onChange={(e) =>
                          handleQuizChange(qIndex, "question", {
                            ...q.question,
                            ar: e.target.value,
                          })
                        }
                        className={inputClasses}
                        dir="rtl"
                      />
                    </div>
                    {q.options.map((opt, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-opt-${q.id}`}
                          checked={q.correctOptionIndex === oIndex}
                          onChange={() =>
                            handleQuizChange(
                              qIndex,
                              "correctOptionIndex",
                              oIndex,
                            )
                          }
                        />
                        <input
                          type="text"
                          placeholder={`Option ${oIndex + 1} (EN)`}
                          value={opt.en}
                          onChange={(e) =>
                            handleOptionChange(
                              qIndex,
                              oIndex,
                              "en",
                              e.target.value,
                            )
                          }
                          className={inputClasses}
                        />
                        <input
                          type="text"
                          placeholder={`Option ${oIndex + 1} (AR)`}
                          value={opt.ar}
                          onChange={(e) =>
                            handleOptionChange(
                              qIndex,
                              oIndex,
                              "ar",
                              e.target.value,
                            )
                          }
                          className={inputClasses}
                          dir="rtl"
                        />
                        {q.options.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeOption(qIndex, oIndex)}
                            className="text-red-500"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addOption(qIndex)}
                      className="text-sm text-brand-primary flex items-center gap-1"
                    >
                      <PlusIcon className="w-4 h-4" />
                      {t("addOption")}
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addQuestion}
                  className="text-sm font-semibold flex items-center gap-1"
                >
                  <PlusIcon className="w-5 h-5" />
                  {t("addQuestion")}
                </button>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-3 flex justify-end gap-3 border-t dark:border-dark-brand-border">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 border rounded-md"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              className="py-2 px-4 border rounded-md text-white bg-brand-primary"
            >
              {t("save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TrainingProgramModal;
