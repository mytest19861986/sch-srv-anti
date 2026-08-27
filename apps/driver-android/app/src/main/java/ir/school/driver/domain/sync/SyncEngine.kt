package ir.school.driver.domain.sync

import ir.school.driver.data.local.AttendanceEventDao
import ir.school.driver.data.local.EncryptedPreferencesManager
import ir.school.driver.data.local.SyncStatus
import ir.school.driver.data.remote.DriverApiService
import ir.school.driver.data.remote.dto.SyncBatchRequest
import ir.school.driver.data.remote.dto.SyncEventItemDto
import ir.school.driver.domain.model.SyncBatchResult
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SyncEngine @Inject constructor(
    private val attendanceDao: AttendanceEventDao,
    private val apiService: DriverApiService,
    private val prefs: EncryptedPreferencesManager
) {

    suspend fun syncPendingEvents(batchSize: Int = 200): SyncBatchResult {
        val token = prefs.getToken() ?: return SyncBatchResult(0, 0, 0, 0)
        val pendingEvents = attendanceDao.getPendingEvents(batchSize)
        if (pendingEvents.isEmpty()) {
            return SyncBatchResult(0, 0, 0, 0)
        }

        val eventIds = pendingEvents.map { it.clientGeneratedId }
        attendanceDao.updateSyncStatus(eventIds, SyncStatus.SYNCING)

        val batchRequest = SyncBatchRequest(
            deviceId = "android-driver-handset",
            batchId = "bch-${UUID.randomUUID()}",
            events = pendingEvents.map {
                SyncEventItemDto(
                    studentId = it.studentId,
                    serviceId = it.serviceId,
                    eventType = it.eventType.name,
                    clientGeneratedId = it.clientGeneratedId,
                    clientTimestamp = it.clientTimestamp
                )
            }
        )

        try {
            val response = apiService.syncBatch("Bearer $token", batchRequest)

            if (response.code() == 401) {
                prefs.clearAuth()
                attendanceDao.updateSyncStatus(eventIds, SyncStatus.PENDING)
                throw IllegalStateException("UNAUTHORIZED_401")
            }

            if (!response.isSuccessful || response.body() == null) {
                val errorMsg = response.errorBody()?.string() ?: "HTTP ${response.code()}"
                for (id in eventIds) {
                    attendanceDao.markFailed(id, errorMsg)
                }
                return SyncBatchResult(
                    processedCount = pendingEvents.size,
                    successCount = 0,
                    conflictCount = 0,
                    failedCount = pendingEvents.size
                )
            }

            val syncResponse = response.body()!!
            var success = 0
            var conflicts = 0
            var failed = 0

            for (res in syncResponse.results) {
                when (res.status.lowercase()) {
                    "created", "duplicate" -> {
                        attendanceDao.markSynced(res.clientGeneratedId, res.eventId)
                        success++
                    }
                    "conflict" -> {
                        attendanceDao.markConflict(res.clientGeneratedId, res.errorMessage ?: "State Machine Conflict (409)")
                        conflicts++
                    }
                    else -> {
                        attendanceDao.markFailed(res.clientGeneratedId, res.errorMessage ?: "Unknown error")
                        failed++
                    }
                }
            }

            return SyncBatchResult(
                processedCount = syncResponse.results.size,
                successCount = success,
                conflictCount = conflicts,
                failedCount = failed
            )
        } catch (e: Exception) {
            for (id in eventIds) {
                attendanceDao.markFailed(id, e.message ?: "Network failure")
            }
            return SyncBatchResult(
                processedCount = pendingEvents.size,
                successCount = 0,
                conflictCount = 0,
                failedCount = pendingEvents.size
            )
        }
    }
}
