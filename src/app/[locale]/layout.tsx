import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { locales, type Locale } from "@/lib/constants";
import { getDictionary, isLocale } from "@/lib/dictionary";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  applicationName: "Quicksol Global",
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale as Locale;
  const dict = getDictionary(locale);
  const messages = (await import(`../../messages/${locale}.json`)).default;

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Header locale={locale} dict={dict} />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer locale={locale} dict={dict} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
