package ir.school.parent.data.remote.dto

import com.google.gson.annotations.SerializedName

data class ParentLoginRequest(
    @SerializedName("email") val email: String,
    @SerializedName("password") val password: String
)

data class ParentLoginResponse(
    @SerializedName(value = "accessToken", alternate = ["access_token", "token"]) val accessToken: String? = null,
    @SerializedName(value = "tenantId", alternate = ["tenant_id"]) val tenantId: String? = null,
    @SerializedName("user") val user: ParentUserDto? = null
)

data class ParentUserDto(
    @SerializedName("id") val id: String? = null,
    @SerializedName("email") val email: String? = null,
    @SerializedName(value = "fullName", alternate = ["full_name"]) val fullName: String? = null,
    @SerializedName("role") val role: String? = null,
    @SerializedName(value = "tenantId", alternate = ["tenant_id"]) val tenantId: String? = null
)
