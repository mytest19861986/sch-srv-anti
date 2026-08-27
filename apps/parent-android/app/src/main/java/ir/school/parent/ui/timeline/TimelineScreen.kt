package ir.school.parent.ui.timeline

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.DirectionsBus
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ir.school.parent.R
import ir.school.parent.domain.model.TimelineEvent
import ir.school.parent.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TimelineScreen(
    viewModel: TimelineViewModel,
    onBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = stringResource(R.string.timeline_title),
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "بازگشت")
                    }
                },
                actions = {
                    IconButton(onClick = { viewModel.loadTimeline() }) {
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
                is TimelineUiState.Loading -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = ParentPrimaryGreen)
                    }
                }
                is TimelineUiState.Error -> {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(24.dp),
                        verticalArrangement = Arrangement.Center,
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(text = state.message, color = SoftError)
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(onClick = { viewModel.loadTimeline() }) {
                            Text(text = "تلاش مجدد")
                        }
                    }
                }
                is TimelineUiState.Success -> {
                    if (state.events.isEmpty()) {
                        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            Text(text = "رویدادی برای امروز ثبت نشده است.", color = ParentTextSecondary)
                        }
                    } else {
                        LazyColumn(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(16.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            items(state.events, key = { it.eventId }) { event ->
                                TimelineCard(event = event)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun TimelineCard(event: TimelineEvent) {
    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = ParentCardBg),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Surface(
                shape = CircleShape,
                color = if (event.eventType == "PICKED_UP") ParentSecondaryBlue.copy(alpha = 0.2f) else ParentPrimaryGreen.copy(alpha = 0.2f),
                modifier = Modifier.size(40.dp)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        if (event.eventType == "PICKED_UP") Icons.Default.DirectionsBus else Icons.Default.Check,
                        contentDescription = null,
                        tint = if (event.eventType == "PICKED_UP") ParentSecondaryBlue else ParentPrimaryGreen,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }

            Column(modifier = Modifier.weight(1f)) {
                Text(text = event.title, fontWeight = FontWeight.Bold, color = ParentTextPrimary, fontSize = 15.sp)
                Spacer(modifier = Modifier.height(2.dp))
                Text(text = event.description, color = ParentTextSecondary, fontSize = 13.sp)
                if (event.driverName != null) {
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(text = "راننده: ${event.driverName}", color = ParentTextSecondary.copy(alpha = 0.7f), fontSize = 12.sp)
                }
            }

            Text(
                text = event.timestamp.substringAfter("T").substringBefore(".").take(5),
                color = ParentTextSecondary,
                fontSize = 12.sp,
                fontWeight = FontWeight.Medium
            )
        }
    }
}
