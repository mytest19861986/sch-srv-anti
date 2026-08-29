package ir.school.parent.ui

import android.content.Context
import android.content.SharedPreferences

/**
 * Parent Android Server Endpoint Configuration Manager (Order #56 / Release v1.1.0)
 * Enables dynamic API endpoint configuration for local Wi-Fi Home Pilot and Production.
 */
class ServerConfigManager(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    companion object {
        private const val PREFS_NAME = "serviceyar_parent_server_config"
        private const val KEY_BASE_URL = "api_base_url"
        const val DEFAULT_PRODUCTION_URL = "https://api.madresehyar.ir"
        const val DEFAULT_LOCAL_URL = "http://10.0.2.2:3000"
        const val HELPER_GUIDE_FA = "برای تست خانگی، IP کامپیوتر مدیر را وارد کنید (مثلاً http://192.168.1.10:3000)"
    }

    /**
     * Gets the current active API base URL.
     */
    fun getApiBaseUrl(): String {
        return prefs.getString(KEY_BASE_URL, DEFAULT_PRODUCTION_URL) ?: DEFAULT_PRODUCTION_URL
    }

    /**
     * Updates and persists the API base URL in local storage.
     */
    fun setApiBaseUrl(newUrl: String) {
        val sanitizedUrl = sanitizeUrl(newUrl)
        prefs.edit().putString(KEY_BASE_URL, sanitizedUrl).apply()
    }

    /**
     * Resets the API base URL to the official production endpoint.
     */
    fun resetToDefault() {
        prefs.edit().putString(KEY_BASE_URL, DEFAULT_PRODUCTION_URL).apply()
    }

    private fun sanitizeUrl(url: String): String {
        var trimmed = url.trim()
        if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
            trimmed = "http://$trimmed"
        }
        if (trimmed.endsWith("/")) {
            trimmed = trimmed.substring(0, trimmed.length - 1)
        }
        return trimmed
    }
}
