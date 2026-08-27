package ir.school.driver.ui.manifest

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.DirectionsBus
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ir.school.driver.R
import ir.school.driver.data.local.AttendanceType
import ir.school.driver.data.local.SyncStatus
import ir.school.driver.domain.model.StudentManifestItem
import ir.school.driver.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ManifestScreen(
    viewModel: ManifestViewModel,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()
    val isSyncing by viewModel.isSyncing.collectAsState()

    LaunchedEffect(Unit) {
        viewModel.loadManifest()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = stringResource(R.string.manifest_title),
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp
                    )
                },
                actions = {
                    IconButton(onClick = { viewModel.triggerManualSync() }) {
                        if (isSyncing) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(24.dp),
                                color = MaterialTheme.colorScheme.primary,
                                strokeWidth = 2.dp
                            )
                        } else {
                            Icon(Icons.Default.Refresh, contentDescription = stringResource(R.string.sync_now))
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = SurfaceDark,
                    titleContentColor = TextPrimary
                )
            )
        },
        containerColor = BackgroundDark,
        modifier = modifier
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            when (val state = uiState) {
                is ManifestUiState.Loading -> {
                    Column(
                        modifier = Modifier.fillMaxSize(),
                        verticalArrangement = Arrangement.Center,
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        CircularProgressIndicator(color = PrimaryGreen)
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(text = "در حال بارگذاری مانیفست...", color = TextSecondary)
                    }
                }
                is ManifestUiState.Error -> {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(24.dp),
                        verticalArrangement = Arrangement.Center,
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(Icons.Default.Warning, contentDescription = null, tint = CrimsonError, modifier = Modifier.size(48.dp))
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(text = state.message, color = CrimsonError, fontSize = 16.sp)
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(onClick = { viewModel.loadManifest() }) {
                            Text(text = "تلاش مجدد")
                        }
                    }
                }
                is ManifestUiState.Success -> {
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(horizontal = 16.dp, vertical = 8.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        item {
                            ShiftHeaderCard(
                                routeName = state.manifest.routeName,
                                driverName = state.manifest.driverName,
                                totalStudents = state.manifest.totalStudents
                            )
                        }

                        items(state.manifest.students, key = { it.studentId }) { student ->
                            StudentItemCard(
                                student = student,
                                onPickedUp = { viewModel.recordAttendance(student.studentId, state.manifest.serviceId, AttendanceType.PICKED_UP) },
                                onDroppedOff = { viewModel.recordAttendance(student.studentId, state.manifest.serviceId, AttendanceType.DROPPED_OFF) },
                                onAbsent = { viewModel.recordAttendance(student.studentId, state.manifest.serviceId, AttendanceType.ABSENT) }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ShiftHeaderCard(
    routeName: String,
    driverName: String,
    totalStudents: Int
) {
    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceDark),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column {
                Text(text = routeName, fontWeight = FontWeight.Bold, color = TextPrimary, fontSize = 16.sp)
                Spacer(modifier = Modifier.height(4.dp))
                Text(text = "راننده: $driverName", color = TextSecondary, fontSize = 14.sp)
            }
            Badge(
                containerColor = SecondaryBlue.copy(alpha = 0.2f),
                contentColor = SecondaryBlue,
                modifier = Modifier.padding(4.dp)
            ) {
                Text(text = "$totalStudents دانش‌آموز", modifier = Modifier.padding(4.dp), fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
fun StudentItemCard(
    student: StudentManifestItem,
    onPickedUp: () -> Unit,
    onDroppedOff: () -> Unit,
    onAbsent: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = CardSurface),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = student.fullName,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary,
                        fontSize = 16.sp
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = "پایه: ${student.grade}",
                        color = TextSecondary,
                        fontSize = 13.sp
                    )
                }

                StatusBadge(student.localSyncStatus, student.localEventType)
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Action Buttons
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Button(
                    onClick = onPickedUp,
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryGreen),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.weight(1f).height(46.dp)
                ) {
                    Text(text = stringResource(R.string.btn_picked_up), fontWeight = FontWeight.Bold)
                }

                Button(
                    onClick = onDroppedOff,
                    colors = ButtonDefaults.buttonColors(containerColor = SecondaryBlue),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.weight(1f).height(46.dp)
                ) {
                    Text(text = stringResource(R.string.btn_dropped_off), fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
fun StatusBadge(
    syncStatus: SyncStatus?,
    eventType: AttendanceType?
) {
    val (text, bgColor, textColor) = when (syncStatus) {
        SyncStatus.SYNCED -> Triple("همگام‌سازی شد", PrimaryGreen.copy(alpha = 0.2f), PrimaryGreen)
        SyncStatus.SYNCING -> Triple("در حال ارسال…", SecondaryBlue.copy(alpha = 0.2f), SecondaryBlue)
        SyncStatus.PENDING -> Triple("در صف ارسال", AmberWarning.copy(alpha = 0.2f), AmberWarning)
        SyncStatus.CONFLICT -> Triple("تداخل وضعیت", CrimsonError.copy(alpha = 0.2f), CrimsonError)
        SyncStatus.FAILED -> Triple("خطای ارسال", CrimsonError.copy(alpha = 0.2f), CrimsonError)
        null -> Triple("در انتظار", BorderColor, TextSecondary)
    }

    Surface(
        color = bgColor,
        shape = RoundedCornerShape(6.dp)
    ) {
        Text(
            text = text,
            color = textColor,
            fontSize = 12.sp,
            fontWeight = FontWeight.Medium,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
        )
    }
}
