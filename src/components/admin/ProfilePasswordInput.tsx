import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfilePasswordInput({ id, label, value, onChange, disabled, autoComplete = "current-password" }: {
  id: string; label: string; value: string; onChange: (value: string) => void;
  disabled: boolean; autoComplete?: "current-password" | "new-password";
}) {
  const [visible, setVisible] = useState(false);
  return <div className="space-y-2">
    <Label htmlFor={id}>{label}</Label>
    <div className="relative">
      <Input id={id} required disabled={disabled} type={visible ? "text" : "password"} autoComplete={autoComplete} maxLength={256} value={value} onChange={(event) => onChange(event.target.value)} className="pr-12" />
      <Button type="button" size="icon" variant="ghost" disabled={disabled} className="absolute right-0 top-0 h-10 w-10" onClick={() => setVisible((shown) => !shown)} aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`} title={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`} aria-pressed={visible}>
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>
    </div>
  </div>;
}