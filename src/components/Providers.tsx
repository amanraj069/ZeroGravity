"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SocketProvider } from "@/contexts/SocketContext";
import { NavigationProvider } from "@/contexts/NavigationContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { QueryProvider } from "@/providers/QueryProvider";

interface ProvidersProps {
  children: React.ReactNode;
  googleClientId?: string;
}

export default function Providers({
  children,
  googleClientId,
}: ProvidersProps) {
  if (googleClientId) {
    return (
      <QueryProvider>
        <ThemeProvider>
          <ToastProvider>
            <GoogleOAuthProvider clientId={googleClientId}>
              <AuthProvider>
                <NavigationProvider>
                  <SocketProvider>{children}</SocketProvider>
                </NavigationProvider>
              </AuthProvider>
            </GoogleOAuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </QueryProvider>
    );
  }

  return (
    <QueryProvider>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <NavigationProvider>
              <SocketProvider>{children}</SocketProvider>
            </NavigationProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
