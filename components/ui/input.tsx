"use client";

import { forwardRef } from "react";
import {
  Input as ArcInput,
  type InputProps as ArcInputProps,
} from "@/components/arc/input/input";
import { DatePicker } from "./date-picker";

export interface InputProps extends ArcInputProps {
  // Additional utility props if needed
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input(props, ref) {
    if (props.type === "date") {
      const { type, ...dateProps } = props;
      return <DatePicker {...(dateProps as any)} />;
    }
    return <ArcInput {...props} ref={ref} />;
  }
);

Input.displayName = "Input";

export default Input;
