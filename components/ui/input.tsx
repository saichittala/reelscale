"use client";

import React, { forwardRef } from "react";
import {
  Input as ArcInput,
  type InputProps as ArcInputProps,
} from "@/components/arc/input/input";

export interface InputProps extends ArcInputProps {
  // Additional utility props if needed
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input(props, ref) {
    return <ArcInput {...props} ref={ref} />;
  }
);

Input.displayName = "Input";

export default Input;
