'use client';

import * as React from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/mode-toggle"
import { useAppStore } from "@/lib/store"
import { Badge } from "@/components/ui/badge"

// Local SVG Icon Components
const NotificationsIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
);
const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const FolderOpenIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 19h14a2 2 0 0 0 1.84 -2.75l-7.1 -12.25a2 2 0 0 0 -3.5 0l-7.1 12.25a2 2 0 0 0 1.75 2.75" />
    </svg>
);
const BarChartIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
);
const TableChartIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3h18v18h-18z" />
        <path d="M3 9h18" />
        <path d="M9 3v18" />
    </svg>
);
const SettingsIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.22 2h-4.44a2 2 0 0 0 -2 2v.78a2 2 0 0 1 -1.11 1.79l-.56.34a2 2 0 0 1 -2.22 0l-.56-.34a2 2 0 0 0 -2.22 0l-4.44 2.54a2 2 0 0 0 0 3.52l4.44 2.54a2 2 0 0 0 2.22 0l.56-.34a2 2 0 0 1 2.22 0l.56.34a2 2 0 0 0 2.22 0l4.44-2.54a2 2 0 0 0 0-3.52l-4.44-2.54a2 2 0 0 0 -2.22 0l-.56.34a2 2 0 0 1 -1.11-1.79v-.78a2 2 0 0 0 -2-2z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);
const HelpIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
);
const MenuOpenIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="4" y1="12" x2="20" y2="12" />
        <line x1="4" y1="6" x2="20" y2="6" />
        <line x1="4" y1="18" x2="14" y2="18" />
    </svg>
);


export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { toggleSidebar, setOpenMobile, isMobile } = useSidebar()
  const notifications = useAppStore((state) => state.notifications);
  const unreadCount = notifications.filter(n => !n.isRead).length;
  
  const navItems = [
    { href: '/', icon: <SearchIcon className="h-5 w-5" />, label: 'Accueil' },
    { href: '/investigations', icon: <FolderOpenIcon className="h-5 w-5" />, label: 'Investigations' },
    { href: '/statistics', icon: <BarChartIcon className="h-5 w-5" />, label: 'Statistiques' },
    { href: '/results', icon: <TableChartIcon className="h-5 w-5" />, label: 'Résultats' },
  ];

  const secondaryNav = [
      { href: '/notifications', icon: <NotificationsIcon className="h-5 w-5" />, label: 'Notifications', badge: unreadCount > 0 ? unreadCount : null },
      { href: '#', icon: <SettingsIcon className="h-5 w-5" />, label: 'Paramètres' },
      { href: '#', icon: <HelpIcon className="h-5 w-5" />, label: 'Aide' },
  ]

  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const targetId = href.replace(/.*#/, "");
      if (!targetId || targetId === "app-sidebar") return;
      const elem = document.getElementById(targetId);
      elem?.scrollIntoView({
        behavior: 'smooth',
      });
    }
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div className="flex items-center justify-center p-2">
          <SidebarMenuButton
            onClick={toggleSidebar}
            className="h-8 w-8 p-0 justify-center"
            tooltip="Toggle Sidebar"
          >
            <MenuOpenIcon className="h-4 w-4" />
          </SidebarMenuButton>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton asChild tooltip={item.label}>
                <a
                  href={item.href}
                  onClick={(e) => handleNavigation(e, item.href)}
                  className="flex items-center gap-2"
                >
                  {item.icon}
                  <span className="text-sm">{item.label}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
            {secondaryNav.map((item) => (
                <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton asChild tooltip={item.label}>
                        <a href={item.href} className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                                {item.icon}
                                <span className="text-sm">{item.label}</span>
                            </div>
                            {item.badge && (
                                <Badge className="h-5 w-5 flex items-center justify-center p-0">{item.badge}</Badge>
                            )}
                        </a>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            ))}
            <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Changer le thème">
                    <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
                        <ModeToggle />
                        <span className="text-sm group-data-[collapsible=icon]:hidden">Thème</span>
                    </div>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
