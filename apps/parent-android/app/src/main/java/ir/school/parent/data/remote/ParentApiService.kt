package ir.school.parent.data.remote

import ir.school.parent.data.remote.dto.*
import retrofit2.Response
import retrofit2.http.*

interface ParentApiService {

    @POST("api/v1/auth/login")
    suspend fun login(
        @Body request: ParentLoginRequest
    ): Response<ParentLoginResponse>

    @GET("api/v1/parent/children")
    suspend fun getChildren(
        @Header("Authorization") token: String
    ): Response<ChildrenResponseDto>

    @GET("api/v1/parent/children/{id}/status")
    suspend fun getChildStatus(
        @Header("Authorization") token: String,
        @Path("id") childId: String
    ): Response<ChildStatusResponseDto>

    @GET("api/v1/parent/children/{id}/timeline")
    suspend fun getChildTimeline(
        @Header("Authorization") token: String,
        @Path("id") childId: String,
        @Query("date") date: String? = null
    ): Response<TimelineResponseDto>

    @POST("api/v1/parent/devices/register")
    suspend fun registerDeviceToken(
        @Header("Authorization") token: String,
        @Body request: DeviceRegisterRequest
    ): Response<DeviceRegisterResponse>
}
