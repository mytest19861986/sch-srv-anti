import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "ایمیل و کلمه عبور الزامی است." },
        { status: 400 }
      );
    }

    const backendEndpoints = [
      process.env.INTERNAL_BACKEND_URL,
      "http://backend-api:3000",
      "http://127.0.0.1:3000",
      "http://localhost:3000",
    ].filter(Boolean) as string[];

    let apiRes: Response | null = null;
    let lastError: any = null;

    for (const base of backendEndpoints) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(`${base}/api/v1/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
          signal: controller.signal,
        });
        clearTimeout(timer);
        apiRes = res;
        break;
      } catch (e) {
        lastError = e;
      }
    }

    if (!apiRes) {
      return NextResponse.json(
        { error: `ارتباط با سرور برقرار نشد: ${lastError?.message || "Timeout"}` },
        { status: 502 }
      );
    }

    const data = await apiRes.json();
    const token = data.access_token || data.token;

    if (!apiRes.ok || !token) {
      return NextResponse.json(
        { error: data.message || "ایمیل یا کلمه عبور اشتباه است." },
        { status: 401 }
      );
    }

    // Strict role check for Super Admin Dashboard: SUPER_ADMIN ONLY
    if (data.user?.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "دسترسی غیرمجاز: این پنل فقط مختص راهبر کل پلتفرم (Super Admin) می‌باشد." },
        { status: 403 }
      );
    }

    // Set secure HttpOnly session cookies
    const response = NextResponse.json({
      success: true,
      user: data.user,
      tenantId: data.tenantId || data.user?.tenantId || "system",
    });

    response.cookies.set("session_token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    response.cookies.set("user_role", data.user?.role, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    response.cookies.set("tenant_id", data.user?.tenantId || "system", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: `خطای سرور: ${err.message}` },
      { status: 500 }
    );
  }
}
