package ir.school.parent.data.repository

import io.mockk.*
import ir.school.parent.data.local.EncryptedPreferencesManager
import ir.school.parent.data.messaging.TokenManager
import ir.school.parent.data.remote.ParentApiService
import ir.school.parent.data.remote.dto.*
import ir.school.parent.domain.model.ChildState
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import retrofit2.Response

class ParentRepositoryTest {

    private val api: ParentApiService = mockk(relaxed = true)
    private val prefs: EncryptedPreferencesManager = mockk(relaxed = true)
    private val tokenManager: TokenManager = mockk(relaxed = true)
    private lateinit var repository: ParentRepositoryImpl

    @Before
    fun setup() {
        repository = ParentRepositoryImpl(api, prefs, tokenManager)
        every { prefs.getToken() } returns "valid-parent-token"
    }

    @Test
    fun `getChildren should map DTOs to Domain models correctly`() = runTest {
        // Arrange
        val dto = ChildrenResponseDto(
            success = true,
            tenantId = "school_alpha",
            children = listOf(
                ChildItemDto(
                    childId = "child-1",
                    firstName = "سارا",
                    lastName = "محمدی",
                    grade = "چهارم",
                    schoolName = "مدرسه البرز",
                    serviceName = "سرویس ۲",
                    driverName = "آقای احمدی"
                )
            )
        )
        coEvery { api.getChildren(any()) } returns Response.success(dto)

        // Act
        val result = repository.getChildren()

        // Assert
        assertTrue(result.isSuccess)
        val children = result.getOrThrow()
        assertEquals(1, children.size)
        assertEquals("child-1", children[0].childId)
        assertEquals("سارا محمدی", children[0].fullName)
        assertEquals("مدرسه البرز", children[0].schoolName)
    }

    @Test
    fun `getChildStatus should parse child state enum correctly`() = runTest {
        // Arrange
        val dto = ChildStatusResponseDto(
            success = true,
            status = ChildStatusDetailsDto(
                childId = "child-1",
                state = "PICKED_UP",
                lastUpdated = "2026-08-27T07:15:00Z",
                driverName = "آقای احمدی",
                serviceName = "سرویس ۲",
                etaMinutes = 10
            )
        )
        coEvery { api.getChildStatus(any(), any()) } returns Response.success(dto)

        // Act
        val result = repository.getChildStatus("child-1")

        // Assert
        assertTrue(result.isSuccess)
        val status = result.getOrThrow()
        assertEquals(ChildState.PICKED_UP, status.state)
        assertEquals("آقای احمدی", status.driverName)
        assertEquals(10, status.etaMinutes)
    }
}
