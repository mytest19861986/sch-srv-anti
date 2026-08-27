package ir.school.driver.data.local

import androidx.room.Database
import androidx.room.RoomDatabase

@Database(
    entities = [LocalAttendanceEvent::class],
    version = 1,
    exportSchema = false
)
abstract class DriverDatabase : RoomDatabase() {
    abstract fun attendanceEventDao(): AttendanceEventDao
}
