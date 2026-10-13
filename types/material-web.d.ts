import type * as React from "react";

type MdElementProps = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLElement>,
  HTMLElement
> & {
  disabled?: boolean;
  selected?: boolean;
  elevated?: boolean;
  label?: string;
  value?: string | number;
  type?: string;
  rows?: number;
  max?: number;
  indeterminate?: boolean;
  "supporting-text"?: string;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  onInput?: (e: React.FormEvent<HTMLElement>) => void;
  slot?: string;
  [key: string]: unknown;
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "md-filled-button": MdElementProps;
      "md-outlined-button": MdElementProps;
      "md-filled-tonal-button": MdElementProps;
      "md-text-button": MdElementProps;
      "md-chip-set": MdElementProps;
      "md-filter-chip": MdElementProps;
      "md-assist-chip": MdElementProps;
      "md-outlined-text-field": MdElementProps;
      "md-linear-progress": MdElementProps;
      "md-elevation": MdElementProps;
      "md-ripple": MdElementProps;
    }
  }
}

declare module "react/jsx-runtime" {
  namespace JSX {
    interface IntrinsicElements {
      "md-filled-button": MdElementProps;
      "md-outlined-button": MdElementProps;
      "md-filled-tonal-button": MdElementProps;
      "md-text-button": MdElementProps;
      "md-chip-set": MdElementProps;
      "md-filter-chip": MdElementProps;
      "md-assist-chip": MdElementProps;
      "md-outlined-text-field": MdElementProps;
      "md-linear-progress": MdElementProps;
      "md-elevation": MdElementProps;
      "md-ripple": MdElementProps;
    }
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "md-filled-button": MdElementProps;
      "md-outlined-button": MdElementProps;
      "md-filled-tonal-button": MdElementProps;
      "md-text-button": MdElementProps;
      "md-chip-set": MdElementProps;
      "md-filter-chip": MdElementProps;
      "md-assist-chip": MdElementProps;
      "md-outlined-text-field": MdElementProps;
      "md-linear-progress": MdElementProps;
      "md-elevation": MdElementProps;
      "md-ripple": MdElementProps;
    }
  }
}