"use client";

import { useState } from "react";

type QuestionType = "yesno" | "date" | "time" | "text" | "recurring";

export type StructuredQuestion = {
  id: string;
  question: string;
  type: QuestionType;
  required?: boolean;
};

type StructuredQuestionsProps = {
  questions: StructuredQuestion[];
  onSubmit: (answers: Record<string, string>) => void;
  onCancel?: () => void;
};

export function StructuredQuestions({ questions, onSubmit, onCancel }: StructuredQuestionsProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleSubmit = () => {
    // Check if all required questions are answered
    const missingRequired = questions.some(
      (q) => q.required && !answers[q.id]
    );

    if (missingRequired) {
      alert("Please answer all required questions");
      return;
    }

    onSubmit(answers);
  };

  const updateAnswer = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  return (
    <div
      className="rounded-3xl border px-6 py-5"
      style={{
        borderColor: "rgba(75,94,60,0.25)",
        background: "rgba(75,94,60,0.04)",
      }}
    >
      <div className="text-sm font-semibold mb-4" style={{ color: "rgba(17,17,17,0.92)" }}>
        Please answer the following:
      </div>

      <div className="space-y-4">
        {questions.map((q) => (
          <div key={q.id}>
            <label className="block text-sm mb-2" style={{ color: "rgba(17,17,17,0.85)" }}>
              {q.question}
              {q.required && <span style={{ color: "rgba(239,68,68,0.85)" }}> *</span>}
            </label>

            {q.type === "yesno" && (
              <select
                value={answers[q.id] || ""}
                onChange={(e) => updateAnswer(q.id, e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                style={{
                  borderColor: "rgba(0,0,0,0.10)",
                  background: "rgba(255,255,255,0.80)",
                  color: "rgba(17,17,17,0.92)",
                }}
              >
                <option value="">Select...</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            )}

            {q.type === "date" && (
              <input
                type="date"
                value={answers[q.id] || ""}
                onChange={(e) => updateAnswer(q.id, e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                style={{
                  borderColor: "rgba(0,0,0,0.10)",
                  background: "rgba(255,255,255,0.80)",
                  color: "rgba(17,17,17,0.92)",
                }}
              />
            )}

            {q.type === "time" && (
              <input
                type="time"
                value={answers[q.id] || ""}
                onChange={(e) => updateAnswer(q.id, e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                style={{
                  borderColor: "rgba(0,0,0,0.10)",
                  background: "rgba(255,255,255,0.80)",
                  color: "rgba(17,17,17,0.92)",
                }}
              />
            )}

            {q.type === "recurring" && (
              <select
                value={answers[q.id] || ""}
                onChange={(e) => updateAnswer(q.id, e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                style={{
                  borderColor: "rgba(0,0,0,0.10)",
                  background: "rgba(255,255,255,0.80)",
                  color: "rgba(17,17,17,0.92)",
                }}
              >
                <option value="">Select...</option>
                <option value="once">Once</option>
                <option value="daily">Daily</option>
                <option value="weekdays">Weekdays</option>
                <option value="custom">Custom</option>
              </select>
            )}

            {q.type === "text" && (
              <input
                type="text"
                value={answers[q.id] || ""}
                onChange={(e) => updateAnswer(q.id, e.target.value)}
                placeholder="Type your answer..."
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                style={{
                  borderColor: "rgba(0,0,0,0.10)",
                  background: "rgba(255,255,255,0.80)",
                  color: "rgba(17,17,17,0.92)",
                }}
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mt-6 pt-4" style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }}>
        {onCancel && (
          <button
            onClick={onCancel}
            className="rounded-2xl px-4 py-2 text-xs font-semibold transition border"
            style={{
              borderColor: "rgba(0,0,0,0.10)",
              background: "rgba(0,0,0,0.02)",
              color: "rgba(17,17,17,0.70)",
            }}
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSubmit}
          className="rounded-2xl px-5 py-2 text-xs font-semibold transition border"
          style={{
            borderColor: "rgba(75,94,60,0.30)",
            background: "rgba(75,94,60,0.10)",
            color: "rgba(17,17,17,0.92)",
            boxShadow: "0 0 0 1px rgba(75,94,60,0.14)",
          }}
        >
          Submit Answers
        </button>
      </div>
    </div>
  );
}
