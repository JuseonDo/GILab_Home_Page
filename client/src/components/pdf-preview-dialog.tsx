import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type PdfPreviewDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  pdfUrl: string;
};

export default function PdfPreviewDialog({
  open,
  onOpenChange,
  title,
  pdfUrl,
}: PdfPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[80vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
          {/* 접근성 설명(경고 제거용) */}
          <DialogDescription className="sr-only">
            PDF 미리보기 대화상자입니다. 보이지 않으면 카드의 PDF 버튼으로 새 창에서 열어주세요.
          </DialogDescription>
        </DialogHeader>
        <div className="relative w-full h-full">
          <iframe
            src={`${pdfUrl}#page=1&zoom=100`}
            className="w-full h-full"
            title="PDF Preview"
            sandbox="allow-same-origin allow-scripts allow-forms allow-downloads"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
