import type { MDXComponents } from "mdx/types";
import { components } from "@/components/mdx";

export function useMDXComponents(
  defaultComponents: MDXComponents,
): MDXComponents {
  return {
    ...components,
    ...defaultComponents,
  };
}
