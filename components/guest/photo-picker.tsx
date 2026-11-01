"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Camera, X } from "lucide-react";

import { PHOTO_ACCEPT, PHOTO_FORMAT_NAMES } from "@/lib/photos";
import { GUEST_LIMITS, INTL_TAGS, pickPhotos } from "@/lib/shared";
import { useAppLocale, useOnLanguageChange } from "@/lib/use-app-locale";

interface PhotoPickerProps {
  files: File[];
  onChange: (files: File[]) => void;
  /** Pictures the request already holds elsewhere (on the server): they count toward the 6. */
  alreadyHeld?: number;
  disabled?: boolean;
  /** The sentence under the field when a picture is required and none was picked. */
  error?: string;
}

function Thumbnail({ file, onRemove, disabled }: { file: File; onRemove: () => void; disabled?: boolean }) {
  const t = useTranslations("website.photos");
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const made = URL.createObjectURL(file);
    // Shown on the next frame, not during this effect: the picture is not needed for the first draw of the thumbnail.
    const frame = requestAnimationFrame(() => setUrl(made));

    return () => {
      cancelAnimationFrame(frame);
      URL.revokeObjectURL(made);
    };
  }, [file]);

  return (
    <li className="relative h-20 w-20 overflow-hidden rounded-lg border border-stone-200 bg-stone-100">
      {url && (
        // eslint-disable-next-line @next/next/no-img-element -- a local preview (blob:) that next/image cannot optimize
        <img src={url} alt={t("alt", { name: file.name })} className="h-full w-full object-cover" />
      )}
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        aria-label={t("remove", { name: file.name })}
        className="absolute end-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-950/80 text-white hover:bg-blue-950 disabled:opacity-50"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </li>
  );
}

/** Picks pictures of the problem: JPEG, PNG or WebP up to 5 MB, 6 in all. The problems are said, the good ones are kept. */
export function PhotoPicker({ files, onChange, alreadyHeld = 0, disabled, error }: PhotoPickerProps) {
  const t = useTranslations("website.photos");
  const locale = useAppLocale();
  const input = useRef<HTMLInputElement>(null);
  const [problems, setProblems] = useState<string[]>([]);
  const held = alreadyHeld + files.length;

  useOnLanguageChange(() => setProblems([]));
  const full = held >= GUEST_LIMITS.photosTotal;

  function onPick(list: FileList | null) {
    const picked = Array.from(list ?? []);

    // The same file can be picked again right after: reset the field.
    if (input.current) input.current.value = "";

    if (picked.length === 0) return;

    const { keep, problems: refused } = pickPhotos(held, picked, locale);

    setProblems(refused);

    if (keep.length > 0) onChange([...files, ...keep.map((index) => picked[index])]);
  }

  return (
    <div className="space-y-3">
      <ul className="flex flex-wrap gap-3" aria-label={t("listLabel")}>
        {files.map((file, index) => (
          <Thumbnail
            key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
            file={file}
            disabled={disabled}
            onRemove={() => {
              setProblems([]);
              onChange(files.filter((_, at) => at !== index));
            }}
          />
        ))}
        {!full && (
          <li>
            <button
              type="button"
              onClick={() => input.current?.click()}
              disabled={disabled}
              className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-stone-300 text-xs font-semibold text-stone-500 transition-colors hover:border-[#D4AF37] hover:text-[#B69121] disabled:opacity-50"
            >
              <Camera className="h-5 w-5" />
              {t("add")}
            </button>
          </li>
        )}
      </ul>

      <input
        ref={input}
        type="file"
        accept={PHOTO_ACCEPT}
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => onPick(event.target.files)}
      />

      <p className="text-xs text-stone-500">
        {t("rules", {
          formats: new Intl.ListFormat(INTL_TAGS[locale], { type: "disjunction" }).format(PHOTO_FORMAT_NAMES),
          mb: GUEST_LIMITS.photoBytes / (1024 * 1024),
        })}{" "}
        {t("limit", { total: GUEST_LIMITS.photosTotal, held })}
      </p>

      {problems.length > 0 && (
        <ul role="alert" className="space-y-1 text-sm text-red-600">
          {problems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
      )}

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
    </div>
  );
}
