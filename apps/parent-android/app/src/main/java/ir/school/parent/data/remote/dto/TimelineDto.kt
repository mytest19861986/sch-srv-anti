package ir.school.parent.data.remote.dto

import com.google.gson.annotations.SerializedName

data class TimelineResponseDto(
    @SerializedName("success") val success: Boolean,
    @SerializedName(value = "events", alternate = ["timeline"]) val events: List<TimelineItemDto>? = null
)

data class TimelineItemDto(
    @SerializedName(value = "eventId", alternate = ["event_id", "id"]) val eventId: String? = null,
    @SerializedName(value = "eventType", alternate = ["event_type"]) val eventType: String? = null,
    @SerializedName(value = "timestamp", alternate = ["client_timestamp", "server_timestamp"]) val timestamp: String? = null,
    @SerializedName("title") val title: String? = null,
    @SerializedName("description") val description: String? = null,
    @SerializedName(value = "driverName", alternate = ["driver_name"]) val driverName: String? = null
)
