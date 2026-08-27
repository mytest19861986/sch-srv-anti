package ir.school.driver.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.util.Date

enum class SyncStatus {
    PENDING,
    SYNCING,
    SYNCED,
    FAILED,
    CONFLICT
}

enum class AttendanceType {
    PICKED_UP,
    DROPPED_OFF,
    ABSENT,
    CANCELLED,
    CORRECTED
}

@Entity(tableName = "local_attendance_events")
data class LocalAttendanceEvent(
    @PrimaryKey
    val clientGeneratedId: String,
    val tenantId: String,
    val studentId: String,
    val serviceId: String,
    val eventType: AttendanceType,
    val clientTimestamp: String,
    val syncStatus: SyncStatus = SyncStatus.PENDING,
    val retryCount: Int = 0,
    val serverErrorMessage: String? = null,
    val serverEventId: String? = null,
    val createdAt: Long = System.currentTimeMillis()
)
