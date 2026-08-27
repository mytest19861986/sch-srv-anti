package ir.school.driver.data.repository

import io.mockk.*
import ir.school.driver.data.local.*
import ir.school.driver.data.remote.DriverApiService
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Before
import org.junit.Test

class AttendanceRepositoryTest {

    private val dao: AttendanceEventDao = mockk(relaxed = true)
    private val api: DriverApiService = mockk(relaxed = true)
    private val prefs: EncryptedPreferencesManager = mockk(relaxed = true)
    private lateinit var repository: AttendanceRepositoryImpl

    @Before
    fun setup() {
        repository = AttendanceRepositoryImpl(dao, api, prefs)
        every { prefs.getTenantId() } returns "tenant-school-main"
    }

    @Test
    fun `recordAttendance should create and insert pending event with UUID`() = runTest {
        // Act
        val event = repository.recordAttendance(
            studentId = "student-100",
            serviceId = "service-200",
            eventType = AttendanceType.PICKED_UP
        )

        // Assert
        assertNotNull(event.clientGeneratedId)
        assertEquals("tenant-school-main", event.tenantId)
        assertEquals("student-100", event.studentId)
        assertEquals("service-200", event.serviceId)
        assertEquals(AttendanceType.PICKED_UP, event.eventType)
        assertEquals(SyncStatus.PENDING, event.syncStatus)

        coVerify { dao.insertEvent(event) }
    }
}
