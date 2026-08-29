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
    data class Error(val message: String, val fullDetails: String? = null) : ParentLoginState
}

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val repository: ParentRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<ParentLoginState>(ParentLoginState.Idle)
    val uiState: StateFlow<ParentLoginState> = _uiState.asStateFlow()

    fun login(email: String, password: String, targetUrl: String = "") {
        if (email.isBlank() || password.isBlank()) {
            _uiState.value = ParentLoginState.Error("لطفاً نام کاربری و رمز عبور را وارد کنید")
            return
        }

        viewModelScope.launch {
            _uiState.value = ParentLoginState.Loading
            val urlClean = targetUrl.trim().trimEnd('/')
            repository.login(email.trim(), password)
                .onSuccess {
                    _uiState.value = ParentLoginState.Success
                }
                .onFailure { error ->
                    val cleanMsg = if (error.message == "INVALID_CREDENTIALS") {
                        "ایمیل یا رمز عبور اشتباه است"
                    } else {
                        "خطا در برقراری ارتباط با سرور:\n$urlClean/api/v1/auth/login\nعلت: ${error.javaClass.simpleName}: ${error.message}"
                    }
                    _uiState.value = ParentLoginState.Error(cleanMsg)
                }
        }
    }
}
