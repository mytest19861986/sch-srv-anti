package ir.school.parent.data.messaging

import ir.school.parent.data.local.EncryptedPreferencesManager
import ir.school.parent.data.remote.ParentApiService
import ir.school.parent.data.remote.dto.DeviceRegisterRequest
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TokenManager @Inject constructor(
    private val apiService: ParentApiService,
    private val prefs: EncryptedPreferencesManager
) {

    suspend fun registerToken(fcmToken: String): Boolean {
        prefs.saveFcmToken(fcmToken)
        val authToken = prefs.getToken() ?: return false

        return try {
            val response = apiService.registerDeviceToken(
                token = "Bearer $authToken",
                request = DeviceRegisterRequest(token = fcmToken, platform = "ANDROID")
            )
            if (response.isSuccessful) {
                prefs.setTokenSynced(true)
                true
            } else {
                prefs.setTokenSynced(false)
                false
            }
        } catch (e: Exception) {
            prefs.setTokenSynced(false)
            false
        }
    }

    suspend fun syncPendingTokenIfNeeded(): Boolean {
        val fcmToken = prefs.getFcmToken() ?: return false
        val isSynced = prefs.isTokenSynced()
        if (!isSynced && prefs.getToken() != null) {
            return registerToken(fcmToken)
        }
        return true
    }
}
