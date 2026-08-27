package ir.school.parent.data.messaging

import io.mockk.*
import ir.school.parent.data.local.EncryptedPreferencesManager
import ir.school.parent.data.remote.ParentApiService
import ir.school.parent.data.remote.dto.DeviceRegisterRequest
import ir.school.parent.data.remote.dto.DeviceRegisterResponse
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import retrofit2.Response

class TokenManagerTest {

    private val api: ParentApiService = mockk(relaxed = true)
    private val prefs: EncryptedPreferencesManager = mockk(relaxed = true)
    private lateinit var tokenManager: TokenManager

    @Before
    fun setup() {
        tokenManager = TokenManager(api, prefs)
    }

    @Test
    fun `registerToken should succeed and mark token synced when API returns 200`() = runTest {
        // Arrange
        val fcmToken = "fcm-valid-token-123"
        every { prefs.getToken() } returns "valid-auth-token"
        coEvery { api.registerDeviceToken(any(), any()) } returns Response.success(
            DeviceRegisterResponse(success = true, message = "Registered")
        )

        // Act
        val result = tokenManager.registerToken(fcmToken)

        // Assert
        assertTrue(result)
        verify { prefs.saveFcmToken(fcmToken) }
        verify { prefs.setTokenSynced(true) }
        coVerify {
            api.registerDeviceToken(
                token = "Bearer valid-auth-token",
                request = DeviceRegisterRequest(token = fcmToken, platform = "ANDROID")
            )
        }
    }

    @Test
    fun `registerToken should return false and not mark synced when unauthenticated`() = runTest {
        // Arrange
        val fcmToken = "fcm-valid-token-123"
        every { prefs.getToken() } returns null

        // Act
        val result = tokenManager.registerToken(fcmToken)

        // Assert
        assertFalse(result)
        verify { prefs.saveFcmToken(fcmToken) }
        verify(exactly = 0) { prefs.setTokenSynced(true) }
    }
}
