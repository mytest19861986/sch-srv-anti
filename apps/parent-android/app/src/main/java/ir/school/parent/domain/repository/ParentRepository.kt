package ir.school.parent.domain.repository

import ir.school.parent.domain.model.ChildLiveStatus
import ir.school.parent.domain.model.ChildModel
import ir.school.parent.domain.model.TimelineEvent

interface ParentRepository {
    suspend fun login(email: String, password: String): Result<Unit>
    suspend fun getChildren(): Result<List<ChildModel>>
    suspend fun getChildStatus(childId: String): Result<ChildLiveStatus>
    suspend fun getChildTimeline(childId: String, date: String? = null): Result<List<TimelineEvent>>
    fun isUserLoggedIn(): Boolean
    fun logout()
}
