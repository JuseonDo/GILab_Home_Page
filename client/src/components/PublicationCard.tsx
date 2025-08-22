import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { renderAbstract } from "@/utils/renderAbstract";
import { Link } from "wouter";
import { AuthedUser } from "@/hooks/useAuth";

export interface Author {
  id?: string;
  name: string;
  homepage?: string | null;
}

export interface Publication {
  id: string;
  title: string;
  journal?: string | null;
  conference?: string | null;
  year: string;                   // 서버가 문자열 연도
  type: "journal" | "conference";
  abstract: string;
  pdfUrl?: string | null;
  authors: Author[];
}

export default function PublicationCard({
  pub,
  user,
}: {
  pub: Publication;
  user: AuthedUser | null | undefined;
}) {
  const venue =
    pub.type === "journal"
      ? pub.journal || ""
      : pub.conference || "";

  return (
    <Card className="border">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">{pub.title}</h3>
            <p className="text-sm text-slate-600">
              {venue && <span>{venue} · </span>}
              <span>{pub.year}</span>
            </p>
          </div>
          {user?.isAdmin && (
            <Link href={`/publications/${pub.id}/edit`}>
              <Button size="sm" variant="outline">수정</Button>
            </Link>
          )}
        </div>

        {/* 저자 */}
        <p className="text-sm text-slate-700">
          {pub.authors?.map((a, i) => (
            <span key={i}>
              {a.homepage ? (
                <a className="underline" href={a.homepage} target="_blank" rel="noreferrer">{a.name}</a>
              ) : (
                a.name
              )}
              {i < (pub.authors?.length ?? 0) - 1 ? ", " : ""}
            </span>
          ))}
        </p>

        {/* 초록 (굵게/밑줄 유지) */}
        <div
          className="text-sm text-slate-700"
          dangerouslySetInnerHTML={{ __html: renderAbstract(pub.abstract) }}
        />

        {/* 링크 */}
        {pub.pdfUrl && (
          <a className="text-sm underline" href={pub.pdfUrl} target="_blank" rel="noreferrer">
            PDF 보기
          </a>
        )}
      </CardContent>
    </Card>
  );
}
