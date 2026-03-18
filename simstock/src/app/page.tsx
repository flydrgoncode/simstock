import { cookies } from "next/headers";
import { AuthScreen } from "@/components/auth-screen";
import { SimStockApp } from "@/components/simstock-app";
import { getAuthenticatedUserFromCookieStore, isSuperuserShortcutEnabled } from "@/lib/server/auth";
import { getDashboardState } from "@/lib/server/simstock-service";

export default async function Home() {
  const user = await getAuthenticatedUserFromCookieStore(cookies());
  if (!user) {
    return <AuthScreen allowSuperuserShortcut={isSuperuserShortcutEnabled()} />;
  }
  return <SimStockApp initialState={getDashboardState()} />;
}
