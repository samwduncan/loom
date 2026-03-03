import React, { useState } from 'react';
import type { Question } from '../../../types/types';

interface QuestionAnswerContentProps {
  questions: Question[];
  answers: Record<string, string>;
  className?: string;
}

// Exception to the stateless ContentRenderer pattern: multi-question navigation requires local state.
export const QuestionAnswerContent: React.FC<QuestionAnswerContentProps> = ({
  questions,
  answers,
  className = '',
}) => {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  if (!questions || questions.length === 0) {
    return null;
  }

  const hasAnyAnswer = Object.keys(answers || {}).length > 0;
  const total = questions.length;

  return (
    <div className={`space-y-2 ${className}`}>
      {questions.map((q, idx) => {
        const answer = answers?.[q.question];
        const answerLabels = answer ? answer.split(', ') : [];
        const skipped = !answer;
        const isExpanded = expandedIdx === idx;

        return (
          <div
            key={idx}
            className="rounded-lg border border-border/10 bg-surface-raised/30 overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setExpandedIdx(isExpanded ? null : idx)}
              className="w-full text-left px-3 py-2 flex items-start gap-2.5 hover:bg-surface-elevated/50 transition-colors"
            >
              <div className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${
                answerLabels.length > 0
                  ? 'bg-status-info/15'
                  : 'bg-surface-elevated'
              }`}>
                {answerLabels.length > 0 ? (
                  <svg className="w-2.5 h-2.5 text-status-info" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-muted" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {q.header && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider bg-status-info/15 text-status-info border border-status-info/20">
                      {q.header}
                    </span>
                  )}
                  {total > 1 && (
                    <span className="text-[10px] tabular-nums text-muted-foreground">
                      {idx + 1}/{total}
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 leading-snug">
                  {q.question}
                </div>

                {!isExpanded && answerLabels.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {answerLabels.map((lbl) => {
                      const isCustom = !q.options.some(o => o.label === lbl);
                      return (
                        <span
                          key={lbl}
                          className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-md bg-status-info/15 text-status-info font-medium"
                        >
                          {lbl}
                          {isCustom && (
                            <span className="text-[9px] text-status-info/70 font-normal">(custom)</span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                )}

                {!isExpanded && skipped && hasAnyAnswer && (
                  <span className="inline-block mt-1 text-[10px] text-muted-foreground italic">
                    Skipped
                  </span>
                )}
              </div>

              <svg
                className={`w-3.5 h-3.5 mt-0.5 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${
                  isExpanded ? 'rotate-180' : ''
                }`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isExpanded && (
              <div className="px-3 pb-2.5 pt-0.5 border-t border-border/10">
                <div className="space-y-1 ml-6.5">
                  {q.options.map((opt) => {
                    const wasSelected = answerLabels.includes(opt.label);
                    return (
                      <div
                        key={opt.label}
                        className={`flex items-start gap-2 px-2.5 py-1.5 rounded-lg text-[12px] ${
                          wasSelected
                            ? 'bg-status-info/10 border border-status-info/20'
                            : 'text-muted-foreground'
                        }`}
                      >
                        <div className={`mt-0.5 flex-shrink-0 w-3.5 h-3.5 ${q.multiSelect ? 'rounded-[3px]' : 'rounded-full'} border-[1.5px] flex items-center justify-center ${
                          wasSelected
                            ? 'border-status-info bg-status-info'
                            : 'border-border/20'
                        }`}>
                          {wasSelected && (
                            <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className={wasSelected ? 'text-foreground font-medium' : ''}>
                            {opt.label}
                          </span>
                          {opt.description && (
                            <span className={`block text-[11px] mt-0.5 ${
                              wasSelected ? 'text-status-info/70' : 'text-muted-foreground'
                            }`}>
                              {opt.description}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {answerLabels.filter(lbl => !q.options.some(o => o.label === lbl)).map(lbl => (
                    <div
                      key={lbl}
                      className="flex items-start gap-2 px-2.5 py-1.5 rounded-lg text-[12px] bg-status-info/10 border border-status-info/20"
                    >
                      <div className={`mt-0.5 flex-shrink-0 w-3.5 h-3.5 ${q.multiSelect ? 'rounded-[3px]' : 'rounded-full'} border-[1.5px] border-status-info bg-status-info flex items-center justify-center`}>
                        <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-foreground font-medium">{lbl}</span>
                        <span className="text-[10px] text-status-info ml-1">(custom)</span>
                      </div>
                    </div>
                  ))}

                  {skipped && hasAnyAnswer && (
                    <div className="text-[11px] text-muted-foreground italic px-2.5 py-1">
                      No answer provided
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {!hasAnyAnswer && total === 1 && (
        <div className="text-[11px] text-muted-foreground italic">
          Skipped
        </div>
      )}
    </div>
  );
};
