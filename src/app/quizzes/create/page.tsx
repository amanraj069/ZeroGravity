"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createQuiz,
  publishQuiz,
  QuizQuestion,
  updateDraft,
  getQuiz,
  generateQuizWithAI,
} from "@/services/quizzesService";
import { useAuth } from "@/contexts/AuthContext";
import ZeroGravityLoading from "@/components/ZeroGravityLoading";
import { Save, Rocket, ChevronUp } from "lucide-react";

const emptyQuestion = (): QuizQuestion => ({
  text: "",
  options: [
    { key: "1", text: "" },
    { key: "2", text: "" },
  ],
  timeLimitSeconds: 60,
  maxMarks: 100,
});

function CreateQuizContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading, checkSession } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([emptyQuestion()]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [quizId, setQuizId] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [titleError, setTitleError] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isQuestionPanelOpen, setIsQuestionPanelOpen] = useState(false);
  const [modifiedQuestions, setModifiedQuestions] = useState<Set<number>>(
    new Set(),
  );
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [jsonInput, setJsonInput] = useState("");

  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiNumOptions, setAiNumOptions] = useState("4");
  const [aiNumQuestions, setAiNumQuestions] = useState("5");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<QuizQuestion[]>(
    [],
  );
  const [addedQuestions, setAddedQuestions] = useState<Set<number>>(new Set());
  const [localAiCount, setLocalAiCount] = useState<number>(
    user?.aiGenerationCount || 0,
  );
  const [aiError, setAiError] = useState<string | null>(null);
  const aiPromptRef = React.useRef<HTMLTextAreaElement>(null);

  // Auto-resize AI prompt textarea (only after generation)
  useEffect(() => {
    if (aiPromptRef.current && showAiModal) {
      if (generatedQuestions.length > 0) {
        aiPromptRef.current.style.height = "auto";
        aiPromptRef.current.style.height = `${aiPromptRef.current.scrollHeight}px`;
      } else {
        // Reset to initial height when no questions are present
        aiPromptRef.current.style.height = "";
      }
    }
  }, [aiPrompt, showAiModal, generatedQuestions.length]);

  // Sync local count with user object
  useEffect(() => {
    if (user?.aiGenerationCount !== undefined) {
      setLocalAiCount(user.aiGenerationCount);
    }
  }, [user?.aiGenerationCount]);

  useEffect(() => {
    if (showAiModal) {
      checkSession();
    }
  }, [showAiModal]);

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) {
      setAiError("Please enter a prompt describing the quiz.");
      return;
    }
    setAiError(null);
    setIsGenerating(true);
    setGeneratedQuestions([]);
    setAddedQuestions(new Set());
    try {
      const response = await generateQuizWithAI(
        aiPrompt,
        parseInt(aiNumOptions, 10),
        parseInt(aiNumQuestions, 10),
      );
      if (response.success && response.questions) {
        setGeneratedQuestions(response.questions);
        if (response.aiGenerationCount !== undefined) {
          setLocalAiCount(response.aiGenerationCount);
        }
      } else {
        setAiError(response.message || "Failed to generate questions.");
      }
    } catch (e) {
      setAiError("An error occurred while generating questions.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddAiQuestion = (index: number) => {
    const questionToAdd = generatedQuestions[index];
    if (!questionToAdd) return;

    // Add to main question list
    setQuestions((prev) => {
      // If we only have one empty question, replace it, otherwise append.
      if (
        prev.length === 1 &&
        prev[0].text === "" &&
        prev[0].options[0].text === ""
      ) {
        return [questionToAdd];
      }
      return [...prev, questionToAdd];
    });

    // Auto-update modified status
    setModifiedQuestions((prev) => {
      const nextIdx =
        questions.length === 1 && questions[0].text === ""
          ? 0
          : questions.length;
      return new Set(prev).add(nextIdx);
    });

    setAddedQuestions((prev) => new Set(prev).add(index));
  };

  const handleAddAllAiQuestions = () => {
    // Collect all un-added questions
    const unAdded = generatedQuestions.filter(
      (_, idx) => !addedQuestions.has(idx),
    );
    if (unAdded.length === 0) return;

    setQuestions((prev) => {
      if (
        prev.length === 1 &&
        prev[0].text === "" &&
        prev[0].options[0].text === ""
      ) {
        return [...unAdded];
      }
      return [...prev, ...unAdded];
    });

    const newSet = new Set(addedQuestions);
    generatedQuestions.forEach((_, i) => newSet.add(i));
    setAddedQuestions(newSet);
  };

  const isPro = user?.subscription === "pro";

  // Load existing quiz or prefill from /createQuiz
  useEffect(() => {
    const loadSearchParams = () => {
      // Load quiz using 'quizId' or 'edit' parameter (support both)
      const existingQuizId =
        searchParams?.get("quizId") || searchParams?.get("edit");
      const isEditing = !!searchParams?.get("edit"); // Track if we're in edit mode (from host page)
      const initTitle = searchParams?.get("title");
      const initDesc = searchParams?.get("desc");

      if (existingQuizId && !isLoading && user) {
        // Load existing quiz data
        setLoadingExisting(true);
        setQuizId(existingQuizId);
        setIsEditMode(isEditing);
        getQuiz(existingQuizId)
          .then((response) => {
            if (response?.success && response?.quiz) {
              const quiz = response.quiz;
              setTitle(quiz.title || "");
              setDescription(quiz.description || "");
              if (quiz.questions && quiz.questions.length > 0) {
                setQuestions(quiz.questions);
                setCurrentIndex(0);
              }
            } else {
              console.error("Failed to load quiz:", response?.message);
              // If quiz not found, just start with defaults
              if (initTitle) setTitle(initTitle);
              if (initDesc) setDescription(initDesc);
            }
          })
          .catch((error) => {
            console.error("Error loading quiz:", error);
            // If error loading quiz, just start with defaults
            if (initTitle) setTitle(initTitle);
            if (initDesc) setDescription(initDesc);
          })
          .finally(() => {
            setLoadingExisting(false);
          });
      } else {
        // Prefill from /createQuiz or start fresh
        if (initTitle) setTitle(initTitle);
        if (initDesc) setDescription(initDesc);
      }
    };

    loadSearchParams();
  }, [searchParams, user, isLoading]);

  const addQuestion = () => {
    if (questions.length >= 100) return;
    const newIndex = questions.length;
    setQuestions((q) => [...q, emptyQuestion()]);
    setCurrentIndex(newIndex);
    // Mark the new question as modified
    setModifiedQuestions((prev) => new Set(prev).add(newIndex));
  };

  const updateQuestion = (idx: number, updates: Partial<QuizQuestion>) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, ...updates } : q)),
    );
    // Mark question as modified
    setModifiedQuestions((prev) => new Set(prev).add(idx));
  };

  const updateOption = (
    qIdx: number,
    oIdx: number,
    text: string,
    isCorrect?: boolean,
  ) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const options = q.options.map((o, j) =>
          j === oIdx ? { ...o, text, isCorrect: isCorrect ?? o.isCorrect } : o,
        );
        return { ...q, options };
      }),
    );
    // Mark question as modified
    setModifiedQuestions((prev) => new Set(prev).add(qIdx));
  };

  const addOption = (qIdx: number) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const nextKey = String(q.options.length + 1);
        return { ...q, options: [...q.options, { key: nextKey, text: "" }] };
      }),
    );
  };

  const deleteOption = (qIdx: number, oIdx: number) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        if (q.options.length <= 2) return q;

        const newOptions = q.options.filter((_, j) => j !== oIdx);
        const updatedOptions = newOptions.map((option, index) => ({
          ...option,
          key: String(index + 1),
        }));

        return { ...q, options: updatedOptions };
      }),
    );
  };

  const markCorrect = (qIdx: number, key: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        return {
          ...q,
          options: q.options.map((o) => ({ ...o, isCorrect: o.key === key })),
        };
      }),
    );
  };

  const deleteQuestion = (qIdx: number) => {
    if (questions.length <= 1) return; // Don't delete if it's the only question

    setQuestions((prev) => prev.filter((_, i) => i !== qIdx));

    // Navigate to previous question or stay at index 0
    const newIndex = qIdx > 0 ? qIdx - 1 : 0;
    setCurrentIndex(Math.min(newIndex, questions.length - 2)); // -2 because we're removing one question
  };

  const validateCurrentQuestion = () => {
    const q = questions[currentIndex];
    if (!q) return { isValid: false, message: "No question found" };

    if (!q.text || q.text.trim() === "") {
      return { isValid: false, message: "Please add a question title" };
    }

    // Check if any options have no content
    const emptyOptions = q.options?.filter(
      (o) => !o.text || o.text.trim() === "",
    );
    if (emptyOptions && emptyOptions.length > 0) {
      return {
        isValid: false,
        message: "Please add content to all answer options",
      };
    }

    // Check if at least one correct answer is marked
    const correctOptions = q.options?.filter((o) => o.isCorrect);
    if (!correctOptions || correctOptions.length === 0) {
      return {
        isValid: false,
        message: "Please mark at least one answer as correct",
      };
    }

    // Check if correct answers have content
    const hasCorrectOptionWithContent =
      q.options &&
      q.options.some((o) => o.isCorrect && o.text && o.text.trim() !== "");
    if (!hasCorrectOptionWithContent) {
      return {
        isValid: false,
        message: "Correct answer options must have content",
      };
    }

    return { isValid: true, message: "" };
  };

  const saveCurrent = async () => {
    try {
      setSaving(true);

      // Validate current question
      const validation = validateCurrentQuestion();
      if (!validation.isValid) {
        alert(validation.message);
        setSaving(false);
        return;
      }

      // Check for valid title
      const quizTitle = title.trim();
      if (
        !quizTitle ||
        quizTitle.toLowerCase() === "untitled" ||
        quizTitle.toLowerCase() === "untitled quiz"
      ) {
        setTitleError(true);
        setSaving(false);
        // Remove error state after animation completes
        setTimeout(() => setTitleError(false), 1000);
        return;
      }

      if (!quizId) {
        const created = await createQuiz({
          title: quizTitle,
          description,
          questions,
        });
        if (!created?.success)
          throw new Error(created?.message || "Create failed");
        const newQuizId = created.quiz.quizId;
        setQuizId(newQuizId);
        // Clear modified questions after successful create
        setModifiedQuestions(new Set());
        // Update URL with quizId and savedStatus (only for new quizzes)
        router.replace(`/quizzes/create?quizId=${newQuizId}&savedStatus=true`);
        return;
      }
      const result = await updateDraft(quizId, {
        title: quizTitle,
        description,
        questions,
      });
      if (!result?.success) throw new Error(result?.message || "Save failed");
      // Clear modified questions after successful save
      setModifiedQuestions(new Set());
      // Don't modify the URL when editing an existing quiz - keep the original URL format
    } catch (e) {
      alert((e as Error)?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const onPublish = async () => {
    try {
      setPublishing(true);
      let id = quizId;
      if (!id) {
        const created = await createQuiz({
          title: title || "Untitled Quiz",
          description,
          questions,
        });
        if (!created?.success)
          throw new Error(created?.message || "Create failed");
        id = created.quiz.quizId;
        setQuizId(id);
      }
      const pub = await publishQuiz(id!);
      if (!pub?.success) throw new Error(pub?.message || "Publish failed");
      router.push(`/quizzes/host/${id}?code=${pub.joinCode}`);
    } catch (e) {
      alert((e as Error)?.message || "Failed to publish quiz");
    } finally {
      setPublishing(false);
    }
  };

  if (isLoading || loadingExisting)
    return (
      <ZeroGravityLoading
        title="Loading Quiz Creator"
        subtitle="Preparing your quiz..."
        showNavigation={false}
      />
    );
  if (!isPro)
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center p-6">
          <p className="text-lg text-black dark:text-white">
            Pro subscription required to create quizzes.
          </p>
        </div>
      </div>
    );

  const q = questions[currentIndex];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Full-width header matching website design theme */}
      <div className="bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-2 flex-1">
              <button
                onClick={() => router.back()}
                className="mt-1 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                title="Go Back"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <div className="flex-1">
                <style jsx>{`
                  @keyframes shake {
                    0%,
                    100% {
                      transform: translateX(0);
                    }
                    10%,
                    30%,
                    50%,
                    70%,
                    90% {
                      transform: translateX(-4px);
                    }
                    20%,
                    40%,
                    60%,
                    80% {
                      transform: translateX(4px);
                    }
                  }
                  .shake-animation {
                    animation: shake 0.5s ease-in-out;
                  }
                `}</style>
                <div className="flex items-start gap-2">
                  <input
                    type="text"
                    className={`text-xl sm:text-3xl font-light text-black dark:text-white bg-transparent outline-none w-full placeholder-gray-400 dark:placeholder-gray-500 border-b-2 pb-1 transition-colors duration-300 ${
                      titleError
                        ? "border-red-500 shake-animation"
                        : title.trim()
                          ? "border-transparent"
                          : "border-gray-200 dark:border-gray-700"
                    }`}
                    placeholder="Enter Quiz Title..."
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (titleError) setTitleError(false);
                    }}
                  />

                  <div className="flex items-center gap-2 sm:hidden shrink-0">
                    <button
                      className="h-10 w-10 flex items-center justify-center border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                      onClick={saveCurrent}
                      disabled={saving}
                      aria-label="Save Progress"
                      title="Save Progress"
                    >
                      {saving ? (
                        <div className="w-4 h-4 border-2 border-gray-500 dark:border-gray-300 border-t-transparent animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      className="h-10 w-10 flex items-center justify-center bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
                      onClick={onPublish}
                      disabled={publishing || !title || questions.length === 0}
                      aria-label="Publish & Host"
                      title="Publish & Host"
                    >
                      {publishing ? (
                        <div className="w-4 h-4 border-2 border-white dark:border-black border-t-transparent animate-spin" />
                      ) : (
                        <Rocket className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  className="text-gray-600 dark:text-gray-400 bg-transparent border-none outline-none w-full max-w-2xl text-sm mt-1 placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="Add a description (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
            <div className="hidden sm:flex sm:ml-4 items-center gap-3">
              <button
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
                onClick={saveCurrent}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Progress"}
              </button>
              <button
                className="w-full sm:w-auto px-6 py-2 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors text-sm font-medium disabled:opacity-50"
                onClick={onPublish}
                disabled={publishing || !title || questions.length === 0}
              >
                {publishing ? "Publishing..." : "Publish & Host"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 pt-2 sm:pt-2 pb-24 sm:pb-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 px-3 sm:px-4">
          <aside className="hidden md:block order-2 md:order-1 md:col-span-3 lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-auto md:h-[580px]">
              <div className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Question Panel
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 pt-3 sm:pt-4">
                <div className="grid grid-cols-3 gap-2">
                  {questions.map((_, i) => (
                    <button
                      key={i}
                      className={`border-2 p-2 text-sm transition-all ${
                        i === currentIndex
                          ? modifiedQuestions.has(i)
                            ? "bg-black dark:bg-white text-white dark:text-black border-orange-400 dark:border-orange-500 shadow-sm"
                            : "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-sm"
                          : modifiedQuestions.has(i)
                            ? "bg-white dark:bg-gray-700 border-orange-400 dark:border-orange-500 text-gray-900 dark:text-gray-100 hover:border-orange-500"
                            : "bg-white dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-sm border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                      }`}
                      onClick={() => setCurrentIndex(i)}
                      title={`Go to question ${i + 1}${modifiedQuestions.has(i) ? " (unsaved changes)" : ""}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>
              {/* Add Question Button at Bottom */}
              <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex-shrink-0 flex flex-col gap-2">
                <button
                  className="w-full border border-dashed border-gray-300 dark:border-gray-600 p-3 text-sm bg-white dark:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all text-gray-600 dark:text-gray-300 flex items-center justify-center gap-2"
                  onClick={addQuestion}
                  disabled={questions.length >= 100}
                  title="Add question"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add Question
                </button>
                <button
                  className="w-full border border-gray-200 dark:border-gray-700 p-3 text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all font-medium flex items-center justify-center"
                  onClick={() => {
                    setJsonInput(JSON.stringify(questions, null, 2));
                    setShowJsonModal(true);
                  }}
                  title="Add questions with JSON"
                >
                  Add questions with JSON
                </button>
              </div>
            </div>
          </aside>

          <section className="order-1 md:order-2 md:col-span-9 lg:col-span-9">
            <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden h-[calc(100dvh-240px)] md:min-h-[520px] md:h-[580px] flex flex-col">
              {/* Question Header */}
              <div className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 py-2.5 sm:py-4">
                <div className="flex items-center justify-between gap-2 sm:gap-4">
                  <div className="min-w-0">
                    <span className="text-base sm:text-lg font-medium text-gray-900 dark:text-white whitespace-nowrap">
                      Question {currentIndex + 1}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
                    <label className="flex items-center gap-1 sm:gap-2 text-[11px] sm:text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium whitespace-nowrap tracking-wide">
                        Time
                      </span>
                      <input
                        type="number"
                        min={5}
                        max={600}
                        className="h-7 sm:h-auto w-12 sm:w-20 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-1 sm:px-3 py-1 text-[11px] sm:text-sm text-center focus:outline-none focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white"
                        value={q?.timeLimitSeconds || 60}
                        onChange={(e) =>
                          updateQuestion(currentIndex, {
                            timeLimitSeconds: Number(e.target.value),
                          })
                        }
                        placeholder="60"
                        title="Time limit (seconds)"
                      />
                    </label>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <label className="flex items-center gap-1 sm:gap-2 text-[11px] sm:text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-medium whitespace-nowrap tracking-wide">
                          Marks
                        </span>
                        <input
                          type="number"
                          min={1}
                          max={1000}
                          className="h-7 sm:h-auto w-11 sm:w-16 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-1 sm:px-3 py-1 text-[11px] sm:text-sm text-center focus:outline-none focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white"
                          value={q?.maxMarks || 100}
                          onChange={(e) =>
                            updateQuestion(currentIndex, {
                              maxMarks: Number(e.target.value),
                            })
                          }
                          placeholder="100"
                          title="Max marks"
                        />
                      </label>
                      {questions.length > 1 && (
                        <button
                          onClick={() => deleteQuestion(currentIndex)}
                          className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                          title="Delete this question"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Question Content */}
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                {/* Sticky Question Text Input */}
                <div className="p-4 sm:p-6 pb-3 sm:pb-4 flex-shrink-0 bg-white dark:bg-gray-800">
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Question Text
                  </label>
                  <input
                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:outline-none focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white transition-all placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="Enter your question here..."
                    value={q?.text || ""}
                    onChange={(e) =>
                      updateQuestion(currentIndex, { text: e.target.value })
                    }
                  />
                </div>

                {/* Sticky Answer Options Label */}
                <div className="px-4 sm:px-6 pb-3 flex-shrink-0 bg-white dark:bg-gray-800">
                  <label className="block text-sm font-medium text-gray-900 dark:text-white">
                    Answer Options
                  </label>
                </div>

                {/* Scrollable Options List */}
                <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 overscroll-contain">
                  <div className="space-y-3">
                    {(q?.options || []).map((o, oi) => (
                      <div
                        key={o.key}
                        className={`flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-colors ${
                          o.isCorrect
                            ? "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700"
                            : "bg-white dark:bg-gray-700"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`correct-${currentIndex}`}
                          checked={!!o.isCorrect}
                          onChange={() => markCorrect(currentIndex, o.key)}
                          title="Mark as correct answer"
                          className="w-4 h-4 text-green-600 focus:ring-green-500 focus:ring-2 cursor-pointer"
                        />
                        <input
                          className="flex-1 border-none bg-transparent focus:outline-none text-sm sm:text-base text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                          placeholder={`Enter Option ${o.key}`}
                          value={o.text}
                          onChange={(e) =>
                            updateOption(currentIndex, oi, e.target.value)
                          }
                        />
                        {(q?.options || []).length > 2 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteOption(currentIndex, oi);
                            }}
                            className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                            title="Delete this option"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}

                    {/* Add option button */}
                    <button
                      className="flex items-center gap-2 p-3 border border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-colors text-sm text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 w-full"
                      onClick={() => addOption(currentIndex)}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      Add option
                    </button>
                  </div>
                </div>

                {/* Sticky Action Buttons at Bottom */}
                <div className="p-4 lg:p-6 border-t border-gray-100 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800">
                  <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:justify-end sm:gap-3">
                    <div className="relative group col-span-2 sm:col-span-1 min-w-[140px] sm:mr-auto">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 opacity-60 blur group-hover:opacity-100 animate-pulse transition duration-500"></div>
                      <button
                        className="relative w-full h-9 sm:h-auto border border-gray-900 dark:border-gray-100 px-2.5 sm:px-3 py-2 text-[11px] sm:text-sm bg-black dark:bg-white text-white dark:text-black hover:bg-gray-900 dark:hover:bg-gray-100 transition-all font-medium flex items-center justify-center gap-1.5"
                        onClick={() => setShowAiModal(true)}
                        title="Generate with AI"
                      >
                        <svg
                          className="w-4 h-4 shrink-0 text-pink-500 dark:text-purple-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                        <span>Generate with AI</span>
                      </button>
                    </div>
                    <button
                      className="w-full sm:w-auto h-9 sm:h-auto px-2.5 sm:px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-[11px] sm:text-sm font-medium"
                      onClick={addQuestion}
                      disabled={questions.length >= 100}
                      title="Add question"
                    >
                      <span className="sm:hidden">
                        Add ({questions.length}/100)
                      </span>
                      <span className="hidden sm:inline">
                        Add Question ({questions.length}/100)
                      </span>
                    </button>
                    <button
                      className="w-full sm:w-auto h-9 sm:h-auto px-2.5 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-[11px] sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={saveCurrent}
                      disabled={saving || !q?.options?.some((o) => o.isCorrect)}
                      title={
                        !q?.options?.some((o) => o.isCorrect)
                          ? "Please select a correct answer before saving"
                          : ""
                      }
                    >
                      <span className="sm:hidden">
                        {saving ? "Saving..." : "Save"}
                      </span>
                      <span className="hidden sm:inline">
                        {saving ? "Saving..." : "Save this question"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
        <div className="mx-3 mb-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
          <button
            onClick={() => setIsQuestionPanelOpen((prev) => !prev)}
            className="w-full px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between"
          >
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Question Panel
            </span>
            <ChevronUp
              className={`w-4 h-4 text-gray-600 dark:text-gray-300 transition-transform duration-200 ${
                isQuestionPanelOpen ? "rotate-180" : "rotate-0"
              }`}
            />
          </button>

          {isQuestionPanelOpen && (
            <div className="max-h-[42vh] overflow-y-auto p-4">
              <div className="grid grid-cols-3 gap-2 mb-3">
                {questions.map((_, i) => (
                  <button
                    key={i}
                    className={`border-2 p-2 text-sm transition-all ${
                      i === currentIndex
                        ? modifiedQuestions.has(i)
                          ? "bg-black dark:bg-white text-white dark:text-black border-orange-400 dark:border-orange-500 shadow-sm"
                          : "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-sm"
                        : modifiedQuestions.has(i)
                          ? "bg-white dark:bg-gray-700 border-orange-400 dark:border-orange-500 text-gray-900 dark:text-gray-100 hover:border-orange-500"
                          : "bg-white dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-sm border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                    }`}
                    onClick={() => {
                      setCurrentIndex(i);
                      setIsQuestionPanelOpen(false);
                    }}
                    title={`Go to question ${i + 1}${modifiedQuestions.has(i) ? " (unsaved changes)" : ""}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                className="w-full border border-dashed border-gray-300 dark:border-gray-600 p-3 text-sm bg-white dark:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all text-gray-600 dark:text-gray-300 flex items-center justify-center gap-2 mb-2"
                onClick={addQuestion}
                disabled={questions.length >= 100}
                title="Add question"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Question
              </button>
              <button
                className="w-full border border-gray-200 dark:border-gray-700 p-3 text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all font-medium flex items-center justify-center"
                onClick={() => {
                  setJsonInput(JSON.stringify(questions, null, 2));
                  setIsQuestionPanelOpen(false);
                  setShowJsonModal(true);
                }}
                title="Add questions with JSON"
              >
                Add questions with JSON
              </button>
            </div>
          )}
        </div>
      </div>

      {showJsonModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-4xl p-6 shadow-xl flex flex-col gap-4 max-h-[90vh]">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-light text-gray-900 dark:text-gray-100">
                Add Questions with JSON
              </h2>
              <button
                onClick={() => setShowJsonModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="flex gap-2">
              <button
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-sm font-medium bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => {
                  const prompt = `Here is the current set of questions in my quiz format. 
Please generate new questions and add them to this array, maintaining the exact same JSON structure.

Required structure for each question:
- "text": The question text
- "options": An array of at least 2 options, where each option has a "key", "text", and "isCorrect" boolean (ensure exactly one option is true)
- "timeLimitSeconds": Number (e.g. 60)
- "maxMarks": Number (e.g. 100)

Make sure to return ONLY the final combined JSON array, with the previous questions included along with the new ones.

Current questions:
${JSON.stringify(questions, null, 2)}


Give me the final combined JSON array with the new questions added:`;
                  navigator.clipboard.writeText(prompt);
                  alert(
                    "Prompt with current questions copied to clipboard! Paste it to an LLM.",
                  );
                }}
              >
                Copy format for LLMs
              </button>
            </div>

            <textarea
              className="flex-1 w-full min-h-[400px] p-4 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-black dark:text-white font-mono text-sm resize-none focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-gray-500 overflow-auto"
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="Paste the array of questions JSON here..."
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                className="px-6 py-2 text-sm border border-gray-300 dark:border-gray-700 font-medium text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                onClick={() => setShowJsonModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-6 py-2 text-sm bg-black dark:bg-white text-white dark:text-black font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                onClick={() => {
                  try {
                    const parsed = JSON.parse(jsonInput);
                    if (!Array.isArray(parsed))
                      throw new Error(
                        "The submitted JSON must be an array of question objects.",
                      );
                    if (parsed.length > 0) {
                      interface ParsedOption {
                        key?: string;
                        text?: string;
                        isCorrect?: boolean;
                      }
                      interface ParsedQuestion {
                        text?: string;
                        timeLimitSeconds?: number;
                        maxMarks?: number;
                        options?: ParsedOption[];
                      }
                      // Basic structure validation
                      const validated = parsed.map((pq: ParsedQuestion) => ({
                        text: pq.text || "",
                        timeLimitSeconds: Number(pq.timeLimitSeconds) || 60,
                        maxMarks: Number(pq.maxMarks) || 100,
                        options: Array.isArray(pq.options)
                          ? pq.options.map((o: ParsedOption, oIdx: number) => ({
                              key: o.key || String(oIdx + 1),
                              text: o.text || "",
                              isCorrect: !!o.isCorrect,
                            }))
                          : [{ key: "1", text: "", isCorrect: true }],
                      }));
                      setQuestions(validated);
                      setCurrentIndex(0);
                      setShowJsonModal(false);
                      setModifiedQuestions(
                        new Set(validated.map((_: unknown, i: number) => i)),
                      );
                    } else {
                      alert("Question array cannot be empty.");
                    }
                  } catch (err: unknown) {
                    alert(
                      "Failed to parse JSON: " +
                        (err instanceof Error ? err.message : String(err)),
                    );
                  }
                }}
              >
                Replace & Apply JSON
              </button>
            </div>
          </div>
        </div>
      )}

      {showAiModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-6xl p-6 sm:p-10 shadow-xl flex flex-col gap-6 max-h-[90vh]">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-light text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-gray-700 dark:text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Generate Quiz with AI
              </h2>
              <button
                onClick={() => setShowAiModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {aiError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 p-3 flex items-start gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                <svg
                  className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800 dark:text-red-300">
                    {aiError}
                  </p>
                </div>
                <button
                  onClick={() => setAiError(null)}
                  className="text-red-400 hover:text-red-600 dark:hover:text-red-200 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            )}

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Prompt / Topic
                  </label>
                  <span className="text-[10px] sm:text-xs font-medium px-0 sm:px-2 py-1 bg-transparent sm:bg-gray-100 sm:dark:bg-gray-800 border-none sm:border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                    {localAiCount}/100 questions today
                  </span>
                </div>
                <textarea
                  ref={aiPromptRef}
                  className="w-full p-4 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-black dark:text-white text-base resize-none focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-gray-500 overflow-y-auto transition-all duration-200"
                  rows={generatedQuestions.length > 0 ? 1 : 10}
                  style={{
                    maxHeight:
                      generatedQuestions.length > 0
                        ? "calc(1.5em * 4 + 32px)"
                        : "none",
                  }}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="E.g., Generate a 5 question quiz about history of space exploration suitable for high school students."
                  disabled={isGenerating}
                />
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-4 items-end">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Questions count
                  </label>
                  <select
                    className="p-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-black dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-gray-500 w-full"
                    value={aiNumQuestions}
                    onChange={(e) => setAiNumQuestions(e.target.value)}
                    disabled={isGenerating}
                  >
                    {[1, 5, 10, 15, 20].map((num) => (
                      <option key={num} value={num}>
                        {num} questions
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Options per question
                  </label>
                  <select
                    className="p-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-black dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-gray-500 w-full"
                    value={aiNumOptions}
                    onChange={(e) => setAiNumOptions(e.target.value)}
                    disabled={isGenerating}
                  >
                    {[2, 3, 4, 5, 6, 7, 8].map((num) => (
                      <option key={num} value={num}>
                        {num} options
                      </option>
                    ))}
                  </select>
                </div>

                {generatedQuestions.length > 0 ? (
                  <>
                    <button
                      className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium h-[38px] disabled:opacity-50"
                      onClick={handleAddAllAiQuestions}
                      disabled={
                        addedQuestions.size === generatedQuestions.length
                      }
                    >
                      {addedQuestions.size === generatedQuestions.length
                        ? "All Added"
                        : "Add All"}
                    </button>
                    <button
                      className="w-full px-6 py-2 text-sm bg-black dark:bg-white text-white dark:text-black font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 h-[38px]"
                      onClick={handleGenerateAI}
                      disabled={isGenerating || !aiPrompt.trim()}
                    >
                      {isGenerating ? "Generating..." : "Generate"}
                    </button>
                  </>
                ) : (
                  <button
                    className="w-full col-span-2 px-6 py-2 text-sm bg-black dark:bg-white text-white dark:text-black font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 h-[38px]"
                    onClick={handleGenerateAI}
                    disabled={isGenerating || !aiPrompt.trim()}
                  >
                    {isGenerating ? "Generating..." : "Generate"}
                  </button>
                )}
              </div>
            </div>

            {/* Generated results area */}
            {generatedQuestions.length > 0 && (
              <div className="flex-1 mt-2 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto py-2 sm:py-4 px-0 sm:px-4 space-y-4">
                  {generatedQuestions.map((gq, idx) => {
                    const isAdded = addedQuestions.has(idx);
                    return (
                      <div
                        key={idx}
                        className="border border-gray-200 dark:border-gray-700 p-3 sm:p-4 bg-gray-50 dark:bg-gray-800/50"
                      >
                        <div className="flex justify-between gap-4 items-start mb-3">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                            {idx + 1}. {gq.text}
                          </h4>
                          {isAdded ? (
                            <button
                              className="px-3 py-1.5 text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 cursor-default"
                              disabled
                            >
                              Added
                            </button>
                          ) : (
                            <button
                              className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                              onClick={() => handleAddAiQuestion(idx)}
                            >
                              + Add
                            </button>
                          )}
                        </div>
                        <ul className="space-y-2">
                          {gq.options.map((opt, oIdx) => (
                            <li
                              key={oIdx}
                              className={`text-xs p-2 border ${opt.isCorrect ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300" : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"}`}
                            >
                              {opt.isCorrect && (
                                <span className="font-bold mr-1">✓</span>
                              )}
                              {opt.text}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CreateQuizPage() {
  return (
    <Suspense
      fallback={
        <ZeroGravityLoading
          title="Loading Quiz Creator"
          subtitle="Preparing your quiz..."
          showNavigation={false}
        />
      }
    >
      <CreateQuizContent />
    </Suspense>
  );
}
