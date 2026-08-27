package ir.school.parent.ui.home

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ir.school.parent.R
import ir.school.parent.domain.model.ChildLiveStatus
import ir.school.parent.domain.model.ChildModel
import ir.school.parent.domain.model.ChildState
import ir.school.parent.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    viewModel: HomeViewModel,
    onNavigateTimeline: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(Unit) {
        viewModel.loadInitialData()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = stringResource(R.string.home_title),
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp
                    )
                },
                actions = {
                    IconButton(onClick = { viewModel.refreshCurrentChild() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "به‌روزرسانی")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = ParentSurfaceDark,
                    titleContentColor = ParentTextPrimary
                )
            )
        },
        containerColor = ParentBackground,
        modifier = modifier
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            when (val state = uiState) {
                is HomeUiState.Loading -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = ParentPrimaryGreen)
                    }
                }
                is HomeUiState.Error -> {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(24.dp),
                        verticalArrangement = Arrangement.Center,
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(Icons.Default.Warning, contentDescription = null, tint = SoftError, modifier = Modifier.size(48.dp))
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(text = state.message, color = SoftError, fontSize = 16.sp)
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(onClick = { viewModel.loadInitialData() }) {
                            Text(text = "تلاش مجدد")
                        }
                    }
                }
                is HomeUiState.Success -> {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        // Child Selector (if multi-child)
                        if (state.children.size > 1) {
                            ChildSelectorRow(
                                children = state.children,
                                selectedChildId = state.selectedChildId,
                                onSelect = { viewModel.selectChild(it) }
                            )
                        }

                        val currentChild = state.children.find { it.childId == state.selectedChildId }

                        // Live Status Card
                        LiveStatusHeroCard(
                            child = currentChild,
                            status = state.liveStatus,
                            onViewTimeline = { onNavigateTimeline(state.selectedChildId) }
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun ChildSelectorRow(
    children: List<ChildModel>,
    selectedChildId: String,
    onSelect: (String) -> Unit
) {
    LazyRow(
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        items(children, key = { it.childId }) { child ->
            val isSelected = child.childId == selectedChildId
            val bg = if (isSelected) ParentPrimaryGreen else ParentSurfaceDark
            val textCol = if (isSelected) ParentTextPrimary else ParentTextSecondary

            Surface(
                shape = RoundedCornerShape(12.dp),
                color = bg,
                modifier = Modifier.clickable { onSelect(child.childId) }
            ) {
                Text(
                    text = child.fullName,
                    color = textCol,
                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp)
                )
            }
        }
    }
}

@Composable
fun LiveStatusHeroCard(
    child: ChildModel?,
    status: ChildLiveStatus?,
    onViewTimeline: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = ParentCardBg),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp)
        ) {
            if (child != null) {
                Text(text = child.fullName, fontSize = 20.sp, fontWeight = FontWeight.Bold, color = ParentTextPrimary)
                Spacer(modifier = Modifier.height(4.dp))
                Text(text = "${child.schoolName} - ${child.grade}", color = ParentTextSecondary, fontSize = 14.sp)
                Spacer(modifier = Modifier.height(16.dp))
            }

            // Status Badge & Info
            if (status != null) {
                val (title, icon, color) = when (status.state) {
                    ChildState.IN_SCHOOL -> Triple("در مدرسه", Icons.Default.School, ParentPrimaryGreen)
                    ChildState.PICKED_UP -> Triple("سوار سرویس شد (در مسیر)", Icons.Default.DirectionsBus, ParentSecondaryBlue)
                    ChildState.DROPPED_OFF -> Triple("پیاده شد (رسید به مقصد)", Icons.Default.CheckCircle, ParentPrimaryGreen)
                    ChildState.ABSENT -> Triple("غیبت ثبت شده", Icons.Default.EventBusy, CalmAmber)
                    ChildState.UNKNOWN -> Triple("در انتظار شروع شیفت", Icons.Default.Schedule, ParentTextSecondary)
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Icon(icon, contentDescription = null, tint = color, modifier = Modifier.size(32.dp))
                    Column {
                        Text(text = title, fontWeight = FontWeight.Bold, fontSize = 16.sp, color = color)
                        Text(text = "راننده: ${status.driverName}", color = ParentTextSecondary, fontSize = 13.sp)
                    }
                }
            } else {
                CircularProgressIndicator(color = ParentPrimaryGreen, modifier = Modifier.size(24.dp))
            }

            Spacer(modifier = Modifier.height(20.dp))

            Button(
                onClick = onViewTimeline,
                colors = ButtonDefaults.buttonColors(containerColor = ParentSecondaryBlue),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.fillMaxWidth().height(44.dp)
            ) {
                Icon(Icons.Default.Timeline, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text(text = "مشاهده تایم‌لاین رویدادها", fontWeight = FontWeight.Bold)
            }
        }
    }
}
