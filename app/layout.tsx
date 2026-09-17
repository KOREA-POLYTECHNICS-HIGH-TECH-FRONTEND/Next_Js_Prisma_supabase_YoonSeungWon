import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    template: '%s | Next.js + Supabase + Prisma 8 Template',
    default: 'Next.js + Supabase + Prisma 8 Template'
  },
  description: 'Next.js + Supabase + Prisma 8 템플릿'
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="ko"
      className="antialiased">
      <head>
        <link
          rel="icon"
          href="/favicon.png"
        />
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
