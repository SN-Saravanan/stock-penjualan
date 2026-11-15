import { createPortal } from "react-dom";
import { useEffect, useId, useLayoutEffect, useRef } from "react";

let activeModals = 0;
let savedOverflow = "";
let savedHtmlOverflow = "";

function ModalPortal({ children, onClose, label = "Dialog" }) {
  const rootRef = useRef(null);
  const closeRef = useRef(onClose);
  const titleId = useId();
  useLayoutEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const previousFocus = document.activeElement;
    if (activeModals++ === 0) {
      savedOverflow = document.body.style.overflow;
      savedHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    }
    const title = root.querySelector("h2, h3");
    if (title) {
      title.id ||= titleId;
      root.setAttribute("aria-labelledby", title.id);
      root.removeAttribute("aria-label");
    }
    const focusable = () => [...root.querySelectorAll(
      'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
    )].filter((element) => element.getClientRects().length &&
      !element.classList.contains("inset-0"));
    (focusable()[0] || root).focus({ preventScroll: true });
    const handleKey = (event) => {
      const modals = document.querySelectorAll(".modal-root");
      if (modals[modals.length - 1] !== root) return;
      if (event.key === "Escape" && closeRef.current) {
        event.preventDefault();
        event.stopPropagation();
        closeRef.current();
      }
      if (event.key !== "Tab") return;
      const elements = focusable();
      const first = elements[0] || root;
      const last = elements.at(-1) || root;
      if (!root.contains(document.activeElement) ||
          (event.shiftKey && (document.activeElement === first || document.activeElement === root)) ||
          (!event.shiftKey && (document.activeElement === last || document.activeElement === root))) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    };
    document.addEventListener("keydown", handleKey, true);
    return () => {
      document.removeEventListener("keydown", handleKey, true);
      if (--activeModals === 0) {
        document.body.style.overflow = savedOverflow;
        document.documentElement.style.overflow = savedHtmlOverflow;
      }
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [titleId]);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div ref={rootRef} role="dialog" aria-modal="true" aria-label={label}
      tabIndex={-1} className="modal-root">{children}</div>, document.body,
  );
}

export default ModalPortal;
