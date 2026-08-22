import type { ReactNode } from "react";
import { signatureFontVariables } from "@/lib/fonts/signature-fonts";

/**
 * Scopes the handwriting faces to the agreement signing route, the only place
 * a client can type a signature.
 */
export default function AgreementLayout({ children }: { children: ReactNode }) {
  return <div className={signatureFontVariables}>{children}</div>;
}
