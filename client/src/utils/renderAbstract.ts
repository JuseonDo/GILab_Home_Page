import DOMPurify from "dompurify";

/** 폼에서 저장한 abstract를 간단 HTML로 변환(굵게/밑줄/개행 유지) */
export function renderAbstract(raw?: string) {
  const html = (raw ?? "")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") // **텍스트** → 굵게
    .replace(/<u>(.*?)<\/u>/g, "<u>$1</u>")            // <u>텍스트</u> 유지
    .replace(/(?:\r\n|\r|\n)/g, "<br />");             // 개행 유지

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["strong", "u", "br", "p", "em", "b", "i", "span"],
    ALLOWED_ATTR: [],
  });
}
