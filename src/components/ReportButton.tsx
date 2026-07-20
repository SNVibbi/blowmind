import { useRef, useState } from "react";
import { useAuthContext } from "../context/AuthContext";
import { useFocusTrap } from "../hooks/useFocusTrap";
import {
  reportContent,
  REPORT_REASONS,
  REPORT_REASON_LABELS,
  ReportReason,
  ReportTargetType,
} from "../lib/moderationService";
import { getErrorMessage } from "../lib/errors";
import { toast } from "react-toastify";

interface ReportButtonProps {
  targetType: ReportTargetType;
  targetId: string;
  postId: string;
  className?: string;
}

export default function ReportButton({
  targetType,
  targetId,
  postId,
  className,
}: ReportButtonProps) {
  const { user } = useAuthContext();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("spam");
  const [details, setDetails] = useState("");
  const [isPending, setIsPending] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useFocusTrap(dialogRef, open, () => setOpen(false));

  const handleOpen = () => {
    if (!user) {
      toast.info("Log in to report content.");
      return;
    }
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!user || isPending) return;
    setIsPending(true);
    try {
      await reportContent({ reporter: user, targetType, targetId, postId, reason, details });
      toast.success("Thanks — our team will review this.");
      setOpen(false);
      setDetails("");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={className ?? "text-gray-500 hover:text-red-600"}
        aria-label={`Report this ${targetType}`}
      >
        <i className="fas fa-flag" aria-hidden="true"></i>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-title"
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800"
          >
            <h2
              id="report-title"
              className="mb-4 text-lg font-bold text-gray-900 dark:text-gray-100"
            >
              Report this {targetType}
            </h2>

            <fieldset className="mb-4">
              <legend className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                Why are you reporting this?
              </legend>
              <div className="space-y-2">
                {REPORT_REASONS.map((r) => (
                  <label key={r} className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
                    <input
                      type="radio"
                      name="report-reason"
                      value={r}
                      checked={reason === r}
                      onChange={() => setReason(r)}
                    />
                    {REPORT_REASON_LABELS[r]}
                  </label>
                ))}
              </div>
            </fieldset>

            <label htmlFor="report-details" className="sr-only">
              Additional details
            </label>
            <textarea
              id="report-details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              maxLength={1000}
              placeholder="Add any details (optional)"
              className="mb-4 w-full rounded-md border border-gray-300 p-2 text-gray-800 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
              rows={3}
            />

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-gray-800 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isPending ? "Submitting…" : "Submit report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
