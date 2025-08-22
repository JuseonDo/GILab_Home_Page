import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, Clock, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface PendingUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}

export default function Admin() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pendingUsers, isLoading: isPendingUsersLoading } = useQuery<PendingUser[]>({
    queryKey: ["/admin/pending-users"],
    enabled: user?.isAdmin,
  });

  const approveUserMutation = useMutation({
    mutationFn: (userId: string) =>
      apiRequest("POST", `/admin/approve-user/${userId}`),
    onSuccess: () => {
      toast({
        title: "사용자 승인 완료",
        description: "사용자가 성공적으로 승인되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ["/admin/pending-users"] });
    },
    onError: (error: any) => {
      toast({
        title: "승인 실패",
        description: error.message || "사용자 승인 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white">로딩 중...</div>
      </div>
    );
  }

  if (!user || !user.isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">접근 권한 없음</h2>
            <p className="text-slate-600 mb-6">관리자만 접근할 수 있는 페이지입니다.</p>
            <Link href="/">
              <Button className="w-full">홈으로 돌아가기</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">관리자 패널</h1>
          <p className="text-blue-100">사용자 승인 및 시스템 관리</p>
        </div>

        <div className="grid gap-6 mb-8">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 flex items-center">
                <div className="p-3 bg-blue-100 rounded-full mr-4">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">승인 대기</p>
                  <p className="text-2xl font-bold text-slate-800" data-testid="text-pending-count">
                    {pendingUsers?.length || 0}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 flex items-center">
                <div className="p-3 bg-green-100 rounded-full mr-4">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">승인된 사용자</p>
                  <p className="text-2xl font-bold text-slate-800">-</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 flex items-center">
                <div className="p-3 bg-purple-100 rounded-full mr-4">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">총 사용자</p>
                  <p className="text-2xl font-bold text-slate-800">-</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Users Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                승인 대기 중인 사용자
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isPendingUsersLoading ? (
                <div className="text-center py-8">
                  <p className="text-slate-600">로딩 중...</p>
                </div>
              ) : !pendingUsers || pendingUsers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-600">승인 대기 중인 사용자가 없습니다.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>이름</TableHead>
                      <TableHead>이메일</TableHead>
                      <TableHead>가입일</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingUsers.map((user) => (
                      <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                        <TableCell className="font-medium" data-testid={`text-user-name-${user.id}`}>
                          {user.firstName} {user.lastName}
                        </TableCell>
                        <TableCell data-testid={`text-user-email-${user.id}`}>
                          {user.email}
                        </TableCell>
                        <TableCell data-testid={`text-user-date-${user.id}`}>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">승인 대기</Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => approveUserMutation.mutate(user.id)}
                            disabled={approveUserMutation.isPending}
                            data-testid={`button-approve-${user.id}`}
                          >
                            {approveUserMutation.isPending ? "승인 중..." : "승인"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}