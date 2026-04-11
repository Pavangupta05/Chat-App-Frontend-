import { useCallback, useEffect, useState } from "react";

/**
 * useNotifications
 * Requests Notification permission and fires browser notifications
 * when a new message arrives while the tab is not focused.
 */
function useNotifications() {
  const [permission, setPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "denied",
  );

  useEffect(() => {
    if (typeof Notification === "undefined") return;
    if (permission === "default") {
      Notification.requestPermission().then((perm) => {
        setPermission(perm);
      });
    }
  }, [permission]);

  const requestPermission = useCallback(async () => {
    if (typeof Notification === "undefined") return "denied";
    const perm = await Notification.requestPermission();
    setPermission(perm);
    return perm;
  }, []);

  /**
   * notify — show a browser notification if the tab is hidden.
   * @param {{ title: string, body: string, icon?: string }} options
   */
  const notify = useCallback(({ title, body, icon }) => {
    if (typeof Notification === "undefined") return;
    if (!document.hidden) return;               // tab is visible — skip
    if (permission !== "granted") return;

    try {
      const n = new Notification(title, { body, icon: icon ?? "/favicon.ico" });
      setTimeout(() => n.close(), 6000);
    } catch {
      // Some browsers block programmatic Notification even with permission
    }
  }, []);

  return { notify, requestPermission, permission };
}

export default useNotifications;
