package ir.school.driver.data.remote.dto

import com.google.gson.annotations.SerializedName

data class ManifestResponseDto(
    @SerializedName("success") val success: Boolean,
    @SerializedName("tenant_id") val tenantId: String,
    @SerializedName("manifest") val manifest: DriverManifestDto
)

data class DriverManifestDto(
    @SerializedName("shift_id") val shiftId: String,
    @SerializedName("service_id") val serviceId: String,
    @SerializedName("route_name") val routeName: String,
    @SerializedName("driver_name") val driverName: String,
    @SerializedName("total_students") val totalStudents: Int,
    @SerializedName("students") val students: List<ManifestStudentItemDto>
)

data class ManifestStudentItemDto(
    @SerializedName("student_id") val studentId: String,
    @SerializedName("first_name") val firstName: String,
    @SerializedName("last_name") val lastName: String,
    @SerializedName("grade") val grade: String,
    @SerializedName("attendance_status") val attendanceStatus: String,
    @SerializedName("parent_phones") val parentPhones: List<String>
)
