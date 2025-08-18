import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, User, LogOut, Settings, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function Header() {
  const [location, setLocation] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAuthenticated, refetch } = useAuth();
  const { toast } = useToast();

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Members", href: "/members" },
    { name: "Research & Publication", href: "/research" },
    { name: "News", href: "/news" },
    { name: "Access", href: "/access" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("/api/auth/logout", { method: "POST" }),
    onSuccess: () => {
      toast({
        title: "로그아웃 완료",
        description: "안전하게 로그아웃되었습니다.",
      });
      refetch();
      setLocation("/");
    },
    onError: () => {
      toast({
        title: "로그아웃 실패",
        description: "로그아웃 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  return (
    <nav className="navbar-glass fixed w-full top-0 z-50 border-b border-gray-200" data-testid="navigation-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/" data-testid="link-home-logo">
                <h1 className="text-xl font-bold text-lab-blue cursor-pointer">
                  Advanced Research Lab
                </h1>
              </Link>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  data-testid={`link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <span
                    className={`px-3 py-2 text-sm font-medium transition-colors duration-200 cursor-pointer ${
                      isActive(item.href)
                        ? "text-lab-blue font-semibold"
                        : "text-gray-700 hover:text-lab-blue"
                    }`}
                  >
                    {item.name}
                  </span>
                </Link>
              ))}
              
              {/* User Menu */}
              <div className="flex items-center space-x-4 ml-6 border-l border-gray-200 pl-6">
                {isAuthenticated && user ? (
                  <>
                    {user.isAdmin && (
                      <Link href="/create-publication">
                        <Button size="sm" data-testid="button-create-publication">
                          <Plus className="h-4 w-4 mr-1" />
                          논문 게시
                        </Button>
                      </Link>
                    )}
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="flex items-center gap-2" data-testid="button-user-menu">
                          <User className="h-4 w-4" />
                          <span>{user.firstName} {user.lastName}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <User className="h-4 w-4 mr-2" />
                          <span>{user.email}</span>
                        </DropdownMenuItem>
                        {user.isAdmin && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href="/admin" className="cursor-pointer w-full" data-testid="link-admin">
                                <Settings className="h-4 w-4 mr-2" />
                                <span>관리자 패널</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href="/settings" className="cursor-pointer w-full" data-testid="link-settings">
                                <Settings className="h-4 w-4 mr-2" />
                                <span>실험실 설정</span>
                              </Link>
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => logoutMutation.mutate()}
                          disabled={logoutMutation.isPending}
                          className="cursor-pointer text-red-600"
                          data-testid="button-logout"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          <span>로그아웃</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Link href="/login">
                      <Button variant="ghost" size="sm" data-testid="button-login">
                        로그인
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button size="sm" data-testid="button-register">
                        회원가입
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200" data-testid="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                data-testid={`link-mobile-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <span
                  className={`block px-3 py-2 text-base font-medium cursor-pointer ${
                    isActive(item.href)
                      ? "text-lab-blue bg-gray-50"
                      : "text-gray-700 hover:text-lab-blue hover:bg-gray-50"
                  }`}
                >
                  {item.name}
                </span>
              </Link>
            ))}
            
            {/* Mobile User Menu */}
            <div className="border-t border-gray-200 pt-3 mt-3">
              {isAuthenticated && user ? (
                <>
                  <div className="px-3 py-2 text-sm text-gray-500">
                    {user.firstName} {user.lastName}
                  </div>
                  <Link
                    href="/create-publication"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-lab-blue hover:bg-gray-50"
                    data-testid="link-mobile-create-publication"
                  >
                    논문 게시
                  </Link>
                  {user.isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setIsMenuOpen(false)}
                      className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-lab-blue hover:bg-gray-50"
                      data-testid="link-mobile-admin"
                    >
                      관리자 패널
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      logoutMutation.mutate();
                      setIsMenuOpen(false);
                    }}
                    disabled={logoutMutation.isPending}
                    className="block w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:bg-gray-50"
                    data-testid="button-mobile-logout"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-lab-blue hover:bg-gray-50"
                    data-testid="link-mobile-login"
                  >
                    로그인
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-3 py-2 text-base font-medium text-lab-blue hover:bg-gray-50"
                    data-testid="link-mobile-register"
                  >
                    회원가입
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
