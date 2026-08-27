package ir.school.parent.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import ir.school.parent.domain.model.ChildLiveStatus
import ir.school.parent.domain.model.ChildModel
import ir.school.parent.domain.repository.ParentRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed interface HomeUiState {
    object Loading : HomeUiState
    data class Success(
        val children: List<ChildModel>,
        val selectedChildId: String,
        val liveStatus: ChildLiveStatus?
    ) : HomeUiState
    data class Error(val message: String) : HomeUiState
}

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val repository: ParentRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<HomeUiState>(HomeUiState.Loading)
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    private var currentChildren: List<ChildModel> = emptyList()
    private var currentSelectedId: String = ""

    fun loadInitialData() {
        viewModelScope.launch {
            _uiState.value = HomeUiState.Loading
            repository.getChildren()
                .onSuccess { list ->
                    if (list.isEmpty()) {
                        _uiState.value = HomeUiState.Error("دانش‌آموزی به این حساب متصل نیست")
                        return@onSuccess
                    }
                    currentChildren = list
                    currentSelectedId = list.first().childId
                    fetchStatusForChild(currentSelectedId)
                }
                .onFailure {
                    _uiState.value = HomeUiState.Error("خطا در دریافت لیست دانش‌آموزان")
                }
        }
    }

    fun selectChild(childId: String) {
        if (childId == currentSelectedId) return
        currentSelectedId = childId
        fetchStatusForChild(childId)
    }

    fun refreshCurrentChild() {
        if (currentSelectedId.isNotBlank()) {
            fetchStatusForChild(currentSelectedId)
        }
    }

    private fun fetchStatusForChild(childId: String) {
        viewModelScope.launch {
            _uiState.value = HomeUiState.Success(
                children = currentChildren,
                selectedChildId = childId,
                liveStatus = null // Show shimmer while loading status
            )

            repository.getChildStatus(childId)
                .onSuccess { status ->
                    _uiState.value = HomeUiState.Success(
                        children = currentChildren,
                        selectedChildId = childId,
                        liveStatus = status
                    )
                }
                .onFailure {
                    _uiState.value = HomeUiState.Success(
                        children = currentChildren,
                        selectedChildId = childId,
                        liveStatus = null
                    )
                }
        }
    }
}
