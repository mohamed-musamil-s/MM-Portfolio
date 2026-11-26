import {
  Award,
  BriefcaseBusiness,
  FolderKanban,
  GraduationCap,
  type LucideIcon,
  Menu,
  MessageSquare,
  PanelBottom,
  Sparkles,
  Tags,
  UserRound,
  Wrench,
} from "lucide-react";

/** One icon per home-page section, shared by Content Forge and Launchpad. */
export const SECTION_ICONS: Record<string, LucideIcon> = {
  meta: Tags,
  nav: Menu,
  hero: Sparkles,
  about: UserRound,
  experience: BriefcaseBusiness,
  education: GraduationCap,
  skills: Wrench,
  work: FolderKanban,
  recognition: Award,
  contact: MessageSquare,
  footer: PanelBottom,
};
