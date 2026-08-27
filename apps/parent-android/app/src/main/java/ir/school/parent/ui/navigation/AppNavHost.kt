package ir.school.parent.ui.navigation

import androidx.compose.runtime.Composable
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import androidx.navigation.navDeepLink
import ir.school.parent.ui.home.HomeScreen
import ir.school.parent.ui.home.HomeViewModel
import ir.school.parent.ui.login.LoginScreen
import ir.school.parent.ui.login.LoginViewModel
import ir.school.parent.ui.timeline.TimelineScreen
import ir.school.parent.ui.timeline.TimelineViewModel

@Composable
fun AppNavHost(
    navController: NavHostController,
    startDestination: String = Screen.Home.route
) {
    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        composable(Screen.Login.route) {
            val viewModel = hiltViewModel<LoginViewModel>()
            LoginScreen(
                viewModel = viewModel,
                onLoginSuccess = {
                    navController.navigate(Screen.Home.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                }
            )
        }

        composable(
            route = Screen.Home.route,
            deepLinks = listOf(navDeepLink { uriPattern = "schapp://parent/home" })
        ) {
            val viewModel = hiltViewModel<HomeViewModel>()
            HomeScreen(
                viewModel = viewModel,
                onNavigateTimeline = { childId ->
                    navController.navigate(Screen.ChildTimeline.createRoute(childId))
                }
            )
        }

        composable(
            route = Screen.ChildStatus.route,
            arguments = listOf(navArgument("childId") { type = NavType.StringType }),
            deepLinks = listOf(navDeepLink { uriPattern = "schapp://parent/child/{childId}/status" })
        ) {
            val viewModel = hiltViewModel<HomeViewModel>()
            HomeScreen(
                viewModel = viewModel,
                onNavigateTimeline = { childId ->
                    navController.navigate(Screen.ChildTimeline.createRoute(childId))
                }
            )
        }

        composable(
            route = Screen.ChildTimeline.route,
            arguments = listOf(navArgument("childId") { type = NavType.StringType }),
            deepLinks = listOf(navDeepLink { uriPattern = "schapp://parent/child/{childId}/timeline" })
        ) {
            val viewModel = hiltViewModel<TimelineViewModel>()
            TimelineScreen(
                viewModel = viewModel,
                onBack = { navController.popBackStack() }
            )
        }
    }
}
