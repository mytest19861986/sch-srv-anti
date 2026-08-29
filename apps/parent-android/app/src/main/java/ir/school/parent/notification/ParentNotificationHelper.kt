package ir.school.parent.notification

import android.content.Context

/**
 * مدیریت دریافت آنی و نمایش نوتیفیکیشن‌های سوار/پیاده‌شدن فرزند
 */
class ParentNotificationHelper(private val context: Context) {

    fun parseFCMMessage(payload: Map<String, String>): StudentAttendanceNotification? {
        val studentName = payload["student_name"] ?: return null
        val eventType = payload["event_type"] ?: return null
        val timestamp = payload["timestamp"] ?: return null
        val driverName = payload["driver_name"] ?: "راننده سرویس"

        val persianEvent = when (eventType) {
            "BOARDED", "PICKED_UP" -> "سوار سرویس شد"
            "DROPPED_OFF" -> "به مقصد رسید و پیاده شد"
            "ABSENT" -> "غیبت ثبت شد"
            else -> "تغییر وضعیت سرویس"
        }

        return StudentAttendanceNotification(
            title = "وضعیت سرویس دانش‌آموز: $studentName",
            message = "$studentName در ساعت $timestamp $persianEvent (راننده: $driverName)",
            studentName = studentName,
            eventType = eventType
        )
    }
}

data class StudentAttendanceNotification(
    val title: String,
    val message: String,
    val studentName: String,
    val eventType: String
)
