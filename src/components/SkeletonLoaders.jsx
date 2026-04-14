/**
 * SkeletonLoaders.jsx — Shimmer loading skeletons
 * ChatListSkeleton: for the sidebar chat list
 * MessageSkeleton: for the chat message area
 */

/** Single shimmer row for the chat list */
function ChatListSkeletonRow() {
  return (
    <div className="skeleton-chat-row">
      <div className="skeleton-avatar" />
      <div className="skeleton-chat-body">
        <div className="skeleton-line skeleton-line--name" />
        <div className="skeleton-line skeleton-line--preview" />
      </div>
    </div>
  );
}

/** Full chat list skeleton (5 rows) */
export function ChatListSkeleton({ count = 6 }) {
  return (
    <div className="skeleton-list" aria-label="Loading chats…" aria-busy="true">
      {Array.from({ length: count }, (_, i) => (
        <ChatListSkeletonRow key={i} />
      ))}
    </div>
  );
}

/** Single message bubble shimmer */
function MessageSkeletonRow({ isOutgoing }) {
  return (
    <div className={`skeleton-msg-row ${isOutgoing ? "skeleton-msg-row--out" : ""}`}>
      {!isOutgoing && <div className="skeleton-msg-avatar" />}
      <div className={`skeleton-bubble ${isOutgoing ? "skeleton-bubble--out" : ""}`} />
    </div>
  );
}

/** Full message area skeleton */
export function MessageSkeleton() {
  const pattern = [false, true, false, false, true, true, false, true];
  return (
    <div className="skeleton-messages" aria-label="Loading messages…" aria-busy="true">
      {pattern.map((isOut, i) => (
        <MessageSkeletonRow key={i} isOutgoing={isOut} />
      ))}
    </div>
  );
}

export default { ChatListSkeleton, MessageSkeleton };
