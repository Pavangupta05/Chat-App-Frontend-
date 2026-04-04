import { useCallback, useState } from "react";
import { buildReplyPreview } from "../utils/chat";

function useReply() {
  const [replyMessage, setReplyMessageState] = useState(null);

  const setReplyMessage = useCallback((message) => {
    setReplyMessageState(buildReplyPreview(message));
  }, []);

  const clearReply = useCallback(() => {
    setReplyMessageState(null);
  }, []);

  return {
    clearReply,
    replyMessage,
    setReplyMessage,
  };
}

export default useReply;
