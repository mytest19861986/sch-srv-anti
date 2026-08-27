package ir.school.driver

import android.app.Application
import androidx.hilt.work.HiltWorkerFactory
import androidx.work.Configuration
import androidx.work.WorkManager
import dagger.hilt.android.HiltAndroidApp
import ir.school.driver.domain.sync.AttendanceSyncWorker
import javax.inject.Inject

@HiltAndroidApp
class DriverApplication : Application(), Configuration.Provider {

    @Inject
    lateinit var workerFactory: HiltWorkerFactory

    override val workManagerConfiguration: Configuration
        get() = Configuration.Builder()
            .setWorkerFactory(workerFactory)
            .build()

    override fun onCreate() {
        super.onCreate()
        AttendanceSyncWorker.schedulePeriodic(WorkManager.getInstance(this))
    }
}
