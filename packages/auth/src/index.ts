export * from "./roles";

export class SessionManager {
  private static STORAGE_KEY = "school_platform_session";

  static saveSession(session: import("./roles").UserSession) {
    if (typeof window !== "undefined") {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));
    }
  }

  static getSession(): import("./roles").UserSession | null {
    if (typeof window !== "undefined") {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return null;
      try {
        return JSON.parse(data);
      } catch {
        return null;
      }
    }
    return null;
  }

  static clearSession() {
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }
}
