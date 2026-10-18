"use client";

import {
  Fragment,
  cloneElement,
  isValidElement,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ElementType, HTMLAttributes, ReactNode } from "react";

const DEFAULT_SPEED = 26;

function splitGraphemes(value: string) {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    return Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(value), ({ segment }) => segment);
  }

  return Array.from(value);
}

function getTextContent(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(getTextContent).join("");
  if (!isValidElement(node)) return "";
  if (node.type === "br") return "\n";

  return getTextContent(node.props.children as ReactNode);
}

function revealText(node: ReactNode, remaining: { value: number }): ReactNode {
  if (typeof node === "string" || typeof node === "number") {
    const characters = splitGraphemes(String(node));
    const revealed = characters.slice(0, remaining.value).join("");
    remaining.value = Math.max(0, remaining.value - characters.length);
    return revealed;
  }

  if (Array.isArray(node)) {
    return node.map((child, index) => (
      <Fragment key={index}>{revealText(child, remaining)}</Fragment>
    ));
  }
  if (!isValidElement(node) || node.type === "br") return node;

  const children = node.props.children as ReactNode | undefined;
  if (children === undefined) return node;

  return cloneElement(node, undefined, revealText(children, remaining));
}

export function getTypewriterDuration(text: string, speed = DEFAULT_SPEED) {
  return splitGraphemes(text).length * speed;
}

type TypewriterProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  children: ReactNode;
  /** Milliseconds per grapheme. Defaults to 26 ms. */
  speed?: number;
  /** Milliseconds to wait before this text starts. */
  delay?: number;
};

/**
 * Reveals rich text without changing its final layout or repeatedly announcing
 * individual characters to assistive technology.
 */
export function Typewriter({
  as: Component = "span",
  children,
  speed = DEFAULT_SPEED,
  delay = 0,
  className,
  ...props
}: TypewriterProps) {
  const fullText = useMemo(() => getTextContent(children), [children]);
  const graphemes = useMemo(() => splitGraphemes(fullText), [fullText]);
  // Server-render the complete sentence as a resilient, readable fallback.
  // The layout effect resets it before the browser paints the animation.
  const [visibleCount, setVisibleCount] = useState(() => graphemes.length);
  const settingsRef = useRef({ speed, delay });
  const [reducedMotion, setReducedMotion] = useState(false);

  settingsRef.current = { speed, delay };

  useLayoutEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  useLayoutEffect(() => {
    if (reducedMotion) {
      setVisibleCount(graphemes.length);
      return;
    }

    setVisibleCount(0);
    let intervalId: number | undefined;
    const start = window.setTimeout(() => {
      if (settingsRef.current.speed <= 0) {
        setVisibleCount(graphemes.length);
        return;
      }

      setVisibleCount(Math.min(1, graphemes.length));
      intervalId = window.setInterval(() => {
        setVisibleCount((current) => {
          const next = Math.min(current + 1, graphemes.length);
          if (next === graphemes.length && intervalId !== undefined) window.clearInterval(intervalId);
          return next;
        });
      }, settingsRef.current.speed);
    }, Math.max(0, settingsRef.current.delay));

    return () => {
      window.clearTimeout(start);
      if (intervalId !== undefined) window.clearInterval(intervalId);
    };
  }, [fullText, graphemes.length, reducedMotion]);

  const visibleContent = useMemo(
    () => revealText(children, { value: reducedMotion ? graphemes.length : visibleCount }),
    [children, graphemes.length, reducedMotion, visibleCount],
  );

  return (
    <Component className={["typewriter", className].filter(Boolean).join(" ")} {...props}>
      <span className="typewriter__visual" aria-hidden="true">{visibleContent}</span>
      <span className="typewriter__sizer" aria-hidden="true">{children}</span>
      <span className="typewriter__sr-only">{fullText}</span>
    </Component>
  );
}
