"use client";
// Suggested questions that send for real through the connected widget
// (the widget's `otw:send` host event: it opens the chat and sends the text
// as the visitor). Without a connected widget they render as plain text.
export function AskSupport({
  questions,
  publicId,
}: {
  questions: readonly string[];
  publicId: string | null;
}) {
  return (
    <div className="ask">
      <span className="ask-label">Ask support</span>
      {questions.map((question) =>
        publicId ? (
          <button
            key={question}
            type="button"
            className="ask-chip"
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent("otw:send", {
                  detail: { publicId, message: question, animate: true },
                }),
              )
            }
          >
            {question}
            <span aria-hidden="true">→</span>
          </button>
        ) : (
          <span key={question} className="ask-chip ask-chip--static">
            {question}
          </span>
        ),
      )}
    </div>
  );
}
