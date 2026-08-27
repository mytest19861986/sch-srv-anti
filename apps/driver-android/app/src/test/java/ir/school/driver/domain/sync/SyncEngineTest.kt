package ir.school.driver.domain.sync

import io.mockk.*
import ir.school.driver.data.local.*
import ir.school.driver.data.remote.DriverApiService
import ir.school.driver.data.remote.dto.*
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Test
import retrofit2.Response

class SyncEngineTest {

    private val dao: AttendanceEventDao = mockk(relaxed = true)
    private val api: DriverApiService = mockk(relaxed = true)
    private val prefs: EncryptedPreferencesManager = mockk(relaxed = true)
    private lateinit var syncEngine: SyncEngine

    @Before
    fun setup() {
        syncEngine = SyncEngine(dao, api, prefs)
        every { prefs.getToken() } returns "valid-jwt-token"
    }

    @Test
    fun `syncPendingEvents should handle partial success correctly`() = runTest {
        // Arrange
        val event1 = LocalAttendanceEvent(
            clientGeneratedId = "uuid-1",
            tenantId = "tenant-1",
            studentId = "student-1",
            serviceId = "service-1",
            eventType = AttendanceType.PICKED_UP,
            clientTimestamp = "2026-08-27T07:00:00Z"
        )
        val event2 = LocalAttendanceEvent(
            clientGeneratedId = "uuid-2",
            tenantId = "tenant-1",
            studentId = "student-2",
            serviceId = "service-1",
            eventType = AttendanceType.DROPPED_OFF,
            clientTimestamp = "2026-08-27T07:30:00Z"
        )
        val event3 = LocalAttendanceEvent(
            clientGeneratedId = "uuid-3",
            tenantId = "tenant-1",
            studentId = "student-3",
            serviceId = "service-1",
            eventType = AttendanceType.ABSENT,
            clientTimestamp = "2026-08-27T07:00:00Z"
        )

        coEvery { dao.getPendingEvents(200) } returns listOf(event1, event2, event3)

        val serverResponse = SyncBatchResponse(
            success = true,
            summary = SyncSummaryDto(
                totalReceived = 3,
                createdCount = 1,
                duplicateCount = 1,
                conflictCount = 1,
                errorCount = 0
            ),
            results = listOf(
                SyncItemResultDto(clientGeneratedId = "uuid-1", status = "created", eventId = "evt-1"),
                SyncItemResultDto(clientGeneratedId = "uuid-2", status = "duplicate", eventId = "evt-2"),
                SyncItemResultDto(clientGeneratedId = "uuid-3", status = "conflict", errorMessage = "Student marked ABSENT")
            )
        )

        coEvery { api.syncBatch(any(), any()) } returns Response.success(serverResponse)

        // Act
        val result = syncEngine.syncPendingEvents()

        // Assert
        assertEquals(3, result.processedCount)
        assertEquals(2, result.successCount)
        assertEquals(1, result.conflictCount)
        assertEquals(0, result.failedCount)

        coVerify { dao.markSynced("uuid-1", "evt-1") }
        coVerify { dao.markSynced("uuid-2", "evt-2") }
        coVerify { dao.markConflict("uuid-3", "Student marked ABSENT") }
    }

    @Test
    fun `syncPendingEvents should handle network failure and mark events failed`() = runTest {
        // Arrange
        val event1 = LocalAttendanceEvent(
            clientGeneratedId = "uuid-1",
            tenantId = "tenant-1",
            studentId = "student-1",
            serviceId = "service-1",
            eventType = AttendanceType.PICKED_UP,
            clientTimestamp = "2026-08-27T07:00:00Z"
        )

        coEvery { dao.getPendingEvents(200) } returns listOf(event1)
        coEvery { api.syncBatch(any(), any()) } throws Exception("Connection timed out")

        // Act
        val result = syncEngine.syncPendingEvents()

        // Assert
        assertEquals(1, result.processedCount)
        assertEquals(0, result.successCount)
        assertEquals(1, result.failedCount)

        coVerify { dao.markFailed("uuid-1", "Connection timed out") }
    }
}
