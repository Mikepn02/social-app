import '../globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import { Inter } from 'next/font/google'
import Topbar  from '@/components/shared/Topbar'
import LeftSideBar from '@/components/shared/leftSideBar'
import RightSideBar from '@/components/shared/rightSideBar'
import Bottombar from '@/components/shared/Bottombar'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'thread',
  description: 'A Next.js 13 Meta Threads Application'
}


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <Topbar />
          <main className='flex flex-row'>
            <LeftSideBar />

            <section className='main-container'>
                <div className='w-full max-w-4xl'>
                {children}
                </div>
            </section>
            <RightSideBar />
          </main>
          <Bottombar />
      </body>
      </html>
    </ClerkProvider>

  )
}
