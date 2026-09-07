import React, { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'

interface AppLayoutProps {
  children: React.ReactNode
  title?: string
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, title }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Navigation Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Navbar
          onMenuClick={() => setIsSidebarOpen(true)}
          title={title}
        />

        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
export default AppLayout
