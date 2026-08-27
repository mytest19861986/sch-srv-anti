package ir.school.parent.ui.navigation

sealed class Screen(val route: String) {
    object Login : Screen("login")
    object Home : Screen("home")
    object ChildStatus : Screen("child_status/{childId}") {
        fun createRoute(childId: String) = "child_status/$childId"
    }
    object ChildTimeline : Screen("child_timeline/{childId}") {
        fun createRoute(childId: String) = "child_timeline/$childId"
    }
}
