import { Form, redirect, useActionData, useLoaderData } from "react-router";
import type { Route } from "./+types/admin-login";
import { createAdminCookie, isAdminAuthenticated, isAdminPasswordValid } from "~/utils/admin-session.server";
import { checkSupabaseConnection } from "~/utils/supabase.server";
import styles from "./admin-login.module.css";

export async function loader({ request }: Route.LoaderArgs) {
  if (isAdminAuthenticated(request)) {
    throw redirect("/admin");
  }

  const supabaseStatus = await checkSupabaseConnection();
  return { supabaseStatus };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const password = String(formData.get("password") ?? "");

  if (!isAdminPasswordValid(password)) {
    return { ok: false, message: "Invalid admin password." };
  }

  return redirect("/admin", {
    headers: {
      "Set-Cookie": createAdminCookie(),
    },
  });
}

export default function AdminLoginRoute() {
  const { supabaseStatus } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Admin Portal</h1>
        <p className={styles.subtitle}>Password-protected upload and resource management</p>

        <div className={[styles.status, supabaseStatus.ok ? styles.ok : styles.error].join(" ")}>
          {supabaseStatus.message}
        </div>

        <Form method="post" className={styles.form}>
          <label className={styles.label} htmlFor="password">
            Admin Password
          </label>
          <input id="password" name="password" type="password" className={styles.input} required />
          {actionData && !actionData.ok ? <p className={styles.feedback}>{actionData.message}</p> : null}
          <button type="submit" className={styles.button}>
            Enter Portal
          </button>
        </Form>
      </div>
    </div>
  );
}
