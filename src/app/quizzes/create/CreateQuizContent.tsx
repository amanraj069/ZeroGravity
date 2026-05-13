"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createQuiz,
  publishQuiz,
  QuizQuestion,
  updateDraft,
  getQuiz,
} from "@/services/quizzesService";
import { useAuth } from "@/contexts/AuthContext";
import ZeroGravityLoading from "@/components/ZeroGravityLoading";

const emptyQuestion = (): QuizQuestion => ({
  text: "",
  options: [
    { key: "A", text: "" },
    { key: "B", text: "" },
  ],
  timeLimitSeconds: 60,
  maxMarks: 100,
});

interface CreateQuizContentProps {
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function CreateQuizContent({
  searchParams,
}: CreateQuizContentProps) {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([emptyQuestion()]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [quizId, setQuizId] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [jsonInput, setJsonInput] = useState("");

  const isPro = user?.subscription === "pro";

  // Load existing quiz or prefill from /createQuiz
  useEffect(() => {
    const existingQuizId = searchParams?.quizId as string;
    const isEdit = searchParams?.edit === "true";
    const initTitle = searchParams?.title as string;
    const initDesc = searchParams?.desc as string;

    if (existingQuizId && isEdit && !isLoading && user) {
      // Load existing quiz data
      setLoadingExisting(true);
      setQuizId(existingQuizId);
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
          }
        })
        .catch((error) => {
          console.error("Error loading quiz:", error);
        })
        .finally(() => {
          setLoadingExisting(false);
        });
    } else {
      // Prefill from /createQuiz
      if (initTitle) setTitle(initTitle);
      if (initDesc) setDescription(initDesc);
    }
  }, [searchParams, user, isLoading]);

  const addQuestion = () => {
    if (questions.length >= 100) return;
    setQuestions((q) => [...q, emptyQuestion()]);
    setCurrentIndex(questions.length);
  };

  const updateQuestion = (idx: number, updates: Partial<QuizQuestion>) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, ...updates } : q)),
    );
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
  };

  const addOption = (qIdx: number) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const nextKey = String.fromCharCode(65 + q.options.length);
        return { ...q, options: [...q.options, { key: nextKey, text: "" }] };
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

    const hasCorrectOption =
      q.options &&
      q.options.some((o) => o.isCorrect && o.text && o.text.trim() !== "");
    if (!hasCorrectOption) {
      return {
        isValid: false,
        message: "Please add at least one correct answer option",
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

      if (!quizId) {
        const created = await createQuiz({
          title: title || "Untitled Quiz",
          description,
          questions,
        });
        if (!created?.success)
          throw new Error(created?.message || "Create failed");
        setQuizId(created.quiz.quizId);
        return;
      }
      const result = await updateDraft(quizId, {
        title,
        description,
        questions,
      });
      if (!result?.success) throw new Error(result?.message || "Save failed");
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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Full-width header matching website design theme */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-light text-black mb-2">
                {title || "Untitled Quiz"}
              </h1>
              {description && (
                <p className="text-gray-600 max-w-2xl">{description}</p>
              )}
            </div>
            <div className="flex items-center gap-3 sm:ml-4">
              <button
                className="px-4 py-2 border border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors text-sm font-medium rounded-lg"
                onClick={saveCurrent}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Progress"}
              </button>
              <button
                className="px-6 py-2 bg-black text-white hover:bg-gray-800 transition-colors text-sm font-medium rounded-lg"
                onClick={onPublish}
                disabled={publishing || !title || questions.length === 0}
              >
                {publishing ? "Publishing..." : "Publish & Host"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 py-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 px-6">
          <aside className="md:col-span-3 lg:col-span-3">
            <div className="bg-white shadow-sm p-6 sticky top-24 border border-gray-100 rounded-xl">
              <div className="mb-4">
                <span className="text-sm font-medium text-gray-900">
                  Questions
                </span>
              </div>
              <div className="grid grid-cols-8 sm:grid-cols-6 md:grid-cols-4 lg:grid-cols-3 gap-2">
                {questions.map((_, i) => (
                  <button
                    key={i}
                    className={`border p-2 text-sm transition-all rounded-lg ${
                      i === currentIndex
                        ? "bg-black text-white border-black shadow-sm"
                        : "bg-white hover:border-gray-300 hover:shadow-sm border-gray-200"
                    }`}
                    onClick={() => setCurrentIndex(i)}
                    title={`Go to question ${i + 1}`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  className="border border-gray-200 p-2 text-sm bg-white hover:border-gray-300 hover:shadow-sm transition-all rounded-lg"
                  onClick={addQuestion}
                  disabled={questions.length >= 100}
                  title="Add question"
                >
                  +
                </button>
              </div>
              <div className="mt-4">
                <button
                  className="w-full border border-gray-200 dark:border-gray-700 p-2 text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all font-medium rounded-lg"
                  onClick={() => {
                    setJsonInput(JSON.stringify(questions, null, 2));
                    setShowJsonModal(true);
                  }}
                >
                  Add questions with JSON
                </button>
              </div>
            </div>
          </aside>

          <section className="md:col-span-9 lg:col-span-9">
            <div className="bg-white shadow-sm border border-gray-100 overflow-hidden rounded-xl">
              {/* Question Header */}
              <div className="border-b border-gray-100 bg-gray-50 px-6 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-lg font-medium text-gray-900">
                        Question {currentIndex + 1}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="font-medium">Time (seconds)</span>
                      <input
                        type="number"
                        min={5}
                        max={600}
                        className="w-20 border border-gray-300 px-3 py-1.5 text-center focus:outline-none focus:border-black focus:ring-1 focus:ring-black rounded-lg"
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
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <span className="font-medium">Marks</span>
                        <input
                          type="number"
                          min={1}
                          max={1000}
                          className="w-16 border border-gray-300 px-3 py-1.5 text-center focus:outline-none focus:border-black focus:ring-1 focus:ring-black rounded-lg"
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
                          className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                          title="Delete this question"
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
                  </div>
                </div>
              </div>

              {/* Question Content */}
              <div className="p-6 space-y-6 min-h-[400px]">
                {/* Question Text Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Question Text
                  </label>
                  <input
                    className="w-full border border-gray-300 px-4 py-3 text-base focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all rounded-lg"
                    placeholder="Enter your question here..."
                    value={q?.text || ""}
                    onChange={(e) =>
                      updateQuestion(currentIndex, { text: e.target.value })
                    }
                  />
                </div>

                {/* Answer Options */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">
                    Answer Options
                  </label>
                  <div className="space-y-3">
                    {(q?.options || []).map((o, oi) => (
                      <div
                        key={o.key}
                        className={`flex items-center gap-3 p-3 border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer rounded-lg ${
                          o.isCorrect ? "bg-green-50 border-green-200" : ""
                        }`}
                        onClick={() => markCorrect(currentIndex, o.key)}
                        title="Click to mark as correct answer"
                      >
                        <input
                          type="radio"
                          name={`correct-${currentIndex}`}
                          checked={!!o.isCorrect}
                          onChange={() => markCorrect(currentIndex, o.key)}
                          title="Mark as correct answer"
                          className="w-4 h-4 text-green-600 focus:ring-green-500 focus:ring-2 pointer-events-none"
                        />
                        <div
                          className={`w-8 h-8 flex items-center justify-center rounded-lg ${
                            o.isCorrect ? "bg-green-100" : "bg-gray-100"
                          }`}
                        >
                          <span
                            className={`text-sm font-medium ${
                              o.isCorrect ? "text-green-700" : "text-gray-700"
                            }`}
                          >
                            {o.key}
                          </span>
                        </div>
                        <input
                          className="flex-1 border-none bg-transparent focus:outline-none text-gray-900 placeholder-gray-400"
                          placeholder={`Enter option ${o.key}...`}
                          value={o.text}
                          onChange={(e) =>
                            updateOption(currentIndex, oi, e.target.value)
                          }
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-6">
                    <button
                      className="flex items-center gap-2 text-sm text-black hover:text-gray-700 transition-colors font-medium"
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
                    <div className="flex items-center gap-3">
                      <button
                        className="px-3 py-2 border border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors text-sm font-medium rounded-lg"
                        onClick={addQuestion}
                        disabled={questions.length >= 100}
                        title="Add question"
                      >
                        Add Question ({questions.length}/100)
                      </button>
                      <button
                        className="px-4 py-2 border border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
                        onClick={saveCurrent}
                        disabled={
                          saving || !q?.options?.some((o) => o.isCorrect)
                        }
                        title={
                          !q?.options?.some((o) => o.isCorrect)
                            ? "Please select a correct answer before saving"
                            : ""
                        }
                      >
                        {saving ? "Saving..." : "Save this question"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {showJsonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-4xl p-6 shadow-xl flex flex-col gap-4 max-h-[90vh] rounded-xl">
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
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-sm font-medium bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-lg"
                onClick={() => {
                  const format = [
                    {
                      text: "Sample Question?",
                      options: [
                        { key: "A", text: "Correct Option", isCorrect: true },
                        {
                          key: "B",
                          text: "Incorrect Option 1",
                          isCorrect: false,
                        },
                        {
                          key: "C",
                          text: "Incorrect Option 2",
                          isCorrect: false,
                        },
                        {
                          key: "D",
                          text: "Incorrect Option 3",
                          isCorrect: false,
                        },
                      ],
                      timeLimitSeconds: 60,
                      maxMarks: 100,
                    },
                  ];
                  navigator.clipboard.writeText(
                    JSON.stringify(format, null, 2),
                  );
                  alert(
                    "Question structure copied to clipboard! You can ask an LLM to generate questions in this JSON format.",
                  );
                }}
              >
                Copy format for LLMs
              </button>
            </div>

            <textarea
              className="flex-1 w-full min-h-[400px] p-4 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-black dark:text-white font-mono text-sm resize-none focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-gray-500 overflow-auto rounded-lg"
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="Paste the array of questions JSON here..."
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                className="px-6 py-2 text-sm border border-gray-300 dark:border-gray-700 font-medium text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-lg"
                onClick={() => setShowJsonModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-6 py-2 text-sm bg-black dark:bg-white text-white dark:text-black font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors rounded-lg"
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
                          ? pq.options.map((o: ParsedOption) => ({
                              key: o.key || "A",
                              text: o.text || "",
                              isCorrect: !!o.isCorrect,
                            }))
                          : [{ key: "A", text: "", isCorrect: true }],
                      }));
                      setQuestions(validated);
                      setCurrentIndex(0);
                      setShowJsonModal(false);
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
    </div>
  );
}
