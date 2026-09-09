'use client'

import type { ReactNode } from 'react'
import Navbar from './navbar'
import Footer from './footer'

export function Layout({ children }: { children: ReactNode }) {
 
  return (
    <div className="min-h-screen bg-ink text-paper-dim">
      <Navbar />
    
      <main >{children}</main>
      <Footer />
    </div>
  )
}
