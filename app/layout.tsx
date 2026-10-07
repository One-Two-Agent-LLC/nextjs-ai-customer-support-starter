import type { ReactNode } from "react";
import type { Metadata } from "next";
import { config, connected } from "@/lib/onetwoagent/config";
import { getCurrentSession } from "@/lib/auth";
import { OneTwoAgentIdentity } from "@/components/onetwoagent-identity";
import "./globals.css";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Northstar — OneTwoAgent integration starter",
  description:
    "A real Next.js integration with signed-in identity and scoped account reads. Isolated demo data.",
  robots: { index: false, follow: false },
};
export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getCurrentSession();
  return (
    <html lang="en">
      <body>
        {children}
        {connected && (
          <>
            <OneTwoAgentIdentity signedIn={Boolean(session)} />
            <script
              src="https://widget.onetwoagent.com/widget/v1.js"
              data-id={config.publicId}
              defer
            />
          </>
        )}
      </body>
    </html>
  );
}
