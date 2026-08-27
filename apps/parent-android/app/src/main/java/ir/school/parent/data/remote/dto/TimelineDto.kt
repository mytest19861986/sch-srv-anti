package ir.school.parent.data.remote.dto

import com.google.gson.annotations.SerializedName

data class TimelineResponseDto(
    @SerializedName("success") val success: Boolean,
    @SerializedName("events") val events: List<TimelineItemDto>
)

data class TimelineItemDto(
    @SerializedName("event_id") val eventId: String,
    @SerializedName("event_type") val eventType: String,
    @SerializedName("timestamp") val timestamp: String,
    @SerializedName("title") val title: String,
    @SerializedName("description") val description: String,
    @SerializedName("driver_name") val driverName: String? = null
)

data class DeviceRegisterRequest(
    @SerializedName("token") val token: String,
    @SerializedName("platform") val platform: String = "ANDROID"
)

data class DeviceRegisterResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("message") val message: String
)
