package ir.school.parent.domain.model

data class ChildModel(
    val childId: String,
    val firstName: String,
    val lastName: String,
    val grade: String,
    val schoolName: String,
    val serviceName: String,
    val driverName: String
) {
    val fullName: String get() = "$firstName $lastName"
}

enum class ChildState {
    IN_SCHOOL,
    PICKED_UP,
    DROPPED_OFF,
    ABSENT,
    UNKNOWN
}

data class ChildLiveStatus(
    val childId: String,
    val state: ChildState,
    val lastUpdated: String,
    val driverName: String,
    val serviceName: String,
    val etaMinutes: Int?
)

data class TimelineEvent(
    val eventId: String,
    val eventType: String,
    val timestamp: String,
    val title: String,
    val description: String,
    val driverName: String?
)
