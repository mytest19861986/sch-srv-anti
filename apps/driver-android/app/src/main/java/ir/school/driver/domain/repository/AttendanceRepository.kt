package ir.school.driver.domain.repository

import ir.school.driver.data.local.AttendanceType
import ir.school.driver.data.local.LocalAttendanceEvent
import ir.school.driver.domain.model.DriverManifest
import kotlinx.coroutines.flow.Flow

interface AttendanceRepository {
    suspend fun recordAttendance(
        studentId: String,
        serviceId: String,
        eventType: AttendanceType
    ): LocalAttendanceEvent

    fun getLocalEventsFlow(): Flow<List<LocalAttendanceEvent>>

    suspend fun fetchManifest(shiftId: String): Result<DriverManifest>

    suspend fun login(email: String, password: String): Result<Unit>

    fun isUserLoggedIn(): Boolean

    fun logout()
}
