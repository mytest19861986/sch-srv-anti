package ir.school.parent.data.remote.dto

import com.google.gson.annotations.SerializedName

data class ChildrenResponseDto(
    @SerializedName("success") val success: Boolean,
    @SerializedName("tenant_id") val tenantId: String,
    @SerializedName("children") val children: List<ChildItemDto>
)

data class ChildItemDto(
    @SerializedName("child_id") val childId: String,
    @SerializedName("first_name") val firstName: String,
    @SerializedName("last_name") val lastName: String,
    @SerializedName("grade") val grade: String,
    @SerializedName("school_name") val schoolName: String,
    @SerializedName("service_name") val serviceName: String,
    @SerializedName("driver_name") val driverName: String
)
