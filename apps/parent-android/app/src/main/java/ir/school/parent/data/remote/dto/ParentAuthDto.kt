package ir.school.parent.data.remote.dto

import com.google.gson.annotations.SerializedName

data class ParentLoginRequest(
    @SerializedName("email") val email: String,
    @SerializedName("password") val password: String
)

data class ParentLoginResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("access_token") val accessToken: String,
    @SerializedName("expires_in") val expiresIn: Long,
    @SerializedName("user") val user: ParentUserDto
)

data class ParentUserDto(
    @SerializedName("id") val id: String,
    @SerializedName("email") val email: String,
    @SerializedName("full_name") val fullName: String,
    @SerializedName("role") val role: String,
    @SerializedName("tenant_id") val tenantId: String
)
