import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

/**
 * The login dialog is auto-opened for *returning* visitors only. A first-time
 * visitor must be able to browse without being interrupted, and that visit is
 * what marks them as "seen" for the next one.
 *
 * Fake timers keep the 1.5s auto-open delay deterministic.
 */

const HAS_VISITED_KEY = "has_visited_before";
const DISMISSED_KEY = "login_modal_dismissed";
const TOKEN_KEY = "customer_token";
const AUTO_OPEN_DELAY_MS = 1500;

function ModalStateProbe() {
  const { showLoginModal } = useAuth();
  return <span data-testid="modal-state">{showLoginModal ? "open" : "closed"}</span>;
}

function renderProvider(wrap?: (children: React.ReactNode) => React.ReactNode) {
  const tree = (
    <AuthProvider>
      <ModalStateProbe />
    </AuthProvider>
  );
  return render(wrap ? wrap(tree) : tree);
}

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("AuthProvider login dialog", () => {
  it("stays closed on a visitor's very first visit and records the visit", () => {
    const { getByTestId } = renderProvider();

    advance(AUTO_OPEN_DELAY_MS * 2);

    expect(getByTestId("modal-state").textContent).toBe("closed");
    expect(localStorage.getItem(HAS_VISITED_KEY)).toBe("true");
  });

  it("stays closed on the first visit even under StrictMode", () => {
    const { getByTestId } = renderProvider((children) => <StrictMode>{children}</StrictMode>);

    advance(AUTO_OPEN_DELAY_MS * 2);

    expect(getByTestId("modal-state").textContent).toBe("closed");
  });

  it("opens after the delay for a returning visitor who is not signed in", () => {
    localStorage.setItem(HAS_VISITED_KEY, "true");

    const { getByTestId } = renderProvider();

    expect(getByTestId("modal-state").textContent).toBe("closed");
    advance(AUTO_OPEN_DELAY_MS);

    expect(getByTestId("modal-state").textContent).toBe("open");
  });

  it("stays closed for a returning visitor who dismissed it", () => {
    localStorage.setItem(HAS_VISITED_KEY, "true");
    localStorage.setItem(DISMISSED_KEY, "true");

    const { getByTestId } = renderProvider();
    advance(AUTO_OPEN_DELAY_MS * 2);

    expect(getByTestId("modal-state").textContent).toBe("closed");
  });

  it("stays closed for a returning visitor who is already signed in", () => {
    localStorage.setItem(HAS_VISITED_KEY, "true");
    localStorage.setItem(TOKEN_KEY, "test-token");

    const { getByTestId } = renderProvider();
    advance(AUTO_OPEN_DELAY_MS * 2);

    expect(getByTestId("modal-state").textContent).toBe("closed");
  });

  it("stays closed when the provider remounts during a first-visit session", () => {
    // (store) and /account each mount their own provider; navigating between
    // them must not turn a brand-new visitor into a "returning" one.
    const first = renderProvider();
    advance(AUTO_OPEN_DELAY_MS * 2);
    first.unmount();

    const second = renderProvider();
    advance(AUTO_OPEN_DELAY_MS * 2);

    expect(second.getByTestId("modal-state").textContent).toBe("closed");
  });

  it("does not crash when storage is unavailable", () => {
    const getItem = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    try {
      const { getByTestId } = renderProvider();
      advance(AUTO_OPEN_DELAY_MS * 2);
      expect(getByTestId("modal-state").textContent).toBe("closed");
    } finally {
      getItem.mockRestore();
      setItem.mockRestore();
    }
  });
});
