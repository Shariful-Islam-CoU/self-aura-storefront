"use client";

import * as React from "react";
import { ChevronDown, ChevronUp, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Portal } from "@/components/ui/Portal";

const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & {
    options?: { value: string; label: string }[];
    label?: string;
    error?: string;
    placeholder?: string;
    helperText?: string;
  }
>(({ className, options, label, error, placeholder, helperText, id, required, children, ...props }, ref) => {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-label text-foreground">
          {label}
          {required && (
            <span className="ml-0.5 text-destructive" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={
            error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined
          }
          className={cn(
            "flex h-10 w-full appearance-none rounded-md border border-input bg-card px-3 pr-9 text-sm text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "transition-colors",
            placeholder && !props.value && "text-muted-foreground",
            error && "border-destructive focus-visible:ring-destructive",
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
      </div>
      {error && (
        <p id={`${selectId}-error`} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p id={`${selectId}-helper`} className="text-sm text-muted-foreground">
          {helperText}
        </p>
      )}
    </div>
  );
});
Select.displayName = "Select";

/**
 * Radix UI style Select components for more complex use cases
 */
const SelectContext = React.createContext<{
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
} | null>(null);

const SelectProvider = ({
  children,
  value,
  onValueChange,
  open,
  onOpenChange,
}: {
  children: React.ReactNode;
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => (
  <SelectContext.Provider value={{ value, onValueChange, open, onOpenChange }}>
    {children}
  </SelectContext.Provider>
);

const useSelectContext = () => {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error("Select components must be used within Select.Root");
  }
  return context;
};

interface SelectRootProps {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  children: React.ReactNode;
}

const SelectRoot = React.forwardRef<HTMLDivElement, SelectRootProps>(
  ({ value, onValueChange, defaultValue, children }, ref) => {
    const [internalValue, setInternalValue] = React.useState(value || defaultValue || "");
    const [open, setOpen] = React.useState(false);

    const controlled = value !== undefined;
    const currentValue = controlled ? value : internalValue;

    const handleValueChange = (newValue: string) => {
      if (!controlled) setInternalValue(newValue);
      onValueChange?.(newValue);
      setOpen(false);
    };

    return (
      <SelectProvider
        value={currentValue}
        onValueChange={handleValueChange}
        open={open}
        onOpenChange={setOpen}
      >
        <div ref={ref} className="relative w-full" data-state={open ? "open" : "closed"}>
          {children}
        </div>
      </SelectProvider>
    );
  }
);
SelectRoot.displayName = "SelectRoot";

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { children?: React.ReactNode }
>(({ className, children, ...props }, ref) => {
  const { value, onValueChange, open, onOpenChange } = useSelectContext();

  return (
    <button
      ref={ref}
      type="button"
      role="combobox"
      aria-expanded={open}
      aria-haspopup="listbox"
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "transition-colors",
        "[&>span]:line-clamp-1",
        "data-[placeholder]:text-muted-foreground",
        className
      )}
      onClick={() => onOpenChange(!open)}
      {...props}
    >
      {children}
      <ChevronDown
        className={cn(
          "ml-2 h-4 w-4 flex-shrink-0 opacity-50",
          open && "rotate-180"
        )}
        aria-hidden="true"
      />
    </button>
  );
});
SelectTrigger.displayName = "SelectTrigger";

const SelectValue = ({ placeholder }: { placeholder?: string }) => {
  const { value } = useSelectContext();
  return <span>{value || placeholder || "Select..."}</span>;
};
SelectValue.displayName = "SelectValue";

const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { position?: "popper" | "inline" }
>(({ className, children, position = "popper", ...props }, ref) => {
  const { open, onOpenChange } = useSelectContext();

  if (!open) return null;

  const content = (
    <div
      ref={ref}
      className={cn(
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border border-border bg-card text-card-foreground shadow-md",
        "animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        position === "popper" && "absolute",
        className
      )}
      {...props}
    >
      <div className="p-1">{children}</div>
    </div>
  );

  if (position === "popper") {
    return (
      <Portal>
        {content}
      </Portal>
    );
  }

  return content;
});
SelectContent.displayName = "SelectContent";

const SelectItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string; disabled?: boolean }
>(({ className, children, value, disabled, ...props }, ref) => {
  const { value: currentValue, onValueChange, onOpenChange } = useSelectContext();

  const handleClick = () => {
    if (disabled) return;
    onValueChange(value);
    onOpenChange(false);
  };

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none",
        "focus:bg-accent focus:text-accent-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        "aria-selected:bg-accent/50 aria-selected:text-accent-foreground",
        disabled && "pointer-events-none opacity-50",
        className
      )}
      onClick={handleClick}
      role="option"
      aria-selected={currentValue === value}
      aria-disabled={disabled}
      data-value={value}
      data-disabled={disabled}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {currentValue === value && <Check className="h-4 w-4" />}
      </span>
      <span className="truncate">{children}</span>
    </div>
  );
});
SelectItem.displayName = "SelectItem";

const SelectSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
);
SelectSeparator.displayName = "SelectSeparator";

export {
  Select,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectSeparator,
};