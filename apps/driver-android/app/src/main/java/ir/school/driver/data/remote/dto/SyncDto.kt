package ir.school.driver.data.remote.dto

import com.google.gson.annotations.SerializedName

data class SyncBatchRequest(
    @SerializedName("device_id") val deviceId: String,
    @SerializedName("batch_id") val batchId: String,
    @SerializedName("events") val events: List<SyncEventItemDto>
)

data class SyncEventItemDto(
    @SerializedName("student_id") val studentId: String,
    @SerializedName("service_id") val serviceId: String,
    @SerializedName("event_type") val eventType: String,
    @SerializedName("client_generated_id") val clientGeneratedId: String,
    @SerializedName("client_timestamp") val clientTimestamp: String
)

data class SyncBatchResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("summary") val summary: SyncSummaryDto,
    @SerializedName("results") val results: List<SyncItemResultDto>
)

data class SyncSummaryDto(
    @SerializedName("total_received") val totalReceived: Int,
    @SerializedName("created_count") val createdCount: Int,
    @SerializedName("duplicate_count") val duplicateCount: Int,
    @SerializedName("conflict_count") val conflictCount: Int,
    @SerializedName("error_count") val errorCount: Int
)

data class SyncItemResultDto(
    @SerializedName("client_generated_id") val clientGeneratedId: String,
    @SerializedName("status") val status: String, // 'created', 'duplicate', 'conflict', 'error'
    @SerializedName("event_id") val eventId: String? = null,
    @SerializedName("error_message") val errorMessage: String? = null
)
