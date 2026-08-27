package ir.school.parent.ui.login

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import ir.school.parent.domain.repository.ParentRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed interface ParentLoginState {
    object Idle : ParentLoginState
    object Loading : ParentLoginState
    object Success : ParentLoginState
    data class Error(val message: String) : ParentLoginState
}

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val repository: ParentRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<ParentLoginState>(ParentLoginState.Idle)
    val uiState: StateFlow<ParentLoginState> = _uiState.asStateFlow()

    fun login(email: String, password: String) {
        if (email.isBlank() || password.isBlank()) {
            _uiState.value = ParentLoginState.Error("لطفاً شماره تماس و رمز عبور را وارد کنید")
            return
        }

        viewModelScope.launch {
            _uiState.value = ParentLoginState.Loading
            repository.login(email.trim(), password)
                .onSuccess {
                    _uiState.value = ParentLoginState.Success
                }
                .onFailure {
                    _uiState.value = ParentLoginState.Error("نام کاربری یا رمز عبور اشتباه است")
                }
        }
    }
}
