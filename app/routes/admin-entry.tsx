import { redirect } from "react-router";
import type { Route } from "./+types/admin-entry";
import { isAdminAuthenticated } from "~/utils/admin-session.server";

export async function loader({ request }: Route.LoaderArgs) {
  if (!isAdminAuthenticated(request)) throw redirect("/admin/login");
  throw redirect("/");
}
