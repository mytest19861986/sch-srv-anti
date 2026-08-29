package ir.school.parent.data.repository

import ir.school.parent.data.local.EncryptedPreferencesManager
import ir.school.parent.data.messaging.TokenManager
import ir.school.parent.data.remote.ParentApiService
import ir.school.parent.data.remote.dto.ParentLoginRequest
import ir.school.parent.domain.model.ChildLiveStatus
import ir.school.parent.domain.model.ChildModel
import ir.school.parent.domain.model.ChildState
import ir.school.parent.domain.model.TimelineEvent
import ir.school.parent.domain.repository.ParentRepository
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ParentRepositoryImpl @Inject constructor(
    private val api: ParentApiService,
    private val prefs: EncryptedPreferencesManager,
    private val tokenManager: TokenManager
) : ParentRepository {

    override suspend fun login(email: String, password: String): Result<Unit> {
        return try {
            val response = api.login(ParentLoginRequest(email, password))
            if (response.isSuccessful) {
                val body = response.body()
                if (body != null) {
                    try {
                        val token = body.accessToken ?: ""
                        val tenantId = body.tenantId ?: body.user?.tenantId ?: ""
                        prefs.saveToken(token)
                        prefs.saveTenantId(tenantId)

                        // Trigger token sync if FCM token was already generated
                        tokenManager.syncPendingTokenIfNeeded()
                        Result.success(Unit)
                    } catch (pe: Exception) {
                        Result.failure(Exception("خطا در پردازش پاسخ سرور: ${pe.message}"))
                    }
                } else {
                    Result.failure(Exception("خطا در پردازش پاسخ سرور (پاسخ خالی)"))
                }
            } else {
                val errCode = response.code()
                if (errCode == 401 || errCode == 400) {
                    Result.failure(Exception("INVALID_CREDENTIALS"))
                } else {
                    Result.failure(Exception("HTTP $errCode: ${response.message()}"))
                }
            }
        } catch (e: java.io.IOException) {
            Result.failure(Exception("خطا در برقراری ارتباط با سرور: ${e.message}"))
        } catch (e: Exception) {
            Result.failure(Exception("خطای غیرمنتظره: ${e.message}"))
        }
    }

    override suspend fun getChildren(): Result<List<ChildModel>> {
        val token = prefs.getToken() ?: return Result.failure(IllegalStateException("UNAUTHENTICATED"))
        return try {
            val response = api.getChildren("Bearer $token")
            if (response.isSuccessful && response.body() != null) {
                val list = response.body()!!.children.map {
                    ChildModel(
                        childId = it.childId,
                        firstName = it.firstName,
                        lastName = it.lastName,
                        grade = it.grade,
                        schoolName = it.schoolName,
                        serviceName = it.serviceName,
                        driverName = it.driverName
                    )
                }
                Result.success(list)
            } else {
                val code = response.code()
                val errorDetails = response.errorBody()?.string() ?: response.message()
                Result.failure(Exception("خطای HTTP $code در دریافت اطلاعات فرزندان:\nمسیر: api/v1/parent/children\nعلت: $errorDetails"))
            }
        } catch (e: Exception) {
            Result.failure(Exception("خطا در برقراری ارتباط با لیست فرزندان:\n${e.javaClass.simpleName}: ${e.message}"))
        }
    }

    override suspend fun getChildLiveStatus(childId: String): Result<ChildLiveStatus> {
        val token = prefs.getToken() ?: return Result.failure(IllegalStateException("UNAUTHENTICATED"))
        return try {
            val response = api.getChildLiveStatus("Bearer $token", childId)
            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!
                val status = ChildLiveStatus(
                    childId = body.childId,
                    studentName = body.studentName,
                    state = when (body.status.uppercase()) {
                        "BOARDED", "PICKED_UP", "IN_TRANSIT" -> ChildState.BOARDED
                        "ALIGHTED", "DROPPED_OFF", "AT_SCHOOL" -> ChildState.ALIGHTED
                        "ABSENT" -> ChildState.ABSENT
                        else -> ChildState.PENDING
                    },
                    driverLatitude = body.driverLat,
                    driverLongitude = body.driverLng,
                    lastEventTime = body.lastEventTime,
                    serviceName = body.serviceName,
                    driverName = body.driverName
                )
                Result.success(status)
            } else {
                val code = response.code()
                val errorDetails = response.errorBody()?.string() ?: response.message()
                Result.failure(Exception("خطای HTTP $code در رهگیری وضعیت فرزند:\nمسیر: api/v1/parent/children/$childId/status\nعلت: $errorDetails"))
            }
        } catch (e: Exception) {
            Result.failure(Exception("خطا در برقراری ارتباط با سرور وضعیت:\n${e.javaClass.simpleName}: ${e.message}"))
        }
    }

    override suspend fun getTimeline(childId: String): Result<List<TimelineEvent>> {
        val token = prefs.getToken() ?: return Result.failure(IllegalStateException("UNAUTHENTICATED"))
        return try {
            val response = api.getTimeline("Bearer $token", childId)
            if (response.isSuccessful && response.body() != null) {
                val rawEvents = response.body()!!.events ?: emptyList()
                val events = rawEvents.map {
                    TimelineEvent(
                        eventId = it.eventId ?: "",
                        childId = childId,
                        eventType = it.eventType ?: "",
                        timestamp = it.timestamp ?: "",
                        description = it.description ?: ""
                    )
                }
                Result.success(events)
            } else {
                val code = response.code()
                val errorDetails = response.errorBody()?.string() ?: response.message()
                Result.failure(Exception("خطای HTTP $code در دریافت تایملاین:\nمسیر: api/v1/parent/children/$childId/timeline\nعلت: $errorDetails"))
            }
        } catch (e: Exception) {
            Result.failure(Exception("خطا در برقراری ارتباط با سرور تایملاین:\n${e.javaClass.simpleName}: ${e.message}"))
        }
    }

    override fun isUserLoggedIn(): Boolean {
        return prefs.getToken() != null
    }

    override fun logout() {
        prefs.clearAuth()
    }
}
