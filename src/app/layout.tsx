import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/shell/Sidebar";
import { MobileNav } from "@/components/shell/MobileNav";
import { GlobalAdd } from "@/components/shell/GlobalAdd";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ThemeScript } from "@/components/theme/ThemeScript";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { getFormOptions } from "@/lib/data";

export const metadata: Metadata = {
  title: "Patrimonium",
  description: "Ecossistema financeiro, comercial e patrimonial — Vision, Digital Smile, extras e patrimônio.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const options = await getFormOptions();

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-screen bg-canvas text-ink antialiased">
        <ThemeScript />
        <ThemeProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <MobileNav />
              <div className="hidden items-center justify-end gap-3 border-b border-line bg-canvas/60 px-8 py-3 md:flex">
                <ThemeToggle />
                <GlobalAdd options={options} />
              </div>
              <main className="mx-auto w-full max-w-6xl flex-1 bg-grid px-4 py-6 md:px-8 md:py-10">{children}</main>
            </div>
            <div className="fixed bottom-5 right-5 z-20 md:hidden">
              <GlobalAdd options={options} />
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
