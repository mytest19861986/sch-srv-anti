package ir.school.parent

import android.app.Application
import dagger.hilt.android.HiltAndroidApp
import ir.school.parent.data.messaging.TokenManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltAndroidApp
class ParentApplication : Application() {

    @Inject
    lateinit var tokenManager: TokenManager

    override fun onCreate() {
        super.onCreate()
        CoroutineScope(Dispatchers.IO).launch {
            tokenManager.syncPendingTokenIfNeeded()
        }
    }
}
