'use client';

import * as React from "react"
import { Search, BarChart2, Table, Settings, HelpCircle, PanelLeft, FolderOpen, Activity } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/mode-toggle"
import { useSidebar } from "@/components/ui/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { toggleSidebar } = useSidebar()
  
  const navItems = [
    { href: '/', icon: <Search className="h-5 w-5" />, label: 'Accueil' },
    { href: '/investigations', icon: <FolderOpen className="h-5 w-5" />, label: 'Investigations' },
    { href: '/statistics', icon: <BarChart2 className="h-5 w-5" />, label: 'Statistiques' },
    { href: '/results', icon: <Table className="h-5 w-5" />, label: 'Résultats' },
  ];

  const secondaryNav = [
      { href: '#', icon: <Settings size={20} />, label: 'Paramètres' },
      { href: '#', icon: <HelpCircle size={20} />, label: 'Aide' },
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
    // Pour les liens vers les pages, laisser le comportement par défaut
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
            <PanelLeft className="h-4 w-4" />
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
                        <a href={item.href} className="flex items-center gap-2">
                            {item.icon}
                            <span className="text-sm">{item.label}</span>
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
