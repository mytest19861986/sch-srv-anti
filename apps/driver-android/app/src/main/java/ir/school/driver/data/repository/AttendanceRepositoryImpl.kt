package ir.school.driver.data.repository

import ir.school.driver.data.local.*
import ir.school.driver.data.remote.DriverApiService
import ir.school.driver.data.remote.dto.LoginRequest
import ir.school.driver.domain.model.DriverManifest
import ir.school.driver.domain.model.StudentManifestItem
import ir.school.driver.domain.repository.AttendanceRepository
import kotlinx.coroutines.flow.Flow
import java.time.Instant
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AttendanceRepositoryImpl @Inject constructor(
    private val dao: AttendanceEventDao,
    private val api: DriverApiService,
    private val prefs: EncryptedPreferencesManager
) : AttendanceRepository {

    override suspend fun recordAttendance(
        studentId: String,
        serviceId: String,
        eventType: AttendanceType
    ): LocalAttendanceEvent {
        val tenantId = prefs.getTenantId() ?: "default-tenant"
        val clientGeneratedId = UUID.randomUUID().toString()
        val timestamp = Instant.now().toString()

        val event = LocalAttendanceEvent(
            clientGeneratedId = clientGeneratedId,
            tenantId = tenantId,
            studentId = studentId,
            serviceId = serviceId,
            eventType = eventType,
            clientTimestamp = timestamp,
            syncStatus = SyncStatus.PENDING
        )

        dao.insertEvent(event)
        return event
    }

    override fun getLocalEventsFlow(): Flow<List<LocalAttendanceEvent>> {
        return dao.getAllEventsFlow()
    }

    override suspend fun fetchManifest(shiftId: String): Result<DriverManifest> {
        val token = prefs.getToken() ?: return Result.failure(IllegalStateException("UNAUTHENTICATED"))
        return try {
            val response = api.getManifest("Bearer $token", shiftId)
            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!.manifest
                val manifest = DriverManifest(
                    shiftId = body.shiftId,
                    serviceId = body.serviceId,
                    routeName = body.routeName,
                    driverName = body.driverName,
                    totalStudents = body.totalStudents,
                    students = body.students.map {
                        StudentManifestItem(
                            studentId = it.studentId,
                            firstName = it.firstName,
                            lastName = it.lastName,
                            grade = it.grade,
                            rawServerStatus = it.attendanceStatus,
                            parentPhones = it.parentPhones
                        )
                    }
                )
                Result.success(manifest)
            } else {
                Result.failure(Exception("HTTP ${response.code()}: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun login(email: String, password: String): Result<Unit> {
        return try {
            val response = api.login(LoginRequest(email, password))
            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!
                prefs.saveToken(body.accessToken)
                prefs.saveTenantId(body.user.tenantId)
                Result.success(Unit)
            } else {
                Result.failure(Exception("INVALID_CREDENTIALS"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override fun isUserLoggedIn(): Boolean {
        return prefs.getToken() != null
    }

    override fun logout() {
        prefs.clearAuth()
    }
}
