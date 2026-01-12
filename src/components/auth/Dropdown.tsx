"use client";

import { ThemeToggle } from "@/provider/theme-provider";

type SideBarDropdownProps = {
  shouldViewFullName?: boolean;
  side?: "top";
  align?: "start";
};

export default function SideBarDropdown(_props: SideBarDropdownProps) {
  return <ThemeToggle />;
}
