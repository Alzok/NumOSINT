'use client';

import {
  Coins,
  CreditCard,
  LogOut,
  Settings,
  User as UserIcon,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { useSession, signOut } from "next-auth/react";
import { Skeleton } from "../ui/skeleton";
import Link from "next/link";
import { ChevronsUpDown } from 'lucide-react';


export function UserNav() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <SidebarMenu>
        <SidebarMenuButton size="lg" className="justify-start">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="grid flex-1 text-left text-sm leading-tight">
             <Skeleton className="h-4 w-24" />
             <Skeleton className="h-3 w-32 mt-1" />
          </div>
        </SidebarMenuButton>
      </SidebarMenu>
    );
  }

  if (status === "unauthenticated" || !session?.user) {
    return (
        <SidebarMenu>
            <Link href="/login">
                <SidebarMenuButton size="lg" className="w-full">
                    <LogOut className="mr-2 h-5 w-5" />
                    <span className="font-semibold">Connexion</span>
                </SidebarMenuButton>
            </Link>
        </SidebarMenu>
    );
  }

  const { user } = session;
  const userName = user.name || "Utilisateur";
  const userEmail = user.email || "";
  const userAvatar = user.image || "";

  return (
    <SidebarMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-secondary"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={userAvatar} alt={userName} />
                <AvatarFallback className="rounded-lg">
                  {userName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{userName}</span>
                <span className="truncate text-xs text-muted-foreground">{userEmail}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-56 rounded-lg"
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex items-center gap-2 p-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={userAvatar} alt={userName} />
                  <AvatarFallback className="rounded-lg">{userName.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 leading-tight">
                  <span className="truncate font-medium">{userName}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {userEmail}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <Link href="/account">
                    <DropdownMenuItem>
                        <UserIcon className="mr-2 h-4 w-4" />
                        <span>Compte</span>
                    </DropdownMenuItem>
                </Link>
                <Link href="/store">
                    <DropdownMenuItem>
                        <Coins className="mr-2 h-4 w-4 text-yellow-500" />
                        <span>Boutique</span>
                    </DropdownMenuItem>
                </Link>
                 <Link href="/settings">
                    <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Paramètres</span>
                    </DropdownMenuItem>
                </Link>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/login' })}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Se déconnecter</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
    </SidebarMenu>
  );
} 