"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultName: string;
  jobId: string;
};

export function SaveDialog({ open, onOpenChange, defaultName, jobId }: Props) {
  const [name, setName] = useState(defaultName);
  const href = `/api/jobs/${jobId}/download?name=${encodeURIComponent(name)}`;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay-in fixed inset-0 z-20 bg-zinc-950/80 backdrop-blur-sm" />
        <Dialog.Content
          aria-describedby={undefined}
          className="dialog-content-in fixed left-1/2 top-1/2 z-20 w-[calc(100%-3rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl bg-zinc-900 p-5"
        >
          <Dialog.Title className="text-sm text-zinc-200">Save as</Dialog.Title>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim()) return;
              window.location.assign(href);
              onOpenChange(false);
            }}
          >
            <div className="mt-4 flex items-center gap-2">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={(e) => e.target.select()}
                className="min-w-0 flex-1 rounded-lg bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-200 outline-none ring-1 ring-transparent transition focus:ring-zinc-700"
              />
              <span className="font-mono text-xs text-zinc-600">.mp4</span>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-lg px-3 py-2 text-xs text-zinc-400 transition-colors duration-150 hover:text-zinc-200"
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="submit"
                className="rounded-lg bg-zinc-100 px-4 py-2 text-xs font-medium text-zinc-900 transition-colors duration-150 hover:bg-white"
              >
                Save
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
