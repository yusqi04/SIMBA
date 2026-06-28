import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { email, password, nama, role } = await request.json();

    if (!email || !password || !nama || !role) {
      return NextResponse.json({ error: "Semua field wajib diisi" }, { status: 400 });
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nama },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: authData.user.id,
        nama,
        email,
        role,
        status: "active",
      });

    if (profileError) {
      console.warn("Profile error:", profileError.message);
    }

    return NextResponse.json({ success: true, user: authData.user });
  } catch {
    return NextResponse.json({ error: "Gagal membuat user" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await request.json();

    // Hapus profile dulu
    await supabaseAdmin.from("profiles").delete().eq("id", userId);

    // Hapus auth user
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Gagal menghapus user" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { userId, action } = await request.json();

    if (action === "confirm") {
      // Konfirmasi email user
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        email_confirm: true,
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      // Update status profile
      await supabaseAdmin
        .from("profiles")
        .update({ status: "active" })
        .eq("id", userId);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Action tidak valid" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Gagal konfirmasi user" }, { status: 500 });
  }
}
