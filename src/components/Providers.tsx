"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SocketProvider } from "@/contexts/SocketContext";
import { NavigationProvider } from "@/contexts/NavigationContext";
import { GoogleOAuthProvider } from "@react-oauth/google";

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
      <ThemeProvider>
        <GoogleOAuthProvider clientId={googleClientId}>
          <AuthProvider>
            <NavigationProvider>
              <SocketProvider>{children}</SocketProvider>
            </NavigationProvider>
          </AuthProvider>
        </GoogleOAuthProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <NavigationProvider>
          <SocketProvider>{children}</SocketProvider>
        </NavigationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
