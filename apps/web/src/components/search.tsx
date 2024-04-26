"use client";

import "@docsearch/css";
import { DocSearchModal, useDocSearchKeyboardEvents } from "@docsearch/react";
import { SearchIcon } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";

const props = {
  appId: "8F8XSOV9N0",
  indexName: "statistical",
  apiKey: "27bdaf580a541ad1b9158af84eba123e",
};

export function Search() {
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState<string | undefined>();

  const onOpen = useCallback(() => {
    setIsOpen(true);
  }, [setIsOpen]);

  const onClose = useCallback(() => {
    setIsOpen(false);
  }, [setIsOpen]);

  const onInput = useCallback(
    (event: KeyboardEvent) => {
      setIsOpen(true);
      setInitialQuery(event.key);
    },
    [setIsOpen, setInitialQuery],
  );

  useDocSearchKeyboardEvents({
    isOpen,
    onOpen,
    onClose,
    onInput,
    searchButtonRef,
  });

  return (
    <>
      <button
        ref={searchButtonRef}
        onClick={onOpen}
        className="flex h-10 w-48 items-center justify-between rounded-md border border-input px-3 py-2 text-sm text-muted-foreground ring-offset-background transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:w-64"
      >
        <div className="flex items-center gap-2">
          <SearchIcon className="h-4 w-4" />
          <p className="inline md:hidden">Search...</p>
          <p className="hidden md:inline">Search docs...</p>
        </div>
        <kbd className="flex items-center gap-1 rounded border bg-muted px-1.5 text-xs">
          <span className="mt-0.5 text-sm">⌘</span> K
        </kbd>
      </button>
      {isOpen &&
        createPortal(
          <DocSearchModal
            {...props}
            initialScrollY={window.scrollY}
            initialQuery={initialQuery}
            onClose={onClose}
          />,
          document.body,
        )}
    </>
  );
}
