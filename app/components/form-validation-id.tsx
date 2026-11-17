"use client";

import { useEffect } from "react";

type Field = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

function messageFor(el: Field): string {
  const v = el.validity;
  if (v.valueMissing) {
    if (el instanceof HTMLSelectElement) return "Pilih salah satu pilihan.";
    if (el instanceof HTMLInputElement && el.type === "checkbox") {
      return "Centang kotak ini jika ingin melanjutkan.";
    }
    return "Isi kolom ini.";
  }
  if (v.typeMismatch) return "Format isian tidak sesuai.";
  if (v.patternMismatch) return "Format isian tidak sesuai.";
  if (v.tooShort) return `Minimal ${el.getAttribute("minlength")} karakter.`;
  if (v.tooLong) return `Maksimal ${el.getAttribute("maxlength")} karakter.`;
  if (v.rangeUnderflow) return `Nilai minimal ${el.getAttribute("min")}.`;
  if (v.rangeOverflow) return `Nilai maksimal ${el.getAttribute("max")}.`;
  if (v.badInput) return "Nilai tidak valid.";
  return "";
}

const isField = (t: EventTarget | null): t is Field =>
  t instanceof HTMLInputElement ||
  t instanceof HTMLSelectElement ||
  t instanceof HTMLTextAreaElement;

export function FormValidationId() {
  useEffect(() => {
    const onInvalid = (e: Event) => {
      if (isField(e.target)) e.target.setCustomValidity(messageFor(e.target));
    };
    const onInput = (e: Event) => {
      if (isField(e.target)) e.target.setCustomValidity("");
    };
    document.addEventListener("invalid", onInvalid, true);
    document.addEventListener("input", onInput, true);
    return () => {
      document.removeEventListener("invalid", onInvalid, true);
      document.removeEventListener("input", onInput, true);
    };
  }, []);
  return null;
}
