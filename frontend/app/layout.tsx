import "./globals.css";
import "./styles/ui.css";
import Providers from "./providers";
import { Toaster } from "react-hot-toast";
import type { Metadata } from "next";
import Navbar from "./components/Navbar";


export const metadata: Metadata = {
  title: "SyncTrade",
  description: "Copy trading platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Navbar />
          {children}

          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#161b22",
                color: "#e6edf3",
                border: "1px solid #30363d",
              },
              success: {
                iconTheme: {
                  primary: "#26a641",
                  secondary: "#0f1419",
                },
              },
              error: {
                iconTheme: {
                  primary: "#f85149",
                  secondary: "#0f1419",
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
