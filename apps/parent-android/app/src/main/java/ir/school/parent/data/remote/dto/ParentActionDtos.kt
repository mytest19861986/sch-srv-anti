package ir.school.parent.data.remote.dto

import com.google.gson.annotations.SerializedName

data class DeviceRegisterRequest(
    @SerializedName("token") val token: String,
    @SerializedName("platform") val platform: String = "ANDROID"
)

data class DeviceRegisterResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("device_id") val deviceId: String? = null,
    @SerializedName("parent_id") val parentId: String? = null,
    @SerializedName("platform") val platform: String? = null,
    @SerializedName("registered_at") val registeredAt: String? = null
)

data class AbsenceReportRequestDto(
    @SerializedName("child_id") val childId: String,
    @SerializedName("date") val date: String? = null,
    @SerializedName("reason") val reason: String? = null
)

data class AbsenceReportResponseDto(
    @SerializedName("success") val success: Boolean,
    @SerializedName("message") val message: String? = null,
    @SerializedName("child_id") val childId: String? = null,
    @SerializedName("status") val status: String? = null
)
