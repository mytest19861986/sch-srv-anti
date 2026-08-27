package ir.school.parent.ui.timeline

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import ir.school.parent.domain.model.TimelineEvent
import ir.school.parent.domain.repository.ParentRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed interface TimelineUiState {
    object Loading : TimelineUiState
    data class Success(val events: List<TimelineEvent>) : TimelineUiState
    data class Error(val message: String) : TimelineUiState
}

@HiltViewModel
class TimelineViewModel @Inject constructor(
    private val repository: ParentRepository,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val childId: String = checkNotNull(savedStateHandle["childId"])

    private val _uiState = MutableStateFlow<TimelineUiState>(TimelineUiState.Loading)
    val uiState: StateFlow<TimelineUiState> = _uiState.asStateFlow()

    init {
        loadTimeline()
    }

    fun loadTimeline() {
        viewModelScope.launch {
            _uiState.value = TimelineUiState.Loading
            repository.getChildTimeline(childId)
                .onSuccess { events ->
                    _uiState.value = TimelineUiState.Success(events)
                }
                .onFailure { error ->
                    _uiState.value = TimelineUiState.Error(error.message ?: "خطا در واکشی تایم‌لاین")
                }
        }
    }
}
