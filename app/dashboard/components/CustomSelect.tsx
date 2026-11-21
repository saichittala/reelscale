"use client";

import { Select, type SelectOption, type SelectProps } from "@/components/ui/select";

export type { SelectOption };
export interface CustomSelectProps extends SelectProps {}

/**
 * Common dropdown component for ReelScale dashboard, built on @uiarc design system.
 * Full width, Radix portal-mounted, smooth spring animations, and theme-token integrated.
 */
export function CustomSelect(props: CustomSelectProps) {
  return <Select {...props} />;
}

export default CustomSelect;
