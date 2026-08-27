package ir.school.driver.di

import android.content.Context
import androidx.room.Room
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import ir.school.driver.data.local.AttendanceEventDao
import ir.school.driver.data.local.DriverDatabase
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideDriverDatabase(@ApplicationContext context: Context): DriverDatabase {
        return Room.databaseBuilder(
            context,
            DriverDatabase::class.java,
            "driver_attendance.db"
        ).fallbackToDestructiveMigration().build()
    }

    @Provides
    fun provideAttendanceEventDao(database: DriverDatabase): AttendanceEventDao {
        return database.attendanceEventDao()
    }
}
