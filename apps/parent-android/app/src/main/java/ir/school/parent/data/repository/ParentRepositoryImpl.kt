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
            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!
                prefs.saveToken(body.accessToken)
                prefs.saveTenantId(body.user.tenantId)

                // Trigger token sync if FCM token was already generated
                tokenManager.syncPendingTokenIfNeeded()
                Result.success(Unit)
            } else {
                Result.failure(Exception("INVALID_CREDENTIALS"))
            }
        } catch (e: Exception) {
            Result.failure(e)
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
                Result.failure(Exception("HTTP ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getChildStatus(childId: String): Result<ChildLiveStatus> {
        val token = prefs.getToken() ?: return Result.failure(IllegalStateException("UNAUTHENTICATED"))
        return try {
            val response = api.getChildStatus("Bearer $token", childId)
            if (response.isSuccessful && response.body() != null) {
                val s = response.body()!!.status
                val stateEnum = when (s.state.uppercase()) {
                    "IN_SCHOOL" -> ChildState.IN_SCHOOL
                    "PICKED_UP" -> ChildState.PICKED_UP
                    "DROPPED_OFF" -> ChildState.DROPPED_OFF
                    "ABSENT" -> ChildState.ABSENT
                    else -> ChildState.UNKNOWN
                }
                Result.success(
                    ChildLiveStatus(
                        childId = s.childId,
                        state = stateEnum,
                        lastUpdated = s.lastUpdated,
                        driverName = s.driverName,
                        serviceName = s.serviceName,
                        etaMinutes = s.etaMinutes
                    )
                )
            } else {
                Result.failure(Exception("HTTP ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getChildTimeline(childId: String, date: String?): Result<List<TimelineEvent>> {
        val token = prefs.getToken() ?: return Result.failure(IllegalStateException("UNAUTHENTICATED"))
        return try {
            val response = api.getChildTimeline("Bearer $token", childId, date)
            if (response.isSuccessful && response.body() != null) {
                val events = response.body()!!.events.map {
                    TimelineEvent(
                        eventId = it.eventId,
                        eventType = it.eventType,
                        timestamp = it.timestamp,
                        title = it.title,
                        description = it.description,
                        driverName = it.driverName
                    )
                }
                Result.success(events)
            } else {
                Result.failure(Exception("HTTP ${response.code()}"))
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
