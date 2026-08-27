package ir.school.driver.ui.manifest

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import ir.school.driver.data.local.AttendanceType
import ir.school.driver.data.local.LocalAttendanceEvent
import ir.school.driver.domain.model.DriverManifest
import ir.school.driver.domain.model.StudentManifestItem
import ir.school.driver.domain.repository.AttendanceRepository
import ir.school.driver.domain.sync.SyncEngine
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed interface ManifestUiState {
    object Loading : ManifestUiState
    data class Success(val manifest: DriverManifest) : ManifestUiState
    data class Error(val message: String) : ManifestUiState
}

@HiltViewModel
class ManifestViewModel @Inject constructor(
    private val repository: AttendanceRepository,
    private val syncEngine: SyncEngine
) : ViewModel() {

    private val _rawManifest = MutableStateFlow<DriverManifest?>(null)
    private val _isLoading = MutableStateFlow(true)
    private val _errorMessage = MutableStateFlow<String?>(null)
    private val _isSyncing = MutableStateFlow(false)

    val isSyncing: StateFlow<Boolean> = _isSyncing.asStateFlow()

    val uiState: StateFlow<ManifestUiState> = combine(
        _rawManifest,
        repository.getLocalEventsFlow(),
        _isLoading,
        _errorMessage
    ) { manifest, localEvents, loading, error ->
        if (loading) return@combine ManifestUiState.Loading
        if (error != null) return@combine ManifestUiState.Error(error)
        if (manifest == null) return@combine ManifestUiState.Loading

        val eventMap = localEvents.associateBy { it.studentId }

        val mergedStudents = manifest.students.map { student ->
            val local = eventMap[student.studentId]
            if (local != null) {
                student.copy(
                    localSyncStatus = local.syncStatus,
                    localEventType = local.eventType
                )
            } else {
                student
            }
        }

        ManifestUiState.Success(manifest.copy(students = mergedStudents))
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), ManifestUiState.Loading)

    fun loadManifest(shiftId: String = "shift-active-1") {
        viewModelScope.launch {
            _isLoading.value = true
            _errorMessage.value = null
            repository.fetchManifest(shiftId)
                .onSuccess { manifest ->
                    _rawManifest.value = manifest
                    _isLoading.value = false
                }
                .onFailure { error ->
                    _errorMessage.value = error.message ?: "خطا در دریافت مانیفست"
                    _isLoading.value = false
                }
        }
    }

    fun recordAttendance(studentId: String, serviceId: String, type: AttendanceType) {
        viewModelScope.launch {
            repository.recordAttendance(studentId, serviceId, type)
            // Trigger optimistic background sync
            triggerManualSync()
        }
    }

    fun triggerManualSync() {
        viewModelScope.launch {
            _isSyncing.value = true
            try {
                syncEngine.syncPendingEvents()
            } finally {
                _isSyncing.value = false
            }
        }
    }
}
