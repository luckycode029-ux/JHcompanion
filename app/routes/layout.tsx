import { useLoaderData } from "react-router";
import { AppShell } from "~/components/app-shell/app-shell";
import type { Route } from "./+types/layout";
import { isAdminAuthenticated } from "~/utils/admin-session.server";

export async function loader({ request }: Route.LoaderArgs) {
  return { isAdmin: isAdminAuthenticated(request) };
}

export default function AppLayout() {
  const { isAdmin } = useLoaderData<typeof loader>();
  return <AppShell isAdmin={isAdmin} />;
}
