package ir.school.driver.data.local

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class EncryptedPreferencesManager @Inject constructor(
    @ApplicationContext context: Context
) {
    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val prefs: SharedPreferences = EncryptedSharedPreferences.create(
        context,
        "driver_secure_prefs",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    fun saveToken(token: String?) {
        val safeToken = token ?: ""
        if (token.isNullOrBlank()) {
            Log.w("ServiceYar", "saveToken received null/empty token")
        }
        prefs.edit().putString("auth_token", safeToken).apply()
    }

    fun getToken(): String? {
        val token = prefs.getString("auth_token", null)
        return if (token.isNullOrBlank()) null else token
    }

    fun saveTenantId(tenantId: String?) {
        val safeTenant = tenantId ?: ""
        if (tenantId.isNullOrBlank()) {
            Log.w("ServiceYar", "saveTenantId received null/empty tenantId, falling back to empty string")
        }
        prefs.edit().putString("tenant_id", safeTenant).apply()
    }

    fun getTenantId(): String? {
        val tenant = prefs.getString("tenant_id", null)
        return if (tenant.isNullOrBlank()) null else tenant
    }

    fun clearAuth() {
        prefs.edit().remove("auth_token").remove("tenant_id").apply()
    }
}
