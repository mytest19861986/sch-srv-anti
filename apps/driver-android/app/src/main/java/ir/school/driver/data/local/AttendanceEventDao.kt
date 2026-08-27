package ir.school.driver.data.local

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface AttendanceEventDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertEvent(event: LocalAttendanceEvent)

    @Update
    suspend fun updateEvent(event: LocalAttendanceEvent)

    @Query("SELECT * FROM local_attendance_events WHERE clientGeneratedId = :id")
    suspend fun getEventById(id: String): LocalAttendanceEvent?

    @Query("SELECT * FROM local_attendance_events WHERE syncStatus IN ('PENDING', 'FAILED') ORDER BY createdAt ASC LIMIT :limit")
    suspend fun getPendingEvents(limit: Int = 200): List<LocalAttendanceEvent>

    @Query("SELECT * FROM local_attendance_events WHERE studentId = :studentId ORDER BY createdAt DESC LIMIT 1")
    fun getLatestEventForStudent(studentId: String): Flow<LocalAttendanceEvent?>

    @Query("SELECT * FROM local_attendance_events ORDER BY createdAt DESC")
    fun getAllEventsFlow(): Flow<List<LocalAttendanceEvent>>

    @Query("UPDATE local_attendance_events SET syncStatus = :status WHERE clientGeneratedId IN (:ids)")
    suspend fun updateSyncStatus(ids: List<String>, status: SyncStatus)

    @Query("UPDATE local_attendance_events SET syncStatus = 'SYNCED', serverEventId = :serverId WHERE clientGeneratedId = :clientId")
    suspend fun markSynced(clientId: String, serverId: String?)

    @Query("UPDATE local_attendance_events SET syncStatus = 'CONFLICT', serverErrorMessage = :error WHERE clientGeneratedId = :clientId")
    suspend fun markConflict(clientId: String, error: String)

    @Query("UPDATE local_attendance_events SET syncStatus = 'FAILED', retryCount = retryCount + 1, serverErrorMessage = :error WHERE clientGeneratedId = :clientId")
    suspend fun markFailed(clientId: String, error: String)
}
