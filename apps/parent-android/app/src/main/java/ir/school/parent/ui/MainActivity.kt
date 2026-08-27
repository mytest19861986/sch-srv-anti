package ir.school.parent.ui

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.navigation.compose.rememberNavController
import dagger.hilt.android.AndroidEntryPoint
import ir.school.parent.domain.repository.ParentRepository
import ir.school.parent.ui.navigation.AppNavHost
import ir.school.parent.ui.navigation.Screen
import ir.school.parent.ui.theme.ParentAppTheme
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject
    lateinit var repository: ParentRepository

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            ParentAppTheme {
                val navController = rememberNavController()
                val startDest = if (repository.isUserLoggedIn()) Screen.Home.route else Screen.Login.route
                AppNavHost(navController = navController, startDestination = startDest)
            }
        }
    }
}
