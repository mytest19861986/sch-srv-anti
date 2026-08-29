package ir.school.driver.data.remote.dto

import com.google.gson.annotations.SerializedName

data class AttendanceEventRequestDto(
    @SerializedName("client_generated_id") val clientGeneratedId: String,
    @SerializedName("student_id") val studentId: String,
    @SerializedName("service_id") val serviceId: String,
    @SerializedName("event_type") val eventType: String,
    @SerializedName("client_timestamp") val clientTimestamp: String
)

data class AttendanceEventResponseDto(
    @SerializedName("success") val success: Boolean,
    @SerializedName("event_id") val eventId: String? = null,
    @SerializedName("client_generated_id") val clientGeneratedId: String? = null,
    @SerializedName("is_idempotent_replay") val isIdempotentReplay: Boolean = false
)
