package ir.school.parent.di

import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import ir.school.parent.BuildConfig
import ir.school.parent.data.local.EncryptedPreferencesManager
import ir.school.parent.data.messaging.TokenManager
import ir.school.parent.data.remote.ParentApiService
import ir.school.parent.data.repository.ParentRepositoryImpl
import ir.school.parent.domain.repository.ParentRepository
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides
    @Singleton
    fun provideOkHttpClient(): OkHttpClient {
        val logging = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }
        return OkHttpClient.Builder()
            .addInterceptor(logging)
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(15, TimeUnit.SECONDS)
            .writeTimeout(15, TimeUnit.SECONDS)
            .build()
    }

    @Provides
    @Singleton
    fun provideParentApiService(okHttpClient: OkHttpClient): ParentApiService {
        return Retrofit.Builder()
            .baseUrl(BuildConfig.BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ParentApiService::class.java)
    }

    @Provides
    @Singleton
    fun provideParentRepository(
        api: ParentApiService,
        prefs: EncryptedPreferencesManager,
        tokenManager: TokenManager
    ): ParentRepository {
        return ParentRepositoryImpl(api, prefs, tokenManager)
    }
}
