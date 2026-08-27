package ir.school.driver.ui

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.runtime.*
import dagger.hilt.android.AndroidEntryPoint
import ir.school.driver.domain.repository.AttendanceRepository
import ir.school.driver.ui.login.LoginScreen
import ir.school.driver.ui.login.LoginViewModel
import ir.school.driver.ui.manifest.ManifestScreen
import ir.school.driver.ui.manifest.ManifestViewModel
import ir.school.driver.ui.theme.DriverAppTheme
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject
    lateinit var repository: AttendanceRepository

    private val loginViewModel: LoginViewModel by viewModels()
    private val manifestViewModel: ManifestViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            DriverAppTheme {
                var isLoggedIn by remember { mutableStateOf(repository.isUserLoggedIn()) }

                if (isLoggedIn) {
                    ManifestScreen(viewModel = manifestViewModel)
                } else {
                    LoginScreen(
                        viewModel = loginViewModel,
                        onLoginSuccess = { isLoggedIn = true }
                    )
                }
            }
        }
    }
}
