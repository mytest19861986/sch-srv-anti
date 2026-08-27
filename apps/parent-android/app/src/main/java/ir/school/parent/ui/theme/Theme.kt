package ir.school.parent.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection

private val DarkColorScheme = darkColorScheme(
    primary = ParentPrimaryGreen,
    secondary = ParentSecondaryBlue,
    tertiary = CalmAmber,
    background = ParentBackground,
    surface = ParentSurfaceDark,
    error = SoftError,
    onPrimary = ParentTextPrimary,
    onBackground = ParentTextPrimary,
    onSurface = ParentTextPrimary
)

@Composable
fun ParentAppTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
        MaterialTheme(
            colorScheme = DarkColorScheme,
            content = content
        )
    }
}
