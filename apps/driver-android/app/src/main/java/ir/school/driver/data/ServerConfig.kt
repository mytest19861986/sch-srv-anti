package ir.school.driver.data

import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.util.concurrent.TimeUnit

object ServerConfig {
    private const val PREFS = "server_config"
    private const val KEY_BASE_URL = "base_url"
    const val DEFAULT_BASE_URL = "http://192.168.1.110:3000"

    fun getBaseUrl(context: Context): String {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        return prefs.getString(KEY_BASE_URL, DEFAULT_BASE_URL) ?: DEFAULT_BASE_URL
    }

    fun setBaseUrl(context: Context, url: String) {
        var cleanUrl = url.trim().trimEnd('/')
        if (cleanUrl.endsWith("/api/v1")) {
            cleanUrl = cleanUrl.removeSuffix("/api/v1").trimEnd('/')
        }
        if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
            cleanUrl = "http://$cleanUrl"
        }
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit().putString(KEY_BASE_URL, cleanUrl).apply()
    }

    suspend fun testHealthConnection(context: Context, customUrl: String? = null): Pair<Boolean, String> = withContext(Dispatchers.IO) {
        val baseUrl = (customUrl ?: getBaseUrl(context)).trim().trimEnd('/')
        val targetUrl = "$baseUrl/health/live"
        try {
            val request = Request.Builder().url(targetUrl).build()
            val client = OkHttpClient.Builder()
                .connectTimeout(5, TimeUnit.SECONDS)
                .readTimeout(5, TimeUnit.SECONDS)
                .build()
            client.newCall(request).execute().use { response ->
                if (response.isSuccessful) {
                    Pair(true, "✅ اتصال برقرار شد (HTTP ${response.code})\nآدرس: $targetUrl")
                } else {
                    Pair(false, "⚠️ پاسخ نامعتبر (HTTP ${response.code})\nآدرس: $targetUrl")
                }
            }
        } catch (e: Exception) {
            Pair(false, "❌ عدم برقراری ارتباط:\nآدرس: $targetUrl\nعلت: ${e.javaClass.simpleName}: ${e.message}")
        }
    }
}
