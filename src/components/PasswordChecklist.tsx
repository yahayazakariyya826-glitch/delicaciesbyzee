import { Check, X } from "lucide-react";
import { passwordRequirements } from "@/lib/password";

export function PasswordChecklist({ password }: { password: string }) {
  return (
    <ul aria-label="Password requirements" className="space-y-1.5 rounded-md bg-muted/50 p-3 text-xs">
      {passwordRequirements.map((requirement) => {
        const met = requirement.test(password);
        const Icon = met ? Check : X;
        return (
          <li key={requirement.id} className={`flex items-center gap-2 ${met ? "text-primary" : "text-muted-foreground"}`}>
            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{requirement.label}</span>
            <span className="sr-only">{met ? "met" : "not met"}</span>
          </li>
        );
      })}
    </ul>
  );
}
