package ir.school.driver.data.remote

import ir.school.driver.data.remote.dto.*
import retrofit2.Response
import retrofit2.http.*

interface DriverApiService {

    @POST("api/v1/auth/login")
    suspend fun login(
        @Body request: LoginRequest
    ): Response<LoginResponse>

    @GET("api/v1/attendance/manifest")
    suspend fun getManifest(
        @Header("Authorization") token: String,
        @Query("shift_id") shiftId: String? = null
    ): Response<ManifestResponseDto>

    @POST("api/v1/attendance/events")
    suspend fun recordAttendanceEvent(
        @Header("Authorization") token: String,
        @Body request: AttendanceEventRequestDto
    ): Response<AttendanceEventResponseDto>

    @POST("api/v1/sync/batch")
    suspend fun syncBatch(
        @Header("Authorization") token: String,
        @Body request: SyncBatchRequest
    ): Response<SyncBatchResponse>
}
