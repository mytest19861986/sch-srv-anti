package ir.school.driver.domain.model

import ir.school.driver.data.local.AttendanceType
import ir.school.driver.data.local.SyncStatus

data class StudentManifestItem(
    val studentId: String,
    val firstName: String,
    val lastName: String,
    val grade: String,
    val rawServerStatus: String,
    val localSyncStatus: SyncStatus? = null,
    val localEventType: AttendanceType? = null,
    val parentPhones: List<String> = emptyList()
) {
    val fullName: String get() = "$firstName $lastName"
}

data class DriverManifest(
    val shiftId: String,
    val serviceId: String,
    val routeName: String,
    val driverName: String,
    val totalStudents: Int,
    val students: List<StudentManifestItem>
)

data class SyncBatchResult(
    val processedCount: Int,
    val successCount: Int,
    val conflictCount: Int,
    val failedCount: Int
)
