package ir.school.parent.data.remote.dto

import com.google.gson.annotations.SerializedName

data class ChildStatusResponseDto(
    @SerializedName("success") val success: Boolean,
    @SerializedName("status") val status: ChildStatusDetailsDto
)

data class ChildStatusDetailsDto(
    @SerializedName("child_id") val childId: String,
    @SerializedName("state") val state: String, // IN_SCHOOL, PICKED_UP, DROPPED_OFF, ABSENT
    @SerializedName("last_updated") val lastUpdated: String,
    @SerializedName("driver_name") val driverName: String,
    @SerializedName("service_name") val serviceName: String,
    @SerializedName("eta_minutes") val etaMinutes: Int? = null
)
