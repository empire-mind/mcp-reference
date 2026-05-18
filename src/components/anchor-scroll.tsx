"use client";

import { useEffect } from "react";

function scrollToHash(hash: string) {
  if (!hash || hash === "#") {
    return;
  }

  const targetId = decodeURIComponent(hash.slice(1));
  const target = document.getElementById(targetId);

  if (!target) {
    return;
  }

  const scrollContainer = document.querySelector<HTMLElement>("[data-scroll-container]");
  const previousScrollBehavior = document.documentElement.style.scrollBehavior;

  document.documentElement.style.scrollBehavior = "auto";

  if (scrollContainer) {
    if (!scrollContainer.contains(target)) {
      scrollContainer.scrollTo({ left: 0, top: 0, behavior: "auto" });
    } else {
      const targetTop =
        target.getBoundingClientRect().top -
        scrollContainer.getBoundingClientRect().top +
        scrollContainer.scrollTop -
        32;

      scrollContainer.scrollTo({ left: 0, top: Math.max(targetTop, 0), behavior: "auto" });
    }
  } else {
    const targetTop = target.getBoundingClientRect().top + window.scrollY - 32;

    window.scrollTo({ left: 0, top: Math.max(targetTop, 0), behavior: "auto" });
    document.scrollingElement?.scrollTo({ left: 0, top: Math.max(targetTop, 0), behavior: "auto" });
  }

  requestAnimationFrame(() => {
    document.documentElement.style.scrollBehavior = previousScrollBehavior;
  });
}

export function AnchorScroll() {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const link = target.closest<HTMLAnchorElement>('a[href^="#"]');

      if (!link) {
        return;
      }

      const hash = link.getAttribute("href");

      if (!hash || hash === "#") {
        return;
      }

      event.preventDefault();
      history.pushState(null, "", hash);
      scrollToHash(hash);
    };

    const handleHashChange = () => {
      scrollToHash(window.location.hash);
    };

    document.addEventListener("click", handleClick);
    window.addEventListener("hashchange", handleHashChange);
    handleHashChange();

    return () => {
      document.removeEventListener("click", handleClick);
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  return null;
}
