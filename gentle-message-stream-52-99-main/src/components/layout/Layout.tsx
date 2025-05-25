
import React, { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import MainLayout from "./MainLayout";
import PublicNavbar from "./PublicNavbar";

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const authPaths = ["/login", "/register", "/forgot-password", "/reset-password"];
  const isAuthPage = authPaths.includes(location.pathname);

  // For auth pages, don't wrap in MainLayout
  if (isAuthPage) {
    return <>{children}</>;
  }

  // If the children is already wrapped in MainLayout, don't wrap it again
  if (React.isValidElement(children) && children.type === MainLayout) {
    return children;
  }

  // Otherwise wrap in MainLayout
  return <MainLayout>{children}</MainLayout>;
};

export default Layout;
