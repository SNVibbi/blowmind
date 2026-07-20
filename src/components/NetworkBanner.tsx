import { useNetworkStatus } from "../hooks/useNetworkStatus";

/**
 * Fixed banner announcing connection loss and recovery. Uses role=status
 * with aria-live so screen readers hear state changes without stealing
 * focus.
 */
export default function NetworkBanner() {
  const { online, justReconnected } = useNetworkStatus();

  if (online && !justReconnected) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-0 inset-x-0 z-[100] px-4 py-2 text-center text-sm font-medium text-white ${
        online ? "bg-green-600" : "bg-gray-800"
      }`}
    >
      {online ? (
        <span>
          <i className="fas fa-wifi mr-2" aria-hidden="true"></i>
          Back online.
        </span>
      ) : (
        <span>
          <i className="fas fa-plug mr-2" aria-hidden="true"></i>
          You&apos;re offline. Some actions will resume when your connection
          returns.
        </span>
      )}
    </div>
  );
}
